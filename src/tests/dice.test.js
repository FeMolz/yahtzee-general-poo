import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRoller, pickRandomPlayer, rollAllDice } from "../domain/dice.js";
import { detectSpecialCombinations } from "../domain/combinations.js";
import { Player } from "../domain/Player.js";

describe("dice", () => {
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

    it("uses the injected RNG", () => {
      const dice = rollAllDice(() => 0);
      assert.deepEqual(dice, [1, 1, 1, 1, 1]);
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

    it("honors a fixed RNG", () => {
      const players = [new Player("A"), new Player("B"), new Player("C")];
      assert.equal(pickRandomPlayer(players, () => 0), players[0]);
      assert.equal(pickRandomPlayer(players, () => 0.5), players[1]);
    });
  });

  describe("rerollUnlocked", () => {
    it("replaces only unlocked dice", () => {
      const roller = createRoller(() => 0);
      const next = roller.rerollUnlocked([2, 3, 4, 5, 6], [true, false, true, false, false]);
      assert.deepEqual(next, [2, 1, 4, 1, 1]);
    });

    it("keeps every die when all are locked", () => {
      let calls = 0;
      const roller = createRoller(() => {
        calls += 1;
        return 0;
      });
      const next = roller.rerollUnlocked([3, 3, 3, 3, 3], [true, true, true, true, true]);
      assert.deepEqual(next, [3, 3, 3, 3, 3]);
      assert.equal(calls, 0);
    });
  });

  describe("detectSpecialCombinations", () => {
    it("detects a full house when available", () => {
      const player = new Player("Test");
      const dice = [3, 3, 3, 2, 2];
      const combos = detectSpecialCombinations(dice, player.scorecard);
      const labels = combos.map((combo) => combo.categoryKey);
      assert.ok(labels.includes("threeOfAKind"));
      assert.ok(labels.includes("fullHouse"));
    });

    it("detects general (yahtzee)", () => {
      const player = new Player("Test");
      const dice = [4, 4, 4, 4, 4];
      const combos = detectSpecialCombinations(dice, player.scorecard);
      const labels = combos.map((combo) => combo.categoryKey);
      assert.ok(labels.includes("general"));
      assert.ok(labels.includes("fourOfAKind"));
      assert.ok(labels.includes("threeOfAKind"));
    });

    it("skips categories already filled", () => {
      const player = new Player("Test");
      player.scorecard.threeOfAKind = 15;
      const dice = [3, 3, 3, 2, 2];
      const combos = detectSpecialCombinations(dice, player.scorecard);
      const labels = combos.map((combo) => combo.categoryKey);
      assert.ok(!labels.includes("threeOfAKind"));
      assert.ok(labels.includes("fullHouse"));
    });

    it("detects a small straight", () => {
      const player = new Player("Test");
      const dice = [1, 2, 3, 4, 6];
      const combos = detectSpecialCombinations(dice, player.scorecard);
      const labels = combos.map((combo) => combo.categoryKey);
      assert.ok(labels.includes("smallStraight"));
    });
  });
});
