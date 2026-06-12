const pieceValue = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

const centerSquares = ["e4", "d4", "e5", "d5"]

function cheapestAttackerValue(game, square, color) {
  const attackers = game.attackers(square, color)
  let cheapest = Infinity
  for (const sq of attackers) {
    const piece = game.get(sq)
    if (piece && pieceValue[piece.type] < cheapest) {
      cheapest = pieceValue[piece.type]
    }
  }
  return cheapest
}

function scoreMove(game, move, movesPlayed, ignoreHanging) {
  let score = 10

  if (move.captured) {
    score += pieceValue[move.captured] * 30
  }

  game.move(move.san)

  if (game.isCheckmate()) {
    game.undo()
    return 10000
  }

  if (game.inCheck()) {
    score += 15
  }

  if (centerSquares.includes(move.to)) {
    score += 5
  }

  const backRank = move.color === "w" ? "1" : "8"
  const inOpening = movesPlayed < 16

  if (inOpening && (move.piece === "n" || move.piece === "b") && move.from[1] === backRank) {
    score += 5
  }

  if (inOpening && move.piece === "q" && !move.captured) {
    score -= 10
  }

  const enemy = move.color === "w" ? "b" : "w"
  const movedValue = pieceValue[move.piece]
  const attackerValue = cheapestAttackerValue(game, move.to, enemy)

  if (!ignoreHanging && attackerValue !== Infinity) {
    const defenders = game.attackers(move.to, move.color)
    if (attackerValue < movedValue) {
      score -= movedValue * 25
    } else if (defenders.length === 0) {
      score -= movedValue * 20
    }
  }

  game.undo()

  return score
}

function losesToRecapture(game, move) {
  game.move(move.san)
  const replies = game.moves({ verbose: true })
  let worst = 0
  for (const reply of replies) {
    if (!reply.captured) continue
    const gain = pieceValue[reply.captured]
    const defenders = game.attackers(reply.to, move.color)
    const net = defenders.length === 0 ? gain : gain - pieceValue[reply.piece]
    if (net > worst) worst = net
  }
  game.undo()
  return worst
}

export function pickBotMove(game, difficulty) {
  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return null

  const level = difficulty || "solid"
  const movesPlayed = game.history().length
  const ignoreHanging = level === "casual" && Math.random() < 0.35
  const noise = level === "sharp" ? 3 : level === "casual" ? 14 : 8

  const scored = moves.map((move) => ({
    move,
    score: scoreMove(game, move, movesPlayed, ignoreHanging) + Math.random() * noise,
  }))

  if (level === "sharp") {
    for (const s of scored) {
      if (s.score >= 10000) continue
      const loss = losesToRecapture(game, s.move)
      s.score -= loss * 22
    }
  }

  scored.sort((a, b) => b.score - a.score)

  const best = scored[0].score
  const window = level === "sharp" ? 6 : level === "casual" ? 40 : 15
  const take = level === "sharp" ? 2 : level === "casual" ? 6 : 4
  const candidates = scored.filter((s) => s.score >= best - window).slice(0, take)

  if (level === "sharp" && Math.random() < 0.7) {
    return candidates[0].move
  }

  const floor = candidates[candidates.length - 1].score
  let totalWeight = 0
  const weights = candidates.map((c) => {
    const w = c.score - floor + 5
    totalWeight += w
    return w
  })

  let roll = Math.random() * totalWeight
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return candidates[i].move
  }

  return candidates[0].move
}
