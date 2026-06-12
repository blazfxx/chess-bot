const SYSTEM_PROMPT = `You are a chess coach watching a student play a live game against a practice bot. You have already analyzed their recent games and know their patterns. When asked for feedback, you review the ENTIRE game played so far — not just the most recent move. Identify the biggest mistakes and turning points anywhere in the game (hung pieces, material losses, missed tactics), assess overall play quality, then connect it to the current position and what to focus on next. Be direct. Keep it to 2-5 sentences. Do NOT give them the best move — ask a question or describe the problem so they think for themselves.`

const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 }
const pieceNames = { p: "P", n: "N", b: "B", r: "R", q: "Q", k: "K" }

function describeSide(counts) {
  const order = ["q", "r", "b", "n"]
  const parts = []
  for (const type of order) {
    for (let i = 0; i < counts[type]; i++) parts.push(pieceNames[type])
  }
  const pieces = parts.length > 0 ? parts.join(" ") : "no pieces"
  return `${pieces} + ${counts.p} pawn${counts.p === 1 ? "" : "s"}`
}

function materialSummary(fen) {
  const board = fen.split(" ")[0]
  const white = { p: 0, n: 0, b: 0, r: 0, q: 0 }
  const black = { p: 0, n: 0, b: 0, r: 0, q: 0 }
  for (const ch of board) {
    const lower = ch.toLowerCase()
    if (!(lower in white)) continue
    if (ch === lower) black[lower]++
    else white[lower]++
  }
  const whitePoints = Object.keys(white).reduce((sum, t) => sum + white[t] * pieceValues[t], 0)
  const blackPoints = Object.keys(black).reduce((sum, t) => sum + black[t] * pieceValues[t], 0)
  const diff = whitePoints - blackPoints
  let balance
  if (diff === 0) {
    balance = "material is even"
  } else if (diff > 0) {
    balance = `White is up ${diff} point${diff === 1 ? "" : "s"} of material`
  } else {
    balance = `White is down ${-diff} point${diff === -1 ? "" : "s"} of material`
  }
  return `White has ${describeSide(white)}. Black has ${describeSide(black)}. Balance: ${balance}.`
}

export async function getCoaching({ fen, moveHistory, lastPlayerMove, analysisResults, username, style, playerColor, gameOver, result }) {
  const baseUrl = "/api/ai"

  const movesText = moveHistory.length > 0 ? moveHistory.join(" ") : "(no moves yet)"
  const side = playerColor === "black" ? "Black" : "White"

  const knowledge = `WHAT YOU KNOW FROM THEIR PAST GAMES:
Verdict: ${analysisResults?.verdict || "No analysis available."}
Common mistakes: ${analysisResults?.commonMistakes || "Unknown."}
Habits to stop: ${analysisResults?.habitsToStop || "Unknown."}
Winning patterns: ${analysisResults?.winningPatterns || "Unknown."}`

  let userPrompt
  if (gameOver) {
    userPrompt = `My student ${username} just finished a live game against the practice bot, playing ${side}. The game ended: ${result || "the game is over"}.

${knowledge}

THE GAME THAT JUST ENDED (my student played ${side}):
Full move record from move 1: ${movesText}
Final position (FEN): ${fen}
Material count: ${materialSummary(fen)}

Give a short post-game debrief. Sum up how the game went overall, name the 2-3 biggest lessons from what actually happened, and connect those to the patterns you saw in their past games. Be encouraging but honest. 3-5 sentences, plain text only — no markdown, no lists.`
  } else {
    userPrompt = `My student ${username} is playing a live game right now and wants a review of their play so far.

${knowledge}

THE LIVE GAME (my student is ${side}):
Full move record from move 1: ${movesText}
Current position (FEN): ${fen}
Material count: ${materialSummary(fen)}
Most recent player move: ${lastPlayerMove || "(game just started)"}

Review the WHOLE game from move 1 to now, not just the latest move. Step through the move record and find the biggest mistakes or turning points wherever they happened — a queen hung on move 4 matters more than a quiet move 12. Use the material count to catch losses the move record implies. Comment on how their play has trended overall, then tie it to the current position and what they should focus on next. The latest move can be mentioned but must not be the sole focus. 2-5 sentences, plain text only — no markdown, no lists.`
  }

  let response
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Coaching-Style": style,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 400,
      }),
    })

    if (res.status === 429) {
      throw new Error("Coach needs a moment — too many requests. Try again shortly.")
    }
    if (!res.ok) {
      throw new Error("Coach couldn't analyze that move. Try again?")
    }

    const data = await res.json()
    response = data.choices?.[0]?.message?.content
  } catch (err) {
    if (err.message && err.message.startsWith("Coach")) throw err
    throw new Error("Coach couldn't analyze that move. Try again?", { cause: err })
  }

  if (!response || !response.trim()) {
    throw new Error("Coach couldn't analyze that move. Try again?")
  }

  return response.trim()
}
