import useAnalysis from './hooks/useAnalysis'
import Header from './components/Header'
import UsernameForm from './components/UsernameForm'
import LoadingView from './components/LoadingView'
import ErrorView from './components/ErrorView'
import ResultsView from './components/ResultsView'
import './App.css'

export default function App() {
  const { state, runAnalysis, reset } = useAnalysis()

  return (
    <div className="app">
      <Header />
      {state.phase === 'idle' && <UsernameForm onSubmit={runAnalysis} />}
      {state.phase === 'loading' && <LoadingView progressText={state.progressText} progressStep={state.progressStep} username={state.username} />}
      {state.phase === 'error' && <ErrorView error={state.error} onReset={reset} />}
      {state.phase === 'results' && <ResultsView results={state.results} games={state.games} username={state.username} style={state.style} onReset={reset} />}
    </div>
  )
}
