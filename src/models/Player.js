import { ScorecardCategories } from "./ScorecardCategories.js";

/**
 * CATEGORY_KEYS defines the internal keys used in the scorecard.
 * The order here determines the menu numbering shown to the player.
 */
export const CATEGORY_KEYS = [
  "aces",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
  "threeOfAKind",
  "fourOfAKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "general",
];

/**
 * CATEGORY_LABELS maps internal keys to human-readable display names.
 */
export const CATEGORY_LABELS = {
  aces: "Aces (1s)",
  twos: "Twos (2s)",
  threes: "Threes (3s)",
  fours: "Fours (4s)",
  fives: "Fives (5s)",
  sixes: "Sixes (6s)",
  threeOfAKind: "Three of a Kind",
  fourOfAKind: "Four of a Kind",
  fullHouse: "Full House",
  smallStraight: "Small Straight",
  largeStraight: "Large Straight",
  general: "General (Yahtzee)",
};

/**
 * Maps each category key to its corresponding calculate method name
 * on ScorecardCategories.
 */
const CATEGORY_METHOD_MAP = {
  aces: "calculateAces",
  twos: "calculateTwos",
  threes: "calculateThrees",
  fours: "calculateFours",
  fives: "calculateFives",
  sixes: "calculateSixes",
  threeOfAKind: "calculateThreeOfAKind",
  fourOfAKind: "calculateFourOfAKind",
  fullHouse: "calculateFullHouse",
  smallStraight: "calculateSmallStraight",
  largeStraight: "calculateLargeStraight",
  general: "calculateGeneral",
};

/**
 * Player – Represents a single player in the game.
 *
 * Tracks their scorecard, total score, remaining rolls per turn,
 * and whether it is currently their turn.
 */
export class Player {
  constructor(name) {
    this.name = name;
    this.isActive = false;
    this.totalScore = 0;
    this.rollsRemaining = 3;

    /** Scorecard: null = not yet filled; number = scored value. */
    this.scorecard = {};
    for (const key of CATEGORY_KEYS) {
      this.scorecard[key] = null;
    }
  }

  /** Whether the player still has rolls left in this turn. */
  canRoll() {
    return this.rollsRemaining > 0;
  }

  /** Consume one roll. Returns true if successful. */
  useRoll() {
    if (this.canRoll()) {
      this.rollsRemaining--;
      return true;
    }
    return false;
  }

  /** Reset rolls to 3 for the next turn. */
  resetRolls() {
    this.rollsRemaining = 3;
  }

  /**
   * Calculate the "first-roll bonus" (mão): if the player scores
   * on the very first roll (rollsRemaining === 2 after the initial roll),
   * the base score is doubled.
   */
  applyFirstRollBonus(baseScore) {
    const isFirstRoll = this.rollsRemaining === 2 && baseScore > 0;
    return isFirstRoll ? baseScore * 2 : baseScore;
  }

  /**
   * Fill a category on the scorecard with the calculated score.
   * Returns false if the category is already filled.
   */
  fillCategory(categoryKey, dice) {
    if (this.scorecard[categoryKey] !== null) {
      return false;
    }

    const methodName = CATEGORY_METHOD_MAP[categoryKey];
    if (!methodName) {
      return false;
    }

    const rules = new ScorecardCategories();
    const baseScore = rules[methodName](dice);
    const finalScore = this.applyFirstRollBonus(baseScore);

    this.scorecard[categoryKey] = finalScore;
    this.totalScore += finalScore;

    return true;
  }

  /** Returns an array of category keys that haven't been filled yet. */
  getAvailableCategories() {
    return CATEGORY_KEYS.filter((key) => this.scorecard[key] === null);
  }
}
