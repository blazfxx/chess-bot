import styles from './LoadingView.module.css'

export default function LoadingView({ progressText, progressStep, username }) {
  const totalSteps = 5

  return (
    <div className={styles.wrapper}>
      {username && (
        <p className={styles.username}>analyzing {username}</p>
      )}
      <div className={styles.progressRow}>
        <span className={styles.dot} />
        <p className={styles.progressText}>{progressText}</p>
      </div>
      <div className={styles.steps}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={`${styles.stepDot} ${i < progressStep ? styles.stepDotFilled : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
