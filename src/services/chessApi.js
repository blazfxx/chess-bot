const BASE_URL = "https://api.chess.com/pub"

const HEADERS = {
  "User-Agent": "ChessBot/1.0",
}

async function apiFetch(url) {
  const res = await fetch(url, { headers: HEADERS })

  if (res.status === 404) {
    throw new Error("Username not found on Chess.com")
  }

  if (res.status === 429) {
    throw new Error("Rate limited by Chess.com. Please wait a moment and try again.")
  }

  if (!res.ok) {
    throw new Error(`Chess.com API error (${res.status})`)
  }

  return res.json()
}

export async function fetchPlayerStats(username) {
  const data = await apiFetch(`${BASE_URL}/player/${username}/stats`)

  const ratings = {}
  const winLossDraw = {}

  const categories = ["chess_rapid", "chess_blitz", "chess_bullet", "chess_daily"]

  for (const cat of categories) {
    if (data[cat]) {
      const key = cat.replace("chess_", "")
      ratings[key] = data[cat].last?.rating ?? 0
      winLossDraw[key] = {
        wins: data[cat].record?.win ?? 0,
        losses: data[cat].record?.loss ?? 0,
        draws: data[cat].record?.draw ?? 0,
      }
    }
  }

  return { username, ratings, winLossDraw }
}

export async function fetchGameArchives(username) {
  const data = await apiFetch(`${BASE_URL}/player/${username}/games/archives`)
  return data.archives || []
}

export async function fetchGamesForMonth(username, year, month) {
  const paddedMonth = String(month).padStart(2, "0")
  const data = await apiFetch(`${BASE_URL}/player/${username}/games/${year}/${paddedMonth}`)
  return data.games || []
}

export async function fetchAllGames(username, onProgress) {
  onProgress("Fetching player stats...")
  const stats = await fetchPlayerStats(username)

  onProgress("Loading game archives...")
  const archives = await fetchGameArchives(username)

  if (archives.length === 0) {
    onProgress("Preparing analysis...")
    return { stats, games: [] }
  }

  const lastTwo = archives.slice(-2)

  const allGames = []

  for (let i = 0; i < lastTwo.length; i++) {
    const archiveUrl = lastTwo[i]
    const parts = archiveUrl.split("/")
    const year = parts[parts.length - 2]
    const month = parts[parts.length - 1]

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ]
    const monthName = monthNames[parseInt(month, 10) - 1]

    onProgress(`Pulling games from ${monthName} ${year}...`)

    const games = await fetchGamesForMonth(username, year, parseInt(month, 10))
    allGames.push(...games)

    if (i === 0 && lastTwo.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  onProgress("Preparing analysis...")
  return { stats, games: allGames }
}
