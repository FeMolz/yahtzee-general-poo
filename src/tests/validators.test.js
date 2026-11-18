import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidName,
  isValidMenuOption,
  isValidDiceSelection,
  isValidCategoryNumber,
} from "../utils/validators.js";

describe("validators", () => {
  describe("isValidName", () => {
    it("accepts alphabetic names with spaces", () => {
      assert.equal(isValidName("Alice"), true);
      assert.equal(isValidName("João da Silva"), true);
      assert.equal(isValidName("María"), true);
    });

    it("rejects names with numbers or special characters", () => {
      assert.equal(isValidName("Player1"), false);
      assert.equal(isValidName("test@user"), false);
      assert.equal(isValidName(""), false);
    });
  });

  describe("isValidMenuOption", () => {
    it("accepts 1 and 2", () => {
      assert.equal(isValidMenuOption("1"), true);
      assert.equal(isValidMenuOption("2"), true);
    });

    it("rejects other values", () => {
      assert.equal(isValidMenuOption("0"), false);
      assert.equal(isValidMenuOption("3"), false);
      assert.equal(isValidMenuOption("abc"), false);
    });
  });

  describe("isValidDiceSelection", () => {
    it("accepts empty string (keep none)", () => {
      assert.equal(isValidDiceSelection(""), true);
      assert.equal(isValidDiceSelection("  "), true);
    });

    it("accepts valid dice values separated by spaces", () => {
      assert.equal(isValidDiceSelection("1 3 5"), true);
      assert.equal(isValidDiceSelection("6"), true);
      assert.equal(isValidDiceSelection("1 2 3 4 5"), true);
    });

    it("rejects values outside 1-6", () => {
      assert.equal(isValidDiceSelection("0"), false);
      assert.equal(isValidDiceSelection("7"), false);
    });

    it("rejects more than 5 dice", () => {
      assert.equal(isValidDiceSelection("1 2 3 4 5 6"), false);
    });

    it("rejects non-numeric input", () => {
      assert.equal(isValidDiceSelection("abc"), false);
    });
  });

  describe("isValidCategoryNumber", () => {
    it("accepts valid numbers within range", () => {
      assert.equal(isValidCategoryNumber("1", 12), true);
      assert.equal(isValidCategoryNumber("12", 12), true);
      assert.equal(isValidCategoryNumber("6", 12), true);
    });

    it("rejects numbers outside range", () => {
      assert.equal(isValidCategoryNumber("0", 12), false);
      assert.equal(isValidCategoryNumber("13", 12), false);
    });

    it("rejects non-numeric input", () => {
      assert.equal(isValidCategoryNumber("abc", 12), false);
    });
  });
});
