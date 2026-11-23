import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GeneralGame } from "../domain/GeneralGame.js";
import { Player } from "../domain/Player.js";

function createPlayers(count = 2) {
  const names = ["Alice", "Bob", "Charlie", "Diana"];
  return names.slice(0, count).map((name) => new Player(name));
}

describe("GeneralGame", () => {
  describe("constructor", () => {
    it("initializes with correct defaults", () => {
      const players = createPlayers(2);
      const game = new GeneralGame(players);
      assert.equal(game.currentRound, 1);
      assert.equal(game.maxRounds, 12);
      assert.equal(game.roundStarterPlayer, null);
      assert.equal(game.players.length, 2);
    });
  });

  describe("getActivePlayer", () => {
    it("returns the player whose isActive is true", () => {
      const players = createPlayers(2);
      players[0].isActive = true;
      const game = new GeneralGame(players);
      assert.equal(game.getActivePlayer(), players[0]);
    });

    it("returns undefined when no player is active", () => {
      const players = createPlayers(2);
      const game = new GeneralGame(players);
      assert.equal(game.getActivePlayer(), undefined);
    });
  });

  describe("advanceTurn", () => {
    it("passes turn to the next player", () => {
      const players = createPlayers(3);
      players[0].isActive = true;
      const game = new GeneralGame(players);
      game.roundStarterPlayer = players[0];

      game.advanceTurn();
      assert.equal(players[0].isActive, false);
      assert.equal(players[1].isActive, true);
    });

    it("wraps around to the first player after the last", () => {
      const players = createPlayers(2);
      players[1].isActive = true;
      const game = new GeneralGame(players);
      game.roundStarterPlayer = players[0];

      game.advanceTurn();
      assert.equal(players[1].isActive, false);
      assert.equal(players[0].isActive, true);
    });

    it("increments round when returning to the round starter", () => {
      const players = createPlayers(2);
      players[1].isActive = true;
      const game = new GeneralGame(players);
      game.roundStarterPlayer = players[0];

      assert.equal(game.currentRound, 1);
      game.advanceTurn(); // wraps to player[0] = roundStarter
      assert.equal(game.currentRound, 2);
    });

    it("does not increment round mid-rotation", () => {
      const players = createPlayers(3);
      players[0].isActive = true;
      const game = new GeneralGame(players);
      game.roundStarterPlayer = players[0];

      game.advanceTurn(); // player[0] → player[1]
      assert.equal(game.currentRound, 1);
    });
  });

  describe("getWinner", () => {
    it("returns the player with the highest score", () => {
      const players = createPlayers(3);
      players[0].totalScore = 50;
      players[1].totalScore = 120;
      players[2].totalScore = 80;
      const game = new GeneralGame(players);
      assert.equal(game.getWinner(), players[1]);
    });
  });

  describe("getRanking", () => {
    it("returns players sorted by score descending", () => {
      const players = createPlayers(3);
      players[0].totalScore = 50;
      players[1].totalScore = 120;
      players[2].totalScore = 80;
      const game = new GeneralGame(players);
      const ranking = game.getRanking();
      assert.equal(ranking[0].name, "Bob");
      assert.equal(ranking[1].name, "Charlie");
      assert.equal(ranking[2].name, "Alice");
    });
  });

  describe("isGameOver", () => {
    it("returns false during the game", () => {
      const game = new GeneralGame(createPlayers(2));
      assert.equal(game.isGameOver(), false);
    });

    it("returns true when currentRound exceeds maxRounds", () => {
      const game = new GeneralGame(createPlayers(2));
      game.currentRound = 13;
      assert.equal(game.isGameOver(), true);
    });
  });

  describe("turn actions", () => {
    it("rolls, locks by index, re-rolls unlocked dice, and keeps the lock", () => {
      const players = createPlayers(1);
      const game = new GeneralGame(players, dieFaces(2, 3, 4, 5, 6, 1, 1));
      players[0].isActive = true;
      game.beginTurn();

      const rolled = game.roll();
      assert.equal(rolled.ok, true);
      assert.deepEqual(rolled.dice, [2, 3, 4, 5, 6]);
      assert.deepEqual(game.getTurnActions(), ["toggle_lock", "reroll", "score"]);

      assert.equal(game.toggleLock(0).locked, true);
      assert.equal(game.toggleLock(2).locked, true);
      assert.equal(game.toggleLock(4).locked, true);
      assert.equal(game.toggleLock(0).locked, false);
      assert.equal(game.toggleLock(0).locked, true);

      const rerolled = game.reroll();
      assert.equal(rerolled.ok, true);
      assert.deepEqual(rerolled.dice, [2, 1, 4, 1, 6]);
      assert.deepEqual(game.locked, [true, false, true, false, true]);
      assert.equal(players[0].rollsRemaining, 1);
    });

    it("rejects a re-roll when every die is locked", () => {
      const players = createPlayers(1);
      const game = new GeneralGame(players, () => 0);
      players[0].isActive = true;
      game.beginTurn();
      game.roll();

      for (let index = 0; index < 5; index++) game.toggleLock(index);
      const before = players[0].rollsRemaining;
      const result = game.reroll();

      assert.equal(result.ok, false);
      assert.equal(players[0].rollsRemaining, before);
      assert.deepEqual(game.dice, [1, 1, 1, 1, 1]);
    });

    it("rejects scoring and locking before the first roll", () => {
      const players = createPlayers(1);
      const game = new GeneralGame(players, () => 0);
      players[0].isActive = true;
      game.beginTurn();

      assert.equal(game.score("aces").ok, false);
      assert.equal(game.toggleLock(0).ok, false);
      assert.equal(players[0].scorecard.aces, null);
    });

    it("doubles the score when the category is taken on the first roll", () => {
      const players = createPlayers(1);
      const game = new GeneralGame(players, () => 0);
      players[0].isActive = true;
      game.beginTurn();
      game.roll();

      assert.equal(players[0].previewScore("aces", game.dice), 10);
      const result = game.score("aces");
      assert.equal(result.ok, true);
      assert.equal(result.scored, 10);
      assert.equal(result.bonus, true);
      assert.equal(players[0].totalScore, 10);
    });

    it("does not double after a re-roll", () => {
      const players = createPlayers(1);
      const game = new GeneralGame(players, () => 0);
      players[0].isActive = true;
      game.beginTurn();
      game.roll();
      game.reroll();

      assert.equal(players[0].previewScore("aces", game.dice), 5);
      const result = game.score("aces");
      assert.equal(result.bonus, false);
      assert.equal(result.scored, 5);
    });

    it("advances the round only after every seated player has taken a turn", () => {
      const players = createPlayers(3);
      const game = new GeneralGame(players, () => 0);
      game.startMatch();
      assert.equal(game.getActivePlayer().name, "Alice");

      game.roll();
      game.score("aces");
      assert.equal(game.currentRound, 1);
      assert.equal(game.getActivePlayer().name, "Bob");

      game.roll();
      game.score("twos");
      assert.equal(game.currentRound, 1);
      assert.equal(game.getActivePlayer().name, "Charlie");

      game.roll();
      game.score("threes");
      assert.equal(game.currentRound, 2);
      assert.equal(game.getActivePlayer().name, "Alice");
      assert.equal(game.turnPhase, "awaiting_roll");
    });

    it("ends the match when the last turn of round 12 is scored", () => {
      const players = createPlayers(2);
      const game = new GeneralGame(players, () => 0);
      game.currentRound = 12;
      game.playedThisRound.add(players[0]);
      players[1].isActive = true;
      game.beginTurn();
      game.roll();
      game.score("aces");

      assert.equal(game.isGameOver(), true);
      assert.equal(game.turnPhase, null);
      assert.equal(game.getActivePlayer(), undefined);
    });
  });

  describe("removePlayer", () => {
    it("discards the active turn and gives the next player a fresh roll", () => {
      const players = createPlayers(3);
      const game = new GeneralGame(players, () => 0);
      players[0].isActive = true;
      game.beginTurn();
      game.roll();
      game.toggleLock(1);

      const removed = game.removePlayer(players[0]);
      assert.equal(removed.ok, true);
      assert.equal(game.dice, null);
      assert.equal(game.turnPhase, "awaiting_roll");
      assert.equal(game.getActivePlayer().name, "Bob");
      assert.equal(game.currentRound, 1);
      assert.deepEqual(game.players.map((player) => player.name), ["Bob", "Charlie"]);
    });

    it("keeps the current dice when someone else leaves", () => {
      const players = createPlayers(3);
      const game = new GeneralGame(players, () => 0);
      players[0].isActive = true;
      game.beginTurn();
      game.roll();

      game.removePlayer(players[2]);
      assert.deepEqual(game.dice, [1, 1, 1, 1, 1]);
      assert.equal(game.getActivePlayer().name, "Alice");
      assert.equal(game.turnPhase, "choosing");
    });

    it("starts the next round when the last pending player drops", () => {
      const players = createPlayers(3);
      const game = new GeneralGame(players, () => 0);
      game.playedThisRound.add(players[0]);
      game.playedThisRound.add(players[1]);
      players[2].isActive = true;
      game.beginTurn();

      game.removePlayer(players[2]);
      assert.equal(game.currentRound, 2);
      assert.equal(game.getActivePlayer().name, "Alice");
      assert.equal(game.playedThisRound.size, 0);
      assert.equal(game.turnPhase, "awaiting_roll");
    });
  });
});

/** Math.random-shaped RNG that yields the requested die faces, in order. */
function dieFaces(...faces) {
  let cursor = 0;
  return () => {
    const face = faces[cursor] ?? 1;
    cursor += 1;
    return (face - 1) / 6 + 1e-9;
  };
}
