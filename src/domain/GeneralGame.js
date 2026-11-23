import { MAX_ROUNDS } from "../shared/constants.js";
import { CATEGORY_KEYS } from "./Player.js";
import { createRoller, pickRandomPlayer } from "./dice.js";

const EMPTY_LOCKS = () => [false, false, false, false, false];

/**
 * GeneralGame – Authoritative match rules: rounds, turns, dice, and scoring.
 * Display and network live outside this class. `rng` is Math.random-shaped.
 */
export class GeneralGame {
  constructor(players, rng = Math.random) {
    this.players = players;
    this.currentRound = 1;
    this.maxRounds = MAX_ROUNDS;
    this.roundStarterPlayer = null;
    this.roller = createRoller(rng);
    this.rng = rng;

    /** 'awaiting_roll' | 'choosing' | null */
    this.turnPhase = null;
    this.dice = null;
    this.locked = EMPTY_LOCKS();
    /** Players who already finished a turn in the current round. */
    this.playedThisRound = new Set();
  }

  /** Returns the player whose turn it currently is. */
  getActivePlayer() {
    return this.players.find((player) => player.isActive);
  }

  /**
   * Advance to the next player's turn.
   * When the rotation returns to the round starter, a new round begins.
   * Kept for a stable roster; the server uses score() / removePlayer(),
   * which track the round with playedThisRound so a dropout cannot stall it.
   */
  advanceTurn() {
    const currentPlayer = this.getActivePlayer();
    currentPlayer.isActive = false;

    const currentIndex = this.players.indexOf(currentPlayer);
    const isLastPlayer = currentIndex === this.players.length - 1;
    const nextPlayer = isLastPlayer
      ? this.players[0]
      : this.players[currentIndex + 1];

    if (nextPlayer === this.roundStarterPlayer) {
      this.currentRound++;
    }

    nextPlayer.isActive = true;
  }

  /** Returns the player with the highest total score. */
  getWinner() {
    return this.players.reduce((best, player) =>
      player.totalScore > best.totalScore ? player : best
    );
  }

  /** Returns all players sorted by score descending. */
  getRanking() {
    return [...this.players].sort((a, b) => b.totalScore - a.totalScore);
  }

  /** Whether the game still has rounds to play. */
  isGameOver() {
    return this.currentRound > this.maxRounds;
  }

  /** Picks the opening player and opens their turn on awaiting_roll. */
  startMatch() {
    const starter = pickRandomPlayer(this.players, this.rng);
    this.roundStarterPlayer = starter;
    for (const player of this.players) {
      player.isActive = false;
    }
    starter.isActive = true;
    this.playedThisRound = new Set();
    this.beginTurn();
    return starter;
  }

  /** Clears dice and waits for the active player to roll. */
  beginTurn() {
    const player = this.getActivePlayer();
    player.resetRolls();
    this.dice = null;
    this.locked = EMPTY_LOCKS();
    this.turnPhase = "awaiting_roll";
  }

  /** Commands the active client is allowed to send right now. */
  getTurnActions() {
    if (this.turnPhase === "awaiting_roll") return ["roll"];
    if (this.turnPhase === "choosing") {
      return this.getActivePlayer().canRoll()
        ? ["toggle_lock", "reroll", "score"]
        : ["score"];
    }
    return [];
  }

  roll() {
    const player = this.getActivePlayer();
    if (!player) return fail("No active player.");
    if (this.turnPhase !== "awaiting_roll") return fail("You cannot roll right now.");
    if (!player.canRoll()) return fail("No rolls remaining.");

    this.dice = this.roller.rollAll();
    this.locked = EMPTY_LOCKS();
    player.useRoll();
    this.turnPhase = "choosing";
    return { ok: true, dice: [...this.dice] };
  }

  toggleLock(index) {
    const player = this.getActivePlayer();
    if (!player || this.turnPhase !== "choosing") {
      return fail("You cannot lock dice right now.");
    }
    if (!player.canRoll()) return fail("No rolls left. Choose a category.");
    if (!Number.isInteger(index) || index < 0 || index >= this.locked.length) {
      return fail("Die index must be from 0 to 4.");
    }

    this.locked[index] = !this.locked[index];
    return { ok: true, index, locked: this.locked[index] };
  }

  reroll() {
    const player = this.getActivePlayer();
    if (!player || this.turnPhase !== "choosing") {
      return fail("You cannot re-roll right now.");
    }
    if (!player.canRoll()) return fail("No rolls remaining.");
    if (this.locked.every(Boolean)) {
      return fail("Unlock at least one die to re-roll.");
    }

    this.dice = this.roller.rerollUnlocked(this.dice, this.locked);
    player.useRoll();
    return { ok: true, dice: [...this.dice] };
  }

  score(categoryKey) {
    const player = this.getActivePlayer();
    if (!player || this.turnPhase !== "choosing" || !this.dice) {
      return fail("Roll the dice before scoring.");
    }
    if (!CATEGORY_KEYS.includes(categoryKey)) return fail("Invalid category.");
    if (player.scorecard[categoryKey] !== null) {
      return fail("That category is already filled.");
    }

    const bonus = player.rollsRemaining === 2;
    const scoredPreview = player.previewScore(categoryKey, this.dice);
    const success = player.fillCategory(categoryKey, this.dice);
    if (!success) return fail("Invalid category.");

    const scored = player.scorecard[categoryKey];
    this.finishTurn();
    return {
      ok: true,
      categoryKey,
      scored,
      bonus: bonus && scoredPreview > 0,
    };
  }

  /**
   * Drops a player immediately. If it was their turn, the dice are discarded
   * and the next remaining player plays. A round completes when every player
   * still seated has finished a turn.
   */
  removePlayer(player) {
    const index = this.players.indexOf(player);
    if (index < 0) return fail("Player not in the game.");

    const wasActive = player.isActive;
    player.isActive = false;
    this.playedThisRound.delete(player);
    this.players.splice(index, 1);

    if (this.roundStarterPlayer === player) {
      this.roundStarterPlayer = this.players[0] ?? null;
    }

    if (!wasActive || this.players.length === 0) {
      return { ok: true, wasActive };
    }

    this.dice = null;
    this.locked = EMPTY_LOCKS();
    this.turnPhase = null;

    if (this.players.every((seated) => this.playedThisRound.has(seated))) {
      this.currentRound += 1;
      this.playedThisRound.clear();
    }

    if (this.isGameOver()) return { ok: true, wasActive };

    const next = this.players[index % this.players.length];
    next.isActive = true;
    this.beginTurn();
    return { ok: true, wasActive };
  }

  finishTurn() {
    const current = this.getActivePlayer();
    current.isActive = false;
    current.resetRolls();
    this.playedThisRound.add(current);
    this.dice = null;
    this.locked = EMPTY_LOCKS();
    this.turnPhase = null;

    if (this.players.every((player) => this.playedThisRound.has(player))) {
      this.currentRound += 1;
      this.playedThisRound.clear();
      this.roundStarterPlayer = this.playerAfter(current);
    }

    if (this.isGameOver() || this.players.length === 0) return;

    const next = this.playerAfter(current);
    next.isActive = true;
    this.beginTurn();
  }

  playerAfter(player) {
    const index = this.players.indexOf(player);
    return this.players[(index + 1) % this.players.length];
  }
}

function fail(error) {
  return { ok: false, error };
}
