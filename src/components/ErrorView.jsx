import styles from './ErrorView.module.css'

const friendlyMessages = {
  '404': "That username doesn't exist on Chess.com",
  '429': "Chess.com is rate-limiting us. Give it a minute and try again.",
  'Failed to fetch': "Can't reach Chess.com right now. Check your connection.",
}

function translateError(error) {
  if (!error) return "Something went wrong. Give it another try."
  for (const [key, msg] of Object.entries(friendlyMessages)) {
    if (error.includes(key)) return msg
  }
  if (error === 'No games found in the last 2 months') {
    return "No games found in the last two months. Play a few more and come back."
  }
  return error
}

export default function ErrorView({ error, onReset }) {
  const message = translateError(error)

  return (
    <div className={styles.wrapper}>
      <p className={styles.message}>{message}</p>
      <p className={styles.sub}>This happens sometimes. Usually an easy fix.</p>
      <button className={styles.button} onClick={onReset}>
        Try Again
      </button>
    </div>
  )
}
