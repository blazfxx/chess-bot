import { useReducer, useRef, useCallback } from "react"
import { fetchAllGames } from "../services/chessApi"
import { analyzeGames } from "../services/aiAnalysis"

const initialState = {
  phase: "idle",
  progressText: "",
  progressStep: 0,
  results: null,
  games: null,
  error: "",
  username: "",
  style: "",
}

function reducer(state, action) {
  switch (action.type) {
    case "START_ANALYSIS":
      return {
        ...initialState,
        phase: "loading",
        username: action.username,
        style: action.style,
      }
    case "UPDATE_PROGRESS":
      return {
        ...state,
        progressText: action.text,
        progressStep: state.progressStep + 1,
      }
    case "ANALYSIS_COMPLETE":
      return {
        ...state,
        phase: "results",
        results: action.results,
        games: action.games,
      }
    case "ANALYSIS_FAILED":
      return {
        ...state,
        phase: "error",
        error: action.error,
      }
    case "RESET":
      return { ...initialState }
    default:
      return state
  }
}

export default function useAnalysis() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const abortedRef = useRef(false)

  const runAnalysis = useCallback(async (username, style) => {
    abortedRef.current = false
    dispatch({ type: "START_ANALYSIS", username, style })

    try {
      const { stats, games } = await fetchAllGames(username, (text) => {
        if (!abortedRef.current) {
          dispatch({ type: "UPDATE_PROGRESS", text })
        }
      })

      if (abortedRef.current) return

      if (!games || games.length === 0) {
        dispatch({
          type: "ANALYSIS_FAILED",
          error: "No games found in the last 2 months",
        })
        return
      }

      const results = await analyzeGames(stats, games, (text) => {
        if (!abortedRef.current) {
          dispatch({ type: "UPDATE_PROGRESS", text })
        }
      }, style)

      if (abortedRef.current) return

      dispatch({ type: "ANALYSIS_COMPLETE", results, games })
    } catch (err) {
      if (abortedRef.current) return
      dispatch({
        type: "ANALYSIS_FAILED",
        error: err.message || "Something went wrong. Please try again.",
      })
    }
  }, [])

  const reset = useCallback(() => {
    abortedRef.current = true
    dispatch({ type: "RESET" })
  }, [])

  return { state, runAnalysis, reset }
}
