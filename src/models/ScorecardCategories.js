/**
 * ScorecardCategories - Scoring rules for all 12 categories of the General (Yahtzee) game.
 *
 * Upper section: Aces through Sixes (sum of matching dice).
 * Lower section: ThreeOfAKind, FourOfAKind, FullHouse, SmallStraight, LargeStraight, General.
 */
export class ScorecardCategories {
  // ── Private helpers ───────────────────────────────────────────────

  #sumByValue(dice, targetValue) {
    return dice
      .filter((die) => die === targetValue)
      .reduce((total, value) => total + value, 0);
  }

  #countByValue(dice) {
    return dice.reduce((counts, value) => {
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {});
  }

  #hasSequence(dice, sequence) {
    const uniqueSorted = [...new Set(dice)].sort((a, b) => a - b);
    return sequence.every((num) => uniqueSorted.includes(num));
  }

  // ── Upper section ─────────────────────────────────────────────────

  calculateAces(dice) {
    return this.#sumByValue(dice, 1);
  }

  calculateTwos(dice) {
    return this.#sumByValue(dice, 2);
  }

  calculateThrees(dice) {
    return this.#sumByValue(dice, 3);
  }

  calculateFours(dice) {
    return this.#sumByValue(dice, 4);
  }

  calculateFives(dice) {
    return this.#sumByValue(dice, 5);
  }

  calculateSixes(dice) {
    return this.#sumByValue(dice, 6);
  }

  // ── Lower section ─────────────────────────────────────────────────

  calculateThreeOfAKind(dice) {
    const counts = Object.values(this.#countByValue(dice));
    return counts.some((count) => count >= 3)
      ? dice.reduce((total, value) => total + value, 0)
      : 0;
  }

  calculateFourOfAKind(dice) {
    const counts = Object.values(this.#countByValue(dice));
    return counts.some((count) => count >= 4)
      ? dice.reduce((total, value) => total + value, 0)
      : 0;
  }

  calculateFullHouse(dice) {
    const counts = Object.values(this.#countByValue(dice));
    const hasThree = counts.includes(3);
    const hasPair = counts.includes(2);
    return hasThree && hasPair ? 25 : 0;
  }

  calculateSmallStraight(dice) {
    const sequences = [
      [1, 2, 3, 4],
      [2, 3, 4, 5],
      [3, 4, 5, 6],
    ];
    return sequences.some((seq) => this.#hasSequence(dice, seq)) ? 30 : 0;
  }

  calculateLargeStraight(dice) {
    const sequences = [
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5, 6],
    ];
    return sequences.some((seq) => this.#hasSequence(dice, seq)) ? 40 : 0;
  }

  calculateGeneral(dice) {
    const counts = Object.values(this.#countByValue(dice));
    return counts.includes(5) ? 50 : 0;
  }
}
