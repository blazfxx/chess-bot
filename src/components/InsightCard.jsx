import styles from './InsightCard.module.css'

export default function InsightCard({ title, content, accent }) {
  const accentClass = accent === 'positive'
    ? styles.positive
    : accent === 'negative'
      ? styles.negative
      : accent === 'verdict'
        ? styles.verdict
        : ''

  return (
    <div className={`${styles.card} ${accentClass}`}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.body}>{content}</p>
    </div>
  )
}
