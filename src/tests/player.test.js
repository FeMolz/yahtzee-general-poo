import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Player, CATEGORY_KEYS } from "../models/Player.js";

describe("Player", () => {
  describe("constructor", () => {
    it("initializes with correct defaults", () => {
      const player = new Player("Alice");
      assert.equal(player.name, "Alice");
      assert.equal(player.isActive, false);
      assert.equal(player.totalScore, 0);
      assert.equal(player.rollsRemaining, 3);
    });

    it("creates a scorecard with all categories set to null", () => {
      const player = new Player("Bob");
      for (const key of CATEGORY_KEYS) {
        assert.equal(player.scorecard[key], null);
      }
    });
  });

  describe("canRoll / useRoll", () => {
    it("can roll 3 times initially", () => {
      const player = new Player("Test");
      assert.equal(player.canRoll(), true);
      assert.equal(player.rollsRemaining, 3);
    });

    it("useRoll decrements remaining rolls", () => {
      const player = new Player("Test");
      player.useRoll();
      assert.equal(player.rollsRemaining, 2);
      player.useRoll();
      assert.equal(player.rollsRemaining, 1);
      player.useRoll();
      assert.equal(player.rollsRemaining, 0);
    });

    it("useRoll returns false when no rolls remain", () => {
      const player = new Player("Test");
      player.useRoll();
      player.useRoll();
      player.useRoll();
      assert.equal(player.useRoll(), false);
      assert.equal(player.canRoll(), false);
    });
  });

  describe("resetRolls", () => {
    it("restores rolls to 3", () => {
      const player = new Player("Test");
      player.useRoll();
      player.useRoll();
      player.resetRolls();
      assert.equal(player.rollsRemaining, 3);
    });
  });

  describe("applyFirstRollBonus", () => {
    it("doubles score when scored on first roll (rollsRemaining === 2)", () => {
      const player = new Player("Test");
      player.useRoll(); // rollsRemaining = 2
      assert.equal(player.applyFirstRollBonus(10), 20);
    });

    it("does not double when score is 0", () => {
      const player = new Player("Test");
      player.useRoll(); // rollsRemaining = 2
      assert.equal(player.applyFirstRollBonus(0), 0);
    });

    it("does not double after multiple rolls", () => {
      const player = new Player("Test");
      player.useRoll();
      player.useRoll(); // rollsRemaining = 1
      assert.equal(player.applyFirstRollBonus(10), 10);
    });
  });

  describe("fillCategory", () => {
    it("fills a category and updates total score", () => {
      const player = new Player("Test");
      const dice = [1, 1, 1, 2, 3];
      const result = player.fillCategory("aces", dice);
      assert.equal(result, true);
      assert.equal(player.scorecard.aces, 3);
      assert.equal(player.totalScore, 3);
    });

    it("returns false when category is already filled", () => {
      const player = new Player("Test");
      player.fillCategory("aces", [1, 1, 2, 3, 4]);
      const result = player.fillCategory("aces", [1, 1, 1, 1, 1]);
      assert.equal(result, false);
    });

    it("returns false for an invalid category key", () => {
      const player = new Player("Test");
      const result = player.fillCategory("invalidCategory", [1, 2, 3, 4, 5]);
      assert.equal(result, false);
    });
  });

  describe("getAvailableCategories", () => {
    it("returns all categories initially", () => {
      const player = new Player("Test");
      assert.equal(player.getAvailableCategories().length, 12);
    });

    it("excludes filled categories", () => {
      const player = new Player("Test");
      player.fillCategory("aces", [1, 1, 2, 3, 4]);
      const available = player.getAvailableCategories();
      assert.equal(available.length, 11);
      assert.equal(available.includes("aces"), false);
    });
  });
});
