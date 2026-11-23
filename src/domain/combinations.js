import { ScorecardCategories } from "./ScorecardCategories.js";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "./Player.js";

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
