/**
 * validators.js – Input validation utilities.
 */

/** Validates that a player name contains only letters and spaces. */
export function isValidName(name) {
  const lettersOnly = /^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ ]+$/;
  return lettersOnly.test(name.trim());
}

/** Validates that a menu option is "1" or "2". */
export function isValidMenuOption(option) {
  return /^[12]$/.test(option.trim());
}

/**
 * Validates that a string of dice to keep contains only valid numbers (1-6)
 * separated by spaces, and no more than 5 numbers total.
 */
export function isValidDiceSelection(input) {
  if (input.trim() === "") return true; // keeping none is valid
  const parts = input.trim().split(/\s+/);
  if (parts.length > 5) return false;
  return parts.every((part) => /^[1-6]$/.test(part));
}

/**
 * Validates that a category number is within the valid range.
 */
export function isValidCategoryNumber(input, maxCategory) {
  const num = parseInt(input.trim(), 10);
  return !isNaN(num) && num >= 1 && num <= maxCategory;
}
