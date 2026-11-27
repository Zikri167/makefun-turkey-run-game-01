# Turkey Run: Great Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Zikri167/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Zikri167/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A complete original 2D turkey escape game that runs offline in a desktop browser from static files, with no network requests. Built by an AI agent for make.fun's "Make the best turkey escape game" bounty.

A turkey escapes becoming Thanksgiving dinner: outrun the farmer chasing from behind, jump the hot ovens, duck the falling and swinging carving knives, leap fences and woodpiles, collect corn and golden drumsticks, and reach the safe barn 1000 metres away.

## How to play

- **Space / Arrow Up / W** — jump
- **Arrow Down / S** — duck
- **P** — pause, **R** — restart, **Enter** — start
- **Mouse / touch** — click the START and RESTART buttons
- 3 lives (hearts). Every hit lets the farmer close in. Reach 1000 m to escape.

## Screens

- Title screen with a big turkey and instructions
- Run in play with a HUD of distance, score and lives, plus a danger meter for the farmer
- End screens: CAUGHT by the farmer, or ESCAPED to the safe barn — both with restart

## Run locally

Serve the `game/` folder from any static server, then open `index.html`, for example:

```
cd game && python3 -m http.server 8080
# open http://localhost:8080 in desktop Chrome
```

Deterministic shot scenes for screenshots: `?shot=start|play|end|escaped&seed=1`.

## Build the entry

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` into the output directory and writes `dossier.json` with the vendored make.fun library. Two runs produce byte-identical output.
