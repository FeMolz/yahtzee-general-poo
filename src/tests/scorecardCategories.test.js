import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ScorecardCategories } from "../models/ScorecardCategories.js";

describe("ScorecardCategories", () => {
  const rules = new ScorecardCategories();

  // ── Upper Section ───────────────────────────────────────────────

  describe("Upper section (sum of matching dice)", () => {
    it("calculateAces: sums only the 1s", () => {
      assert.equal(rules.calculateAces([1, 1, 3, 4, 5]), 2);
      assert.equal(rules.calculateAces([2, 3, 4, 5, 6]), 0);
      assert.equal(rules.calculateAces([1, 1, 1, 1, 1]), 5);
    });

    it("calculateTwos: sums only the 2s", () => {
      assert.equal(rules.calculateTwos([2, 2, 3, 4, 5]), 4);
      assert.equal(rules.calculateTwos([1, 3, 4, 5, 6]), 0);
    });

    it("calculateThrees: sums only the 3s", () => {
      assert.equal(rules.calculateThrees([3, 3, 3, 1, 2]), 9);
    });

    it("calculateFours: sums only the 4s", () => {
      assert.equal(rules.calculateFours([4, 4, 1, 2, 3]), 8);
    });

    it("calculateFives: sums only the 5s", () => {
      assert.equal(rules.calculateFives([5, 5, 5, 5, 1]), 20);
    });

    it("calculateSixes: sums only the 6s", () => {
      assert.equal(rules.calculateSixes([6, 6, 6, 6, 6]), 30);
      assert.equal(rules.calculateSixes([1, 2, 3, 4, 5]), 0);
    });
  });

  // ── Lower Section ───────────────────────────────────────────────

  describe("Three of a Kind", () => {
    it("returns sum of all dice when 3+ of the same value", () => {
      assert.equal(rules.calculateThreeOfAKind([3, 3, 3, 1, 2]), 12);
      assert.equal(rules.calculateThreeOfAKind([5, 5, 5, 5, 1]), 21);
    });

    it("returns 0 when no three of a kind", () => {
      assert.equal(rules.calculateThreeOfAKind([1, 2, 3, 4, 5]), 0);
    });
  });

  describe("Four of a Kind", () => {
    it("returns sum of all dice when 4+ of the same value", () => {
      assert.equal(rules.calculateFourOfAKind([4, 4, 4, 4, 2]), 18);
    });

    it("returns 0 when no four of a kind", () => {
      assert.equal(rules.calculateFourOfAKind([3, 3, 3, 1, 2]), 0);
    });
  });

  describe("Full House", () => {
    it("returns 25 for a valid full house (3 + 2)", () => {
      assert.equal(rules.calculateFullHouse([3, 3, 3, 2, 2]), 25);
      assert.equal(rules.calculateFullHouse([6, 6, 1, 1, 1]), 25);
    });

    it("returns 0 when not a full house", () => {
      assert.equal(rules.calculateFullHouse([1, 2, 3, 4, 5]), 0);
      assert.equal(rules.calculateFullHouse([3, 3, 3, 3, 2]), 0);
    });
  });

  describe("Small Straight", () => {
    it("returns 30 for a valid small straight (4 consecutive)", () => {
      assert.equal(rules.calculateSmallStraight([1, 2, 3, 4, 6]), 30);
      assert.equal(rules.calculateSmallStraight([2, 3, 4, 5, 1]), 30);
      assert.equal(rules.calculateSmallStraight([3, 4, 5, 6, 1]), 30);
    });

    it("returns 0 when no small straight", () => {
      assert.equal(rules.calculateSmallStraight([1, 1, 3, 4, 6]), 0);
    });
  });

  describe("Large Straight", () => {
    it("returns 40 for a valid large straight (5 consecutive)", () => {
      assert.equal(rules.calculateLargeStraight([1, 2, 3, 4, 5]), 40);
      assert.equal(rules.calculateLargeStraight([2, 3, 4, 5, 6]), 40);
    });

    it("returns 0 when no large straight", () => {
      assert.equal(rules.calculateLargeStraight([1, 2, 3, 4, 6]), 0);
    });
  });

  describe("General (Yahtzee)", () => {
    it("returns 50 when all 5 dice are the same", () => {
      assert.equal(rules.calculateGeneral([1, 1, 1, 1, 1]), 50);
      assert.equal(rules.calculateGeneral([6, 6, 6, 6, 6]), 50);
    });

    it("returns 0 when dice are not all the same", () => {
      assert.equal(rules.calculateGeneral([1, 1, 1, 1, 2]), 0);
    });
  });
});
