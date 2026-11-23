# General (Yahtzee) — Multiplayer CLI

A classic **General** dice game played in the terminal, with a central authoritative server and one thin client per player. Built with **Node.js ES Modules**.

The server rolls the dice, checks every move, scores the card, and advances the turn. Clients only draw the shared table and send a command when it is their turn.

---

## About the Project

- **Authoritative server:** dice, validation, scoring, turns, and the final ranking live in one process. A client cannot submit its own dice.
- **Thin terminal client:** `console.clear()` redraws the lobby or the table from each `game:state`. The keyboard is read only after `turn:prompt` (or when the host starts the match).
- **Newline-delimited JSON over `net`:** no extra network dependency. One JSON object per line.
- **Same General rules:** 12 categories, up to 3 rolls, and a doubled score when you take a category on the first roll.

---

## How to Play

1. Start the server, then start one client per player (2 to 4).
2. Each player types a nickname and waits in the lobby. The first player is the host.
3. The host types `start` once at least two players are in the room. The match does not start by itself, so a third or fourth player can still join.
4. On your turn:
   - `r` rolls all five dice.
   - `t 3` locks or unlocks die number 3 (the `*` on the table marks a lock).
   - `l` re-rolls every unlocked die.
   - `s 7` scores category 7.
5. Everyone else watches the same scoreboard, the same card, and the same dice. Keystrokes typed while waiting are discarded, so they do not leak into the next prompt.
6. After 12 rounds the server sends the ranking and the winner. If someone disconnects, they leave the match immediately. Play continues while two or more players remain; otherwise everyone sees the partial scoreboard and there is no winner.

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

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18 or higher**.

### Installation

```bash
git clone <repository-url>
cd study-general-minigame
npm install
```

### Running a Match

In one terminal:

```bash
npm run server
```

The default port is **4000**. Override it with `PORT=4000` (PowerShell: `$env:PORT=4000`).

In a terminal for each player:

```bash
npm run client
```

Or point a client at another machine:

```bash
node src/client/index.js 192.168.0.10 4000
```

### Running Tests

```bash
npm test
```

The suite covers the scorecard, the turn state machine (locks, re-rolls, bonus, player removal), lobby rules, the NDJSON framer, and a real TCP exchange between two clients.

---

## Project Structure

```text
src/
├── domain/
│   ├── ScorecardCategories.js   # 12 scoring rules
│   ├── Player.js                # Scorecard, rolls, first-roll bonus
│   ├── GeneralGame.js           # Rounds, turns, locks, removal
│   ├── dice.js                  # Server-side rolls (injectable RNG)
│   └── combinations.js          # Special-combination hints
├── shared/
│   ├── protocol.js              # Message names and NDJSON codec
│   ├── constants.js             # Room size, port, dice, rounds
│   └── validators.js            # Nickname and menu checks
├── server/
│   ├── index.js                 # Listens on TCP
│   ├── socket.js                # One socket, one line buffer
│   └── match.js                 # Lobby, actions, snapshots
├── client/
│   ├── index.js                 # Connects, joins, input loop
│   ├── renderer.js              # Terminal table from game:state
│   └── input.js                 # Commands, stdin discarded off-turn
└── tests/
```

### Messages

Client to server: `lobby:join`, `lobby:start`, `action:roll`, `action:toggle_lock`, `action:reroll`, `action:score`.

Server to client: `lobby:welcome`, `game:state`, `turn:prompt`, `game:error`, `system:reject`.

---

## Tech Stack

- **Runtime:** Node.js (v18+)
- **Language:** JavaScript (ES Modules)
- **Network:** `node:net` with newline-delimited JSON
- **CLI Colors:** [chalk](https://www.npmjs.com/package/chalk) v6
- **Testing:** Node.js built-in test runner (`node:test`)

---

Developed by **Felipe Molz** for study and improvement in JavaScript and OOP.
