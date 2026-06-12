import styles from './GameControls.module.css'

const colors = [
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'random', label: 'Random' },
]

const levels = [
  { id: 'casual', label: 'Casual' },
  { id: 'solid', label: 'Solid' },
  { id: 'sharp', label: 'Sharp' },
]

export default function GameControls({
  status,
  playerColor,
  difficulty,
  isBotThinking,
  canUndo,
  resetGame,
  resign,
  undoMove,
  chooseColor,
  chooseDifficulty,
}) {
  return (
    <div className={styles.controls}>
      <div className={styles.selectors}>
        <div className={styles.group}>
          <span className={styles.groupLabel}>Play as</span>
          <div className={styles.segmented}>
            {colors.map((c) => (
              <button
                key={c.id}
                className={playerColor === c.id ? styles.segActive : styles.seg}
                onClick={() => chooseColor(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Bot</span>
          <div className={styles.segmented}>
            {levels.map((l) => (
              <button
                key={l.id}
                className={difficulty === l.id ? styles.segActive : styles.seg}
                onClick={() => chooseDifficulty(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.buttons}>
        <button className={styles.button} onClick={resetGame}>
          New Game
        </button>
        <button
          className={styles.button}
          onClick={undoMove}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button
          className={styles.button}
          onClick={resign}
          disabled={status !== 'playing' || isBotThinking}
        >
          Resign
        </button>
      </div>
    </div>
  )
}
