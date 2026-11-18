# 🎲 General (Yahtzee) — CLI Dice Game

A classic **General** dice game (also known as *Yahtzee*), played entirely in the terminal. Built with **Node.js ES Modules** and **Object-Oriented Programming (OOP)**.

---

## 🎯 About the Project

This project was created as a **personal study challenge** to practice and consolidate core programming concepts:

- **Object-Oriented Programming (OOP):** Class design and communication (`Player`, `GeneralGame`, `ScorecardCategories`), state encapsulation, and separation of concerns.
- **Modern JavaScript:** ES Modules (`import`/`export`), `async`/`await`, and interactive CLI input with `node:readline/promises`.
- **Logic & Data Structures:** Dice rolling/rerolling algorithms, scoring validation, and automatic combination detection.
- **Testing:** Unit tests using the Node.js built-in test runner (`node:test`).

---

## 🕹️ How to Play

1. The game supports **2 to 4 players**.
2. Each match lasts **12 rounds** (one for each scoring category).
3. Each round, every player gets up to **3 dice rolls**:
   - **1st Roll:** All 5 dice are rolled.
   - **2nd & 3rd Rolls (optional):** Choose which dice to keep and re-roll the rest.
   - **First-Roll Bonus:** If you score right after the 1st roll without re-rolling, the points for that category are **doubled**!
4. **Combination Assistant:** The game automatically detects if your dice form special combinations (Three of a Kind, Four of a Kind, Full House, Straights, or General) that are still available on your scorecard.
5. After 12 rounds, the player with the **highest total score** wins!

### Scoring Categories

| #  | Category         | Score                                |
|----|------------------|--------------------------------------|
| 1  | Aces (1s)        | Sum of all 1s                        |
| 2  | Twos (2s)        | Sum of all 2s                        |
| 3  | Threes (3s)      | Sum of all 3s                        |
| 4  | Fours (4s)       | Sum of all 4s                        |
| 5  | Fives (5s)       | Sum of all 5s                        |
| 6  | Sixes (6s)       | Sum of all 6s                        |
| 7  | Three of a Kind  | Sum of all dice (if 3+ match)        |
| 8  | Four of a Kind   | Sum of all dice (if 4+ match)        |
| 9  | Full House       | 25 points (3 of one + 2 of another)  |
| 10 | Small Straight   | 30 points (4 consecutive dice)       |
| 11 | Large Straight   | 40 points (5 consecutive dice)       |
| 12 | General (Yahtzee)| 50 points (all 5 dice the same)      |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18 or higher** installed on your machine.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd study-general-minigame

# Install dependencies
npm install
```

### Running the Game

```bash
npm start
```

Or directly:

```bash
node src/index.js
```

Then follow the on-screen prompts: enter player names, roll dice, choose which to keep, and pick a scoring category each turn!

### Running Tests

The project includes unit tests for all core modules using Node.js built-in test runner:

```bash
npm test
```

This runs all test files in `src/tests/` covering:
- **ScorecardCategories** – All 12 scoring rules
- **Player** – Scorecard management, rolls, bonuses
- **GeneralGame** – Turn/round logic, winner determination
- **Helpers** – Dice rolling, re-rolling, combination detection
- **Validators** – Input validation for names, menus, dice selections

---

## 📁 Project Structure

```text
src/
├── cli/
│   └── terminal.js              # CLI interface: player setup, turn flow, display
├── models/
│   ├── ScorecardCategories.js   # Scoring rules for all 12 categories
│   ├── Player.js                # Player model (scorecard, rolls, bonus logic)
│   └── GeneralGame.js           # Game state (rounds, turns, winner)
├── tests/
│   ├── scorecardCategories.test.js
│   ├── player.test.js
│   ├── generalGame.test.js
│   ├── helpers.test.js
│   └── validators.test.js
├── utils/
│   ├── helpers.js               # Dice rolling, re-rolling, combination detection
│   └── validators.js            # Input validation functions
└── index.js                     # Entry point — main game loop
```

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v18+)
- **Language:** JavaScript (ES Modules)
- **CLI Colors:** [chalk](https://www.npmjs.com/package/chalk) v6
- **Testing:** Node.js built-in test runner (`node:test`)

---

Developed by **Felipe Molz** for study and improvement in JavaScript and OOP.
