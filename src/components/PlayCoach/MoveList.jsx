import { useEffect, useRef } from 'react'
import styles from './MoveList.module.css'

export default function MoveList({ moveHistory }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [moveHistory])

  const pairs = []
  for (let i = 0; i < moveHistory.length; i += 2) {
    pairs.push({
      number: i / 2 + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1],
    })
  }

  if (pairs.length === 0) {
    return <p className={styles.empty}>No moves yet</p>
  }

  return (
    <div className={styles.list} ref={listRef}>
      {pairs.map((pair) => (
        <span key={pair.number} className={styles.pair}>
          {pair.number}. {pair.white} {pair.black || ''}
        </span>
      ))}
    </div>
  )
}
