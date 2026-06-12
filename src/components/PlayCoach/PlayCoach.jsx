import usePlayCoach from '../../hooks/usePlayCoach'
import PlayBoard from './PlayBoard'
import CoachPanel from './CoachPanel'
import GameControls from './GameControls'
import MoveList from './MoveList'
import styles from './PlayCoach.module.css'

export default function PlayCoach({ results, username, style }) {
  const {
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
  } = usePlayCoach(results, username, style)

  return (
    <div className={styles.layout}>
      <div className={styles.boardColumn}>
        <PlayBoard
          fen={fen}
          status={status}
          playerColor={playerColor}
          isBotThinking={isBotThinking}
          makePlayerMove={makePlayerMove}
          getLegalMoves={getLegalMoves}
          checkSquare={checkSquare}
          username={username}
          resetGame={resetGame}
        />
        <MoveList moveHistory={moveHistory} />
        <GameControls
          status={status}
          playerColor={playerColor}
          difficulty={difficulty}
          isBotThinking={isBotThinking}
          canUndo={canUndo}
          resetGame={resetGame}
          resign={resign}
          undoMove={undoMove}
          chooseColor={chooseColor}
          chooseDifficulty={chooseDifficulty}
        />
      </div>
      <div className={styles.coachColumn}>
        <CoachPanel
          coachEntries={coachEntries}
          isCoachThinking={isCoachThinking}
          blunderFlagged={blunderFlagged}
          askCoach={askCoach}
        />
      </div>
    </div>
  )
}
