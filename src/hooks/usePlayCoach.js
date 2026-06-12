import { useState, useRef, useCallback, useEffect } from "react"
import { Chess } from "chess.js"
import { pickBotMove } from "../services/botEngine"
import { getCoaching } from "../services/aiCoaching"

const pieceValue = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

function looksLikeBlunder(game, move) {
  const enemy = move.color === "w" ? "b" : "w"
  const attackers = game.attackers(move.to, enemy)
  if (attackers.length === 0) return false

  const defenders = game.attackers(move.to, move.color)
  if (defenders.length === 0) return true

  let cheapest = Infinity
  for (const sq of attackers) {
    const piece = game.get(sq)
    if (piece && pieceValue[piece.type] < cheapest) {
      cheapest = pieceValue[piece.type]
    }
  }
  return cheapest < pieceValue[move.piece]
}

function resolveColor(choice) {
  if (choice === "random") return Math.random() < 0.5 ? "white" : "black"
  return choice
}

function resultText(game, status, playerColor) {
  const me = playerColor === "white" ? "w" : "b"
  if (status === "checkmate") {
    const loser = game.turn()
    return loser === me ? "the bot checkmated my student" : "my student delivered checkmate"
  }
  if (status === "draw") return "the game was drawn"
  if (status === "resigned") return "my student resigned"
  return "the game is over"
}

