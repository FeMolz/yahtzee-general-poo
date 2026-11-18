import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GeneralGame } from "../models/GeneralGame.js";
import { Player } from "../models/Player.js";

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
});
