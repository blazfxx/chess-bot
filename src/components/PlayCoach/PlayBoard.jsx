import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import styles from './PlayBoard.module.css'

const checkStyle = { backgroundColor: 'rgba(184, 92, 60, 0.55)' }
const selectedStyle = { backgroundColor: 'rgba(200, 169, 110, 0.4)' }
const captureHintStyle = { boxShadow: 'inset 0 0 0 3px rgba(200, 169, 110, 0.75)' }
const quietHintStyle = { backgroundColor: 'rgba(200, 169, 110, 0.22)' }

function bannerInfo(status, fen, playerColor) {
  const me = playerColor === 'white' ? 'w' : 'b'
  if (status === 'checkmate') {
    const loser = fen.split(' ')[1]
    if (loser === me) return { text: 'Checkmate — the bot got you', tone: 'loss' }
    return { text: 'Checkmate — you won', tone: 'win' }
  }
  if (status === 'draw') return { text: 'Draw', tone: 'draw' }
  if (status === 'resigned') return { text: 'You resigned', tone: 'loss' }
  return null
}

function statusLine(status, isBotThinking) {
  if (status !== 'playing') return ''
  if (isBotThinking) return 'Bot is thinking...'
  return 'Your move'
}

export default function PlayBoard({
  fen,
  status,
  playerColor,
  isBotThinking,
  makePlayerMove,
  getLegalMoves,
  checkSquare,
  username,
  resetGame,
}) {
  const canPlay = status === 'playing' && !isBotThinking
  const myPrefix = playerColor === 'white' ? 'w' : 'b'
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [selectionFen, setSelectionFen] = useState(fen)
  if (selectionFen !== fen) {
    setSelectionFen(fen)
    setSelectedSquare(null)
  }

  const hintMoves = selectedSquare && canPlay ? getLegalMoves(selectedSquare) : []

  const squareStyles = {}
  if (checkSquare) {
    squareStyles[checkSquare] = checkStyle
  }
  if (selectedSquare && canPlay) {
    squareStyles[selectedSquare] = selectedStyle
  }
  for (const move of hintMoves) {
    squareStyles[move.to] = move.captured ? captureHintStyle : quietHintStyle
  }

  const handleSquareClick = ({ piece, square }) => {
    if (!canPlay) return
    if (selectedSquare && hintMoves.some((m) => m.to === square)) {
      makePlayerMove(selectedSquare, square)
      setSelectedSquare(null)
      return
    }
    if (piece && piece.pieceType.startsWith(myPrefix)) {
      setSelectedSquare(square === selectedSquare ? null : square)
    } else {
      setSelectedSquare(null)
    }
  }

  const handlePieceDrag = ({ square }) => {
    if (canPlay && square) {
      setSelectedSquare(square)
    }
  }

  const handleDrop = ({ sourceSquare, targetSquare }) => {
    setSelectedSquare(null)
    if (!targetSquare) return false
    return makePlayerMove(sourceSquare, targetSquare)
  }

  const options = {
    position: fen,
    boardOrientation: playerColor === 'black' ? 'black' : 'white',
    onPieceDrop: handleDrop,
    onPieceDrag: handlePieceDrag,
    onSquareClick: handleSquareClick,
    allowDragging: canPlay,
    canDragPiece: ({ piece }) => canPlay && piece.pieceType.startsWith(myPrefix),
    squareStyles,
    darkSquareStyle: { backgroundColor: '#8b7355' },
    lightSquareStyle: { backgroundColor: '#d4c4a8' },
    boardStyle: { borderRadius: '4px', overflow: 'hidden' },
    animationDurationInMs: 200,
  }

  const banner = bannerInfo(status, fen, playerColor)
  const botColorLabel = playerColor === 'white' ? 'Black' : 'White'
  const playerColorLabel = playerColor === 'white' ? 'White' : 'Black'

  return (
    <div className={styles.wrapper}>
      <span className={styles.botLabel}>
        Bot ({botColorLabel}){isBotThinking ? ' · thinking...' : ''}
      </span>
      <div className={styles.frame}>
        {banner && (
          <div className={`${styles.banner} ${styles[banner.tone]}`}>
            <span className={styles.bannerText}>{banner.text}</span>
            <button className={styles.bannerButton} onClick={resetGame}>
              Play again
            </button>
          </div>
        )}
        <Chessboard options={options} />
      </div>
      <span className={styles.playerLabel}>{username || 'You'} ({playerColorLabel})</span>
      <p className={status === 'playing' ? styles.status : styles.statusDone}>
        {statusLine(status, isBotThinking)}
      </p>
    </div>
  )
}
