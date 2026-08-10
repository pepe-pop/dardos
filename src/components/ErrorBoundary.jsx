import { Component } from 'react'
import { Button } from './ui.jsx'

/**
 * Zabezpieczenie przed pustym ekranem: jeśli jakakolwiek sekcja rzuci błąd
 * (np. z powodu ograniczeń środowiska), użytkownik widzi czytelny komunikat
 * zamiast białej strony — i może wrócić na stronę główną.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Błąd sekcji aplikacji:', error, info)
  }

  reset = () => {
    this.setState({ error: null })
    try {
      window.location.hash = '#/'
    } catch { /* ignore */ }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <div className="text-5xl">🎯</div>
        <h1 className="mt-3 text-xl font-extrabold">Coś poszło nie tak</h1>
        <p className="mt-2 text-sm text-muted">
          Ta sekcja nie mogła się załadować ({String(this.state.error && this.state.error.message).slice(0, 80)}).
          To nie Twoja wina — wróć na stronę główną i spróbuj ponownie.
        </p>
        <Button className="mt-5" onClick={this.reset}>Wróć na stronę główną</Button>
      </div>
    )
  }
}
