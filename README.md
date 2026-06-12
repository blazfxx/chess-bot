# ChessCoach

Drop in a Chess.com username and get an honest read on your chess — what you keep getting wrong, what's actually working, and the one thing worth fixing first. Then sit down at a board, play a bot, and have a coach watch over your shoulder and tell you what's going on.

It's two tools in one:

- **Cross-game analysis.** Pull your recent games from Chess.com and look for patterns *across* them, not move-by-move noise on a single game. You get specific, blunt feedback: recurring mistakes, the openings that trip you up, the habits costing you points, and a plain-English verdict on where you are right now.
- **Play & learn.** Play a full game against a practice bot. Ask the coach for a review whenever you want — it has already seen your past games, so it ties what's happening on the board to the patterns it knows you have. When the game ends, you get a short debrief.

You can pick the coach's tone: **Supportive** (firm but kind) or **Ruthless** (no sugarcoating).

## Setup

```
npm install
```

Create a `.env` file in the project root with your AI provider details:

```
AI_API_KEY=your-api-key
AI_BASE_URL=https://your-openai-compatible-endpoint/v1
AI_MODEL=gpt-4o
```

These are server-side variables (no `VITE_` prefix), so the API key is never bundled into the client. See `.env.example` for the template.

`systemprompt.txt` is the Ruthless coach persona; `niceprompt.txt` is the Supportive one. Both ship with the repo — tweak them if you want a different voice.

## Run it

```
npm run dev
```

Then open the URL Vite prints.

## Build it

```
npm run build
```

Output lands in `dist/`. Use `npm run preview` to check the production build locally.

## How it's built

- **Vite + React** for the app
- **chess.js** for move legality, game state, and PGN
- **react-chessboard** for the board UI
- **Chess.com public API** for fetching your games and stats (no auth needed)
- An **OpenAI-compatible chat API** for the analysis and live coaching

## A note on the API key

The app never talks to the AI provider directly from the browser. In development, Vite middleware (see `vite.config.js`) proxies every AI request through the dev server, attaching the API key there. In production on Vercel, the same job is done by a serverless function at `api/ai/chat/completions.js`. Both read the key from the server-side `AI_API_KEY` variable, so it stays out of client-side code and network traffic. They are also where the chosen coaching style (Supportive vs. Ruthless) swaps in the right system prompt before the request goes upstream.

## Deploying to Vercel

The project is configured for Vercel out of the box. Set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` as Environment Variables in the Vercel project settings, then deploy. `vercel.json` rewrites non-`/api` routes to `index.html` for client-side routing, and the `api/` directory is deployed as a serverless function.

## License

Licensed under the Apache License 2.0. See the [`LICENSE`](LICENSE) file for the full text.
