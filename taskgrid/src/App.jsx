import { Calendar } from './components/Calendar'

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Mein Kalender</h1>
        <p>Persönliche Planung & Strukturierung</p>
      </header>
      <main>
        <Calendar />
      </main>
    </div>
  )
}

export default App