export default function usePlayCoach(analysisResults, username, style) {
  const gameRef = useRef(null)
  if (gameRef.current == null) {
    gameRef.current = new Chess()
  }

  const mountedRef = useRef(true)
  const botTimerRef = useRef(null)
  const playerColorRef = useRef("white")
  const difficultyRef = useRef("solid")
  const debriefedRef = useRef(false)

  const [fen, setFen] = useState(START_FEN)
  const [moveHistory, setMoveHistory] = useState([])
  const [status, setStatus] = useState("playing")
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [coachEntries, setCoachEntries] = useState([])
  const [isCoachThinking, setIsCoachThinking] = useState(false)
  const [blunderFlagged, setBlunderFlagged] = useState(false)
  const [checkSquare, setCheckSquare] = useState(null)
  const [playerColor, setPlayerColor] = useState("white")
  const [difficulty, setDifficulty] = useState("solid")

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current)
        botTimerRef.current = null
      }
    }
  }, [])

  const syncBoard = useCallback(() => {
    const game = gameRef.current
    setFen(game.fen())
    setMoveHistory(game.history())
    if (game.inCheck()) {
      const kingSquares = game.findPiece({ type: "k", color: game.turn() })
      setCheckSquare(kingSquares[0] || null)
    } else {
      setCheckSquare(null)
    }
    if (game.isCheckmate()) {
      setStatus("checkmate")
    } else if (game.isDraw() || game.isStalemate()) {
      setStatus("draw")
    }
  }, [])

  const getLegalMoves = useCallback((square) => {
    return gameRef.current.moves({ square, verbose: true })
  }, [])

  const botColor = useCallback(() => (playerColorRef.current === "white" ? "b" : "w"), [])

  const playBotReply = useCallback(() => {
    botTimerRef.current = null
    if (!mountedRef.current) return

    const game = gameRef.current
    if (game.turn() !== botColor() || game.isGameOver()) {
      setIsBotThinking(false)
      return
    }

    const botMove = pickBotMove(game, difficultyRef.current)
    if (botMove) {
      game.move(botMove.san)
    }
    setIsBotThinking(false)
    syncBoard()
  }, [syncBoard, botColor])

  const scheduleBot = useCallback(() => {
    setIsBotThinking(true)
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current)
    }
    botTimerRef.current = setTimeout(playBotReply, 500 + Math.random() * 500)
  }, [playBotReply])

  const makePlayerMove = useCallback((from, to, promotion) => {
    const game = gameRef.current
    const mine = playerColorRef.current === "white" ? "w" : "b"
    if (status !== "playing" || isBotThinking || game.turn() !== mine) {
      return false
    }

    let move
    try {
      move = game.move({ from, to, promotion: promotion || "q" })
    } catch {
      return false
    }
    if (!move) return false

    setBlunderFlagged(looksLikeBlunder(game, move))
    syncBoard()

    if (!game.isGameOver()) {
      scheduleBot()
    }

    return true
  }, [status, isBotThinking, syncBoard, scheduleBot])

  const buildCoachArgs = useCallback((gameOver) => {
    const game = gameRef.current
    const history = game.history()
    const mine = playerColorRef.current === "white" ? "w" : "b"
    const playerMoves = game.history({ verbose: true }).filter((m) => m.color === mine)
    const lastPlayerMove = playerMoves.length > 0 ? playerMoves[playerMoves.length - 1].san : null
    return {
      fen: game.fen(),
      moveHistory: history,
      lastPlayerMove,
      analysisResults,
      username,
      style,
      playerColor: playerColorRef.current,
      gameOver,
    }
  }, [analysisResults, username, style])

  const askCoach = useCallback(async () => {
    if (isCoachThinking) return

    const game = gameRef.current
    const moveNumber = Math.max(1, Math.ceil(game.history().length / 2))

    setIsCoachThinking(true)
    setBlunderFlagged(false)

    let text
    try {
      text = await getCoaching(buildCoachArgs(false))
    } catch (err) {
      text = err.message || "Coach couldn't analyze that move. Try again?"
    }

    if (!mountedRef.current) return

    setCoachEntries((entries) => [
      ...entries,
      { moveNumber, text, timestamp: Date.now() },
    ])
    setIsCoachThinking(false)
  }, [isCoachThinking, buildCoachArgs])

  const runDebrief = useCallback(async (finalStatus) => {
    if (debriefedRef.current) return
    debriefedRef.current = true

    const game = gameRef.current
    setIsCoachThinking(true)

    let text
    try {
      const args = buildCoachArgs(true)
      args.result = resultText(game, finalStatus, playerColorRef.current)
      text = await getCoaching(args)
    } catch (err) {
      text = err.message || "Couldn't put together a debrief this time."
    }

    if (!mountedRef.current) return

    setCoachEntries((entries) => [
      ...entries,
      { debrief: true, text, timestamp: Date.now() },
    ])
    setIsCoachThinking(false)
  }, [buildCoachArgs])

  useEffect(() => {
    if (status === "checkmate" || status === "draw" || status === "resigned") {
      runDebrief(status)
    }
  }, [status, runDebrief])

  const startGame = useCallback((color) => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current)
      botTimerRef.current = null
    }
    const resolved = resolveColor(color)
    playerColorRef.current = resolved
    debriefedRef.current = false
    gameRef.current = new Chess()
    setPlayerColor(resolved)
    setFen(gameRef.current.fen())
    setMoveHistory([])
    setStatus("playing")
    setIsBotThinking(false)
    setCoachEntries([])
    setIsCoachThinking(false)
    setBlunderFlagged(false)
    setCheckSquare(null)
    if (resolved === "black") {
      scheduleBot()
    }
  }, [scheduleBot])

  const resetGame = useCallback(() => {
    startGame(playerColorRef.current)
  }, [startGame])

  const chooseColor = useCallback((color) => {
    startGame(color)
  }, [startGame])

  const chooseDifficulty = useCallback((level) => {
    difficultyRef.current = level
    setDifficulty(level)
  }, [])

  const canUndo =
    status === "playing" &&
    !isBotThinking &&
    moveHistory.length > (playerColor === "black" ? 1 : 0)

  const undoMove = useCallback(() => {
    const game = gameRef.current
    if (isBotThinking || game.isGameOver()) return

    const opening = playerColorRef.current === "black" ? 1 : 0
    if (game.history().length <= opening) return

    const mine = playerColorRef.current === "white" ? "w" : "b"
    game.undo()
    if (game.turn() !== mine && game.history().length > opening) {
      game.undo()
    }

    setBlunderFlagged(false)
    syncBoard()
  }, [isBotThinking, syncBoard])

  const resign = useCallback(() => {
    if (status !== "playing") return
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current)
      botTimerRef.current = null
    }
    setIsBotThinking(false)
    setStatus("resigned")
  }, [status])

  return {
    fen,
    moveHistory,
    status,
    playerColor,
    difficulty,
    isBotThinking,
    coachEntries,
    isCoachThinking,
    blunderFlagged,
    checkSquare,
    canUndo,
    makePlayerMove,
    getLegalMoves,
    askCoach,
    resetGame,
    resign,
    undoMove,
    chooseColor,
    chooseDifficulty,
  }
}
