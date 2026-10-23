# ChessCoach

- **Cross-game analysis.** Pull games and get a review based on all of them
- **Play & learn.** Play games and learn what your doing wrong/wright comapred to your other games

You can also pick the coach's tone: **Supportive** (firm but kind) or **Ruthless** (no sugarcoating).

## Setup

```
npm install
```

Create a `.env` file in the project root with your AI provider details:

```
AI_API_KEY=your-api-key
AI_BASE_URL=https://integrate.api.nvidia.com/v1
AI_MODEL=minimaxai/minimax-m3.1-flash
```

## Run it

```
npm run dev
```

Then open the URL Vite prints.

## Build it

```
npm run build
```
