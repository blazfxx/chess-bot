import { useState } from 'react'
import styles from './UsernameForm.module.css'

export default function UsernameForm({ onSubmit }) {
  const [username, setUsername] = useState('')
  const [style, setStyle] = useState('nice')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) return
    onSubmit(trimmed, style)
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.intro}>
        Enter your Chess.com username and I'll look for patterns across your recent games.
      </p>
      <div className={styles.styleRow}>
        <button
          type="button"
          className={`${styles.styleBtn} ${style === 'mean' ? styles.styleBtnActive : ''}`}
          onClick={() => setStyle('mean')}
        >
          <span className={styles.styleLabel}>Ruthless</span>
          <span className={styles.styleDesc}>no sugarcoating</span>
        </button>
        <button
          type="button"
          className={`${styles.styleBtn} ${style === 'nice' ? styles.styleBtnActive : ''}`}
          onClick={() => setStyle('nice')}
        >
          <span className={styles.styleLabel}>Supportive</span>
          <span className={styles.styleDesc}>firm but kind</span>
        </button>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="text"
          placeholder="your chess.com username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
        <button
          className={styles.button}
          type="submit"
          disabled={!username.trim()}
        >
          Analyze My Games
        </button>
      </form>
    </div>
  )
}
