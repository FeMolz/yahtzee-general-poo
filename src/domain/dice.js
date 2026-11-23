import { DICE_COUNT } from "../shared/constants.js";

const DICE_MIN = 1;
const DICE_MAX = 6;

/**
 * Dice roller with an injectable RNG so tests can force faces.
 * `rng` matches Math.random: it returns a number in [0, 1).
 */
export function createRoller(rng = Math.random) {
  function rollSingleDie() {
    return Math.floor(rng() * DICE_MAX) + DICE_MIN;
  }

  return {
    rollAll() {
      return Array.from({ length: DICE_COUNT }, () => rollSingleDie());
    },

    /**
     * Re-roll every die whose lock flag is false. Locked dice keep their value.
     */
    rerollUnlocked(dice, locked) {
      return dice.map((value, index) => (locked[index] ? value : rollSingleDie()));
    },
  };
}

/** Rolls all 5 dice and returns the results as an array. */
export function rollAllDice(rng = Math.random) {
  return createRoller(rng).rollAll();
}

/** Picks a random player from the given array. */
export function pickRandomPlayer(players, rng = Math.random) {
  const index = Math.floor(rng() * players.length);
  return players[index];
}
