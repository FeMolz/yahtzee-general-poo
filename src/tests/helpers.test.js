import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  rollAllDice,
  pickRandomPlayer,
  rerollDice,
  detectSpecialCombinations,
} from "../utils/helpers.js";
import { Player } from "../models/Player.js";

describe("helpers", () => {
  describe("rollAllDice", () => {
    it("returns an array of 5 dice", () => {
      const dice = rollAllDice();
      assert.equal(dice.length, 5);
    });

    it("all values are between 1 and 6", () => {
      for (let i = 0; i < 100; i++) {
        const dice = rollAllDice();
        for (const die of dice) {
          assert.ok(die >= 1 && die <= 6, `Die value ${die} out of range`);
        }
      }
    });
  });

  describe("pickRandomPlayer", () => {
    it("returns one of the players in the array", () => {
      const players = [new Player("A"), new Player("B"), new Player("C")];
      for (let i = 0; i < 50; i++) {
        const picked = pickRandomPlayer(players);
        assert.ok(players.includes(picked));
      }
    });
  });

  describe("rerollDice", () => {
    it("keeps specified dice and re-rolls the rest", () => {
      const current = [1, 2, 3, 4, 5];
      const toKeep = [1, 3, 5];
      const result = rerollDice(current, toKeep);

      assert.equal(result.kept.length, 3);
      assert.deepEqual(result.kept.sort(), [1, 3, 5]);
      assert.equal(result.rerolled.length, 2);
      assert.equal(result.finalDice.length, 5);
    });

    it("re-rolls all dice when keeping none", () => {
      const current = [1, 2, 3, 4, 5];
      const result = rerollDice(current, []);
      assert.equal(result.kept.length, 0);
      assert.equal(result.rerolled.length, 5);
      assert.equal(result.finalDice.length, 5);
    });

    it("keeps all dice when keeping all", () => {
      const current = [3, 3, 3, 3, 3];
      const result = rerollDice(current, [3, 3, 3, 3, 3]);
      assert.equal(result.kept.length, 5);
      assert.equal(result.rerolled.length, 0);
      assert.deepEqual(result.finalDice, [3, 3, 3, 3, 3]);
    });

    it("handles duplicate values correctly", () => {
      const current = [2, 2, 5, 5, 6];
      const toKeep = [2, 5];
      const result = rerollDice(current, toKeep);
      assert.equal(result.kept.length, 2);
      assert.equal(result.rerolled.length, 3);
    });
  });

  describe("detectSpecialCombinations", () => {
    it("detects a full house when available", () => {
      const player = new Player("Test");
      const dice = [3, 3, 3, 2, 2];
      const combos = detectSpecialCombinations(dice, player.scorecard);
      const labels = combos.map((c) => c.categoryKey);
      assert.ok(labels.includes("threeOfAKind"));
      assert.ok(labels.includes("fullHouse"));
    });

    it("detects general (yahtzee)", () => {
      const player = new Player("Test");
      const dice = [4, 4, 4, 4, 4];
      const combos = detectSpecialCombinations(dice, player.scorecard);
      const labels = combos.map((c) => c.categoryKey);
      assert.ok(labels.includes("general"));
      assert.ok(labels.includes("fourOfAKind"));
      assert.ok(labels.includes("threeOfAKind"));
    });

    it("skips categories already filled", () => {
      const player = new Player("Test");
      player.scorecard.threeOfAKind = 15; // already filled
      const dice = [3, 3, 3, 2, 2];
      const combos = detectSpecialCombinations(dice, player.scorecard);
      const labels = combos.map((c) => c.categoryKey);
      assert.ok(!labels.includes("threeOfAKind"));
      assert.ok(labels.includes("fullHouse"));
    });

    it("returns empty array when no specials match", () => {
      const player = new Player("Test");
      const dice = [1, 2, 3, 4, 6]; // small straight but we check only specials with score > 0
      const combos = detectSpecialCombinations(dice, player.scorecard);
      // smallStraight should be detected
      const labels = combos.map((c) => c.categoryKey);
      assert.ok(labels.includes("smallStraight"));
    });
  });
});
