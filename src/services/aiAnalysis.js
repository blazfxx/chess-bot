const REQUIRED_FIELDS = ["commonMistakes", "winningPatterns", "habitsToStop", "habitsToKeep", "verdict"]

const MAX_PGN_CHARS = 30000

function formatRatings(stats) {
  const parts = []
  for (const [control, rating] of Object.entries(stats.ratings)) {
    const record = stats.winLossDraw[control]
    const recordStr = record
      ? ` (${record.wins}W/${record.losses}L/${record.draws}D)`
      : ""
    parts.push(`${control}: ${rating}${recordStr}`)
  }
  return parts.join("\n") || "No rating data available"
}

function buildPgnSection(games) {
  const pgns = games.map((g) => g.pgn).filter(Boolean)
  if (pgns.length === 0) return "No PGN data available."

  let combined = pgns.join("\n\n")
  if (combined.length <= MAX_PGN_CHARS) {
    return combined
  }

  const trimmed = []
  let total = 0
  for (const pgn of pgns) {
    if (total + pgn.length > MAX_PGN_CHARS) {
      const remaining = MAX_PGN_CHARS - total
      if (remaining > 200) {
        trimmed.push(pgn.slice(0, remaining) + "\n[...game truncated]")
      }
      break
    }
    trimmed.push(pgn)
    total += pgn.length + 2
  }
  return trimmed.join("\n\n")
}

function extractJSON(text) {
  let cleaned = text.trim()

  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
  }

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    void e
  }

  const braceStart = cleaned.indexOf('{')
  if (braceStart !== -1) {
    const fromBrace = cleaned.slice(braceStart)
    let depth = 0
    let inStr = false
    let escape = false
    for (let i = 0; i < fromBrace.length; i++) {
      const ch = fromBrace[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (ch === '{') depth++
      if (ch === '}') depth--
      if (depth === 0) {
        try {
          return JSON.parse(fromBrace.slice(0, i + 1))
        } catch (e) {
          void e
        }
        break
      }
    }
  }

  return null
}

function parseResponse(raw) {
  const result = extractJSON(raw)
  if (result) return result
  throw new Error("Analysis came back in an unexpected format. Please try again.")
}

function validateResult(result) {
  if (!result || typeof result !== "object") {
    throw new Error("Analysis came back in an unexpected format. Please try again.")
  }
  const missing = REQUIRED_FIELDS.filter(
    (f) => typeof result[f] !== "string" || result[f].trim() === ""
  )
  if (missing.length > 0) {
    throw new Error(
      `Analysis response is missing fields: ${missing.join(", ")}. Please try again.`
    )
  }
  const picked = {}
  for (const f of REQUIRED_FIELDS) {
    picked[f] = result[f].trim()
  }
  return picked
}

const DEFAULT_SYSTEM_PROMPT = `You are an experienced chess coach who actually plays and understands the game. You analyze a player's recent games looking for PATTERNS across multiple games — not move-by-move commentary on individual games. You are direct and honest. If someone blunders their queen pressure in three different games, you say that plainly. If their endgame play is weak, you don't sugarcoat it. You write like a coach talking to a student: clear, specific, sometimes blunt, always practical. You reference specific games, openings, or moves when making a point — never hide behind vague advice like "develop your pieces more."`

const SYSTEM_PROMPT = DEFAULT_SYSTEM_PROMPT

const USER_PROMPT_TEMPLATE = `Analyze this chess player's recent games and find cross-game patterns.

PLAYER INFO:
Username: {username}
Ratings & Records:
{ratings}

GAMES (PGN format):
{pgns}

---

Return your analysis as a JSON object with EXACTLY these 5 fields:

{
  "commonMistakes": "2-3 specific mistakes that show up across multiple lost games. Name the openings, mention the opponent, reference the moment. Not 'blunders pieces' but 'keeps hanging the f-pawn in Sicilian lines and gets punished on the kingside.' Be concrete.",
  "winningPatterns": "2-3 things they do well in their wins. What positions suit them? What tactics do they spot? What do they convert? Give real examples from the games.",
  "habitsToStop": "1-2 specific bad habits costing them points. Give a real example from a game — when they did it and what happened.",
  "habitsToKeep": "1-2 specific good habits worth reinforcing. Give a real example from a game where it paid off.",
  "verdict": "2-3 sentences. Where are they right now as a player, in plain language? And what is the single most important thing they should work on?"
}

RULES:
- Be specific. Reference actual games, openings, or moves. Vague advice is useless.
- If the games don't show a clear pattern for something, say so honestly instead of making something up.
- Write in plain English. You're a coach, not a chess engine.
- Each field should be 1-2 paragraphs. Well-written prose, not bullet points.
- Return ONLY the raw JSON object. No markdown fences, no preamble, no extra text.`

export async function analyzeGames(stats, games, onProgress, style = "nice") {
  const baseUrl = "/api/ai"

  onProgress("Sending games to the coach...")

  const pgnData = buildPgnSection(games)
  const ratingsStr = formatRatings(stats)

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace("{username}", stats.username)
    .replace("{ratings}", ratingsStr)
    .replace("{pgns}", pgnData)

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]

  onProgress("Waiting for analysis...")

  let response
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Coaching-Style": style,
      },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
      }),
    })

    if (res.status === 401) {
      throw new Error("AI service authentication failed. Check your API key.")
    }
    if (res.status === 429) {
      throw new Error("AI service is rate-limited. Please wait a moment and try again.")
    }
    if (!res.ok) {
      throw new Error(`The analysis service failed to respond (status ${res.status}). Please try again.`)
    }

    const data = await res.json()
    response = data.choices?.[0]?.message?.content
  } catch (err) {
    if (err.message && err.message.startsWith("AI service")) throw err
    if (err.message && err.message.startsWith("The analysis")) throw err
    throw new Error("Could not reach the analysis service. Please try again.", { cause: err })
  }

  if (!response) {
    throw new Error("Analysis came back empty. Please try again.")
  }

  let parsed = parseResponse(response)

  if (REQUIRED_FIELDS.some((f) => typeof parsed[f] !== "string" || parsed[f].trim() === "")) {
    try {
      const retryRes = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Coaching-Style": style,
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: "assistant", content: response },
            {
              role: "user",
              content:
                "You returned non-JSON or missing fields. Return ONLY the raw JSON object with all 5 fields (commonMistakes, winningPatterns, habitsToStop, habitsToKeep, verdict) filled in. No markdown fences, no formatting, no extra text.",
            },
          ],
          temperature: 0.3,
        }),
      })

      if (!retryRes.ok) {
        throw new Error("retry failed")
      }

      const retryData = await retryRes.json()
      const retryContent = retryData.choices?.[0]?.message?.content
      if (retryContent) {
        parsed = parseResponse(retryContent)
      }
    } catch {
      throw new Error("Analysis came back in an unexpected format. Please try again.")
    }
  }

  return validateResult(parsed)
}
