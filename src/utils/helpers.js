import { ScorecardCategories } from "../models/ScorecardCategories.js";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "../models/Player.js";

// ── Dice Rolling ────────────────────────────────────────────────────

const DICE_COUNT = 5;
const DICE_MIN = 1;
const DICE_MAX = 6;

/** Generates a single random die value (1-6). */
function rollSingleDie() {
  return Math.floor(Math.random() * DICE_MAX) + DICE_MIN;
}

/** Rolls all 5 dice and returns the results as an array. */
export function rollAllDice() {
  return Array.from({ length: DICE_COUNT }, () => rollSingleDie());
}

/** Picks a random player from the given array. */
export function pickRandomPlayer(players) {
  const index = Math.floor(Math.random() * players.length);
  return players[index];
}

/**
 * Re-rolls some dice while keeping others.
 *
 * @param {number[]} currentDice  – The current 5 dice on the table.
 * @param {number[]} diceToKeep   – The values the player wants to keep.
 * @returns {{ kept: number[], rerolled: number[], finalDice: number[] }}
 */
export function rerollDice(currentDice, diceToKeep) {
  // Build a count map of dice the player wants to keep
  const keepCounts = {};
  for (const value of diceToKeep) {
    keepCounts[value] = (keepCounts[value] || 0) + 1;
  }

  // Separate kept dice from dice to re-roll
  const kept = currentDice.filter((value) => {
    if (keepCounts[value] > 0) {
      keepCounts[value]--;
      return true;
    }
    return false;
  });

  const rerollCount = currentDice.length - kept.length;
  const rerolled = Array.from({ length: rerollCount }, () => rollSingleDie());

  return {
    kept,
    rerolled,
    finalDice: [...kept, ...rerolled],
  };
}

// ── Combination Detection ───────────────────────────────────────────

/** Special (lower-section) category keys to scan for automatic detection. */
const SPECIAL_CATEGORIES = [
  "threeOfAKind",
  "fourOfAKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "general",
];

/**
 * Maps special category keys to their corresponding
 * ScorecardCategories method names.
 */
const SPECIAL_METHOD_MAP = {
  threeOfAKind: "calculateThreeOfAKind",
  fourOfAKind: "calculateFourOfAKind",
  fullHouse: "calculateFullHouse",
  smallStraight: "calculateSmallStraight",
  largeStraight: "calculateLargeStraight",
  general: "calculateGeneral",
};

/**
 * Scans the dice for special combinations that are still available
 * on the player's scorecard.
 *
 * @param {number[]} dice      – Current dice values.
 * @param {object}   scorecard – The player's scorecard object.
 * @returns {{ categoryKey: string, label: string, score: number, menuNumber: number }[]}
 */
export function detectSpecialCombinations(dice, scorecard) {
  const rules = new ScorecardCategories();
  const detected = [];

  for (const categoryKey of SPECIAL_CATEGORIES) {
    const methodName = SPECIAL_METHOD_MAP[categoryKey];
    const score = rules[methodName](dice);
    const menuNumber = CATEGORY_KEYS.indexOf(categoryKey) + 1;

    if (score > 0 && scorecard[categoryKey] === null) {
      detected.push({
        categoryKey,
        label: CATEGORY_LABELS[categoryKey],
        score,
        menuNumber,
      });
    }
  }

  return detected;
}
