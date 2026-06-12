import styles from './CoachPanel.module.css'

export default function CoachPanel({ coachEntries, isCoachThinking, blunderFlagged, askCoach }) {
  const entries = [...coachEntries].reverse()

  return (
    <div className={styles.panel}>
      <button
        className={blunderFlagged ? styles.askButtonPulse : styles.askButton}
        onClick={askCoach}
        disabled={isCoachThinking}
      >
        {isCoachThinking ? 'Coach is thinking...' : 'Ask Coach'}
      </button>

      {blunderFlagged && (
        <p className={styles.nudge}>That might have been a mistake — ask the coach?</p>
      )}

      <div className={styles.feed}>
        {isCoachThinking && (
          <p className={styles.thinking}>Coach is looking at the board...</p>
        )}

        {entries.length === 0 && !isCoachThinking && (
          <p className={styles.empty}>
            Ask the coach anytime — they've seen your recent games and know the
            patterns you bring to the board. Play a few moves, then ask what they think.
          </p>
        )}

        {entries.map((entry) => (
          <div key={entry.timestamp} className={entry.debrief ? styles.entryDebrief : styles.entry}>
            <span className={entry.debrief ? styles.entryLabelDebrief : styles.entryLabel}>
              {entry.debrief ? 'Post-game debrief' : `After move ${entry.moveNumber}`}
            </span>
            <p className={styles.entryText}>{entry.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
