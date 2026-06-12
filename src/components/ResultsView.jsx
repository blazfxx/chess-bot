import { useState } from 'react'
import InsightCard from './InsightCard'
import PlayCoach from './PlayCoach/PlayCoach'
import styles from './ResultsView.module.css'

const sections = [
  { key: 'verdict', title: 'The Verdict', accent: 'verdict' },
  { key: 'commonMistakes', title: 'Common Mistakes', accent: 'negative' },
  { key: 'habitsToStop', title: 'Habits to Drop', accent: 'negative' },
  { key: 'winningPatterns', title: "What's Working", accent: 'positive' },
  { key: 'habitsToKeep', title: 'Habits to Keep', accent: 'positive' },
]

export default function ResultsView({ results, username, style, onReset }) {
  const [activeTab, setActiveTab] = useState('analysis')

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Report for {username}</h2>
        <p className={styles.subheading}>Your games, honest feedback, no sugarcoating.</p>
      </header>

      <nav className={styles.tabBar}>
        <button
          className={activeTab === 'analysis' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
        <button
          className={activeTab === 'play' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('play')}
        >
          Play & Learn
        </button>
      </nav>

      {activeTab === 'analysis' && (
        <div className={styles.sections}>
          {sections.map(({ key, title, accent }) => (
            <InsightCard
              key={key}
              title={title}
              content={results[key] || 'Not enough data to identify a pattern.'}
              accent={accent}
            />
          ))}
        </div>
      )}

      {activeTab === 'play' && (
        <PlayCoach results={results} username={username} style={style} />
      )}

      <div className={styles.footer}>
        <button className={styles.resetButton} onClick={onReset}>
          Analyze Another Player
        </button>
      </div>
    </div>
  )
}
