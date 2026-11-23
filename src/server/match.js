import { detectSpecialCombinations } from "../domain/combinations.js";
import { GeneralGame } from "../domain/GeneralGame.js";
import { CATEGORY_KEYS, CATEGORY_LABELS, Player } from "../domain/Player.js";
import { MAX_PLAYERS, MAX_ROUNDS, MIN_PLAYERS } from "../shared/constants.js";
import { ClientMessage, ServerMessage } from "../shared/protocol.js";
import { isValidName } from "../shared/validators.js";

/**
 * One authoritative room. The network layer drains `outbox` after each call.
 */
export class Match {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.phase = "lobby";
    this.players = [];
    this.game = null;
    this.nextId = 1;
    this.lastAction = null;
    this.result = null;
    this.outbox = [];
  }

  handle(connectionId, message) {
    if (!message || typeof message.type !== "string") {
      this.fail(connectionId, "Invalid message.");
      return;
    }

    switch (message.type) {
      case ClientMessage.JOIN:
        this.join(connectionId, message.nickname);
        break;
      case ClientMessage.START:
        this.start(connectionId);
        break;
      case ClientMessage.ROLL:
      case ClientMessage.TOGGLE_LOCK:
      case ClientMessage.REROLL:
      case ClientMessage.SCORE:
        this.act(connectionId, message);
        break;
      default:
        this.fail(connectionId, "Unknown message.");
    }
  }

  join(connectionId, nickname) {
    if (this.phase !== "lobby") {
      this.reject(connectionId, "The match has already started.");
      return;
    }
    if (this.byConnection(connectionId)) {
      this.reject(connectionId, "You are already in the room.");
      return;
    }

    const name = typeof nickname === "string" ? nickname.trim() : "";
    if (!isValidName(name)) {
      this.reject(connectionId, "Invalid nickname. Use only letters and spaces.");
      return;
    }
    if (this.players.length >= MAX_PLAYERS) {
      this.reject(connectionId, "The room is full.");
      return;
    }
    if (this.players.some((record) => record.nickname.toLowerCase() === name.toLowerCase())) {
      this.reject(connectionId, "This nickname is already taken.");
      return;
    }

    const id = `p${this.nextId++}`;
    const player = new Player(name);
    player.id = id;
    const record = {
      id,
      connectionId,
      nickname: name,
      connected: true,
      isHost: this.players.length === 0,
      player,
    };
    this.players.push(record);
    this.lastAction = { type: "join", playerId: id, nickname: name };
    this.emit(connectionId, {
      type: ServerMessage.WELCOME,
      playerId: id,
      isHost: record.isHost,
    });
    this.broadcastState();
  }

  start(connectionId) {
    if (this.phase !== "lobby") {
      this.fail(connectionId, "The match is not in the lobby.");
      return;
    }
    const actor = this.byConnection(connectionId);
    if (!actor) {
      this.fail(connectionId, "You are not in the room.");
      return;
    }
    if (!actor.isHost) {
      this.fail(connectionId, "Only the host can start the match.");
      return;
    }
    if (this.players.length < MIN_PLAYERS) {
      this.fail(connectionId, "At least 2 players are required.");
      return;
    }

    this.phase = "playing";
    this.game = new GeneralGame(
      this.players.map((record) => record.player),
      this.rng,
    );
    this.game.startMatch();
    this.result = null;
    this.lastAction = { type: "start", playerId: actor.id, nickname: actor.nickname };
    this.broadcastState();
    this.promptActive();
  }

  act(connectionId, message) {
    if (this.phase !== "playing") {
      this.fail(connectionId, "The match is not in progress.");
      return;
    }

    const actor = this.byConnection(connectionId);
    if (!actor) {
      this.fail(connectionId, "You are not in the room.");
      return;
    }

    const active = this.game.getActivePlayer();
    if (!active || actor.player !== active) {
      this.fail(connectionId, "It is not your turn.");
      return;
    }

    let result;
    switch (message.type) {
      case ClientMessage.ROLL:
        result = this.game.roll();
        break;
      case ClientMessage.TOGGLE_LOCK:
        result = this.game.toggleLock(message.index);
        break;
      case ClientMessage.REROLL:
        result = this.game.reroll();
        break;
      case ClientMessage.SCORE:
        result = this.game.score(message.categoryKey);
        break;
      default:
        result = { ok: false, error: "Unknown message." };
    }

    if (!result.ok) {
      this.fail(connectionId, result.error);
      this.promptActive();
      return;
    }

    this.lastAction = describeAction(actor, message, result);
    if (this.game.isGameOver()) {
      this.finishNormally();
      return;
    }
    this.broadcastState();
    this.promptActive();
  }

  disconnect(connectionId) {
    const actor = this.byConnection(connectionId);
    if (!actor) return;

    if (this.phase === "lobby") {
      this.removeFromLobby(actor);
      return;
    }

    if (this.phase === "playing") {
      this.removeFromMatch(actor);
      return;
    }

    this.players = this.players.filter((record) => record !== actor);
    if (this.players.length === 0) this.resetLobby();
  }

  removeFromLobby(actor) {
    const wasHost = actor.isHost;
    this.players = this.players.filter((record) => record !== actor);
    if (wasHost) {
      for (const record of this.players) record.isHost = false;
      if (this.players[0]) this.players[0].isHost = true;
    }
    this.lastAction = { type: "leave", playerId: actor.id, nickname: actor.nickname };
    this.broadcastState();
  }

  removeFromMatch(actor) {
    this.game.removePlayer(actor.player);
    this.players = this.players.filter((record) => record !== actor);
    this.lastAction = {
      type: "disconnect",
      playerId: actor.id,
      nickname: actor.nickname,
    };

    if (this.players.length < MIN_PLAYERS) {
      this.abort();
      return;
    }
    if (this.game.isGameOver()) {
      this.finishNormally();
      return;
    }
    this.broadcastState();
    this.promptActive();
  }

  finishNormally() {
    this.phase = "finished";
    const winner = this.game.getWinner();
    this.result = {
      reason: "completed",
      winnerId: this.recordForPlayer(winner)?.id ?? null,
      ranking: this.game.getRanking().map((player) => this.rankEntry(player)),
    };
    this.broadcastState();
  }

  abort() {
    this.phase = "aborted";
    const ranking = [...this.players].sort(
      (a, b) => b.player.totalScore - a.player.totalScore,
    );
    this.result = {
      reason: "not_enough_players",
      winnerId: null,
      ranking: ranking.map((record) => ({
        id: record.id,
        nickname: record.nickname,
        totalScore: record.player.totalScore,
      })),
    };
    this.broadcastState();
  }

  resetLobby() {
    this.phase = "lobby";
    this.players = [];
    this.game = null;
    this.lastAction = null;
    this.result = null;
  }

  snapshot() {
    const active = this.game?.getActivePlayer() ?? null;
    const activeRecord = active ? this.recordForPlayer(active) : null;
    let turn = null;

    if (this.phase === "playing" && this.game?.turnPhase && activeRecord) {
      const dice = this.game.dice ? [...this.game.dice] : null;
      turn = {
        playerId: activeRecord.id,
        phase: this.game.turnPhase,
        dice,
        locked: [...this.game.locked],
        rollsRemaining: active.rollsRemaining,
        specials: dice ? detectSpecialCombinations(dice, active.scorecard) : [],
        previews: dice ? buildPreviews(active, dice) : [],
      };
    }

    return {
      phase: this.phase,
      round: this.game?.currentRound ?? 1,
      maxRounds: this.game?.maxRounds ?? MAX_ROUNDS,
      hostId: this.players.find((record) => record.isHost)?.id ?? null,
      players: this.players.map((record) => ({
        id: record.id,
        nickname: record.nickname,
        connected: record.connected,
        isActive: record.player.isActive,
        totalScore: record.player.totalScore,
        rollsRemaining: record.player.rollsRemaining,
        scorecard: { ...record.player.scorecard },
      })),
      turn,
      lastAction: this.lastAction,
      result: this.result,
    };
  }

  promptActive() {
    const active = this.game?.getActivePlayer();
    const record = active ? this.recordForPlayer(active) : null;
    if (!record) return;
    this.emit(record.connectionId, {
      type: ServerMessage.PROMPT,
      actions: this.game.getTurnActions(),
    });
  }

  broadcastState() {
    const message = { type: ServerMessage.STATE, payload: this.snapshot() };
    for (const record of this.players) {
      this.emit(record.connectionId, message);
    }
  }

  rankEntry(player) {
    const record = this.recordForPlayer(player);
    return {
      id: record.id,
      nickname: record.nickname,
      totalScore: player.totalScore,
    };
  }

  recordForPlayer(player) {
    return this.players.find((record) => record.player === player) ?? null;
  }

  byConnection(connectionId) {
    return this.players.find((record) => record.connectionId === connectionId) ?? null;
  }

  emit(target, message) {
    this.outbox.push({ target, message });
  }

  fail(connectionId, message) {
    this.emit(connectionId, { type: ServerMessage.ERROR, message });
  }

  reject(connectionId, message) {
    this.emit(connectionId, { type: ServerMessage.REJECT, message });
  }

  drain() {
    const events = this.outbox;
    this.outbox = [];
    return events;
  }
}

function buildPreviews(player, dice) {
  return CATEGORY_KEYS.map((categoryKey, index) => {
    const filled = player.scorecard[categoryKey] !== null;
    return {
      categoryKey,
      label: CATEGORY_LABELS[categoryKey],
      menuNumber: index + 1,
      available: !filled,
      score: filled
        ? player.scorecard[categoryKey]
        : player.previewScore(categoryKey, dice),
    };
  });
}

function describeAction(actor, message, result) {
  const base = { playerId: actor.id, nickname: actor.nickname };
  switch (message.type) {
    case ClientMessage.ROLL:
      return { ...base, type: "roll" };
    case ClientMessage.TOGGLE_LOCK:
      return {
        ...base,
        type: "toggle_lock",
        index: result.index,
        locked: result.locked,
      };
    case ClientMessage.REROLL:
      return { ...base, type: "reroll" };
    case ClientMessage.SCORE:
      return {
        ...base,
        type: "score",
        categoryKey: result.categoryKey,
        scored: result.scored,
        bonus: result.bonus,
      };
    default:
      return { ...base, type: message.type };
  }
}
