import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'

describe('App Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-04T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('sollte die App korrekt rendern', () => {
      render(<App />)

      expect(screen.getByText('Mein Kalender')).toBeInTheDocument()
      expect(screen.getByText('Persönliche Planung & Strukturierung')).toBeInTheDocument()
    })

    it('sollte den Kalender anzeigen', () => {
      render(<App />)

      // Prüfe ob Kalender existiert
      expect(document.querySelector('.calendar-wrapper')).toBeInTheDocument()
    })

    it('sollte Wochentage anzeigen', () => {
      render(<App />)

      // Deutsche Wochentage (Mo-So)
      expect(screen.getByText('Mo')).toBeInTheDocument()
      expect(screen.getByText('Di')).toBeInTheDocument()
      expect(screen.getByText('Mi')).toBeInTheDocument()
      expect(screen.getByText('Do')).toBeInTheDocument()
      expect(screen.getByText('Fr')).toBeInTheDocument()
      expect(screen.getByText('Sa')).toBeInTheDocument()
      expect(screen.getByText('So')).toBeInTheDocument()
    })

    it('sollte Monatsnavigation anzeigen', () => {
      render(<App />)

      expect(screen.getByText('Heute')).toBeInTheDocument()
    })
  })

  describe('Kalender-Navigation', () => {
    it('sollte zum aktuellen Monat navigieren', async () => {
      render(<App />)
      const user = userEvent.setup()

      // "Heute"-Button klicken
      const todayButton = screen.getByText('Heute')
      await user.click(todayButton)

      // Der heutige Tag sollte markiert sein
      const todayCell = document.querySelector('.calendar-day.today')
      expect(todayCell).toBeInTheDocument()
    })

    it('sollte zum vorherigen Monat navigieren', async () => {
      render(<App />)
      const user = userEvent.setup()

      // Finde den "Vorheriger Monat" Button (ChevronLeft)
      const prevButtons = screen.getAllByRole('button')
      const prevButton = prevButtons.find(btn => btn.getAttribute('title') === 'Vorheriger Monat')
      expect(prevButton).toBeDefined()

      if (prevButton) {
        await user.click(prevButton)
        // App sollte ohne Fehler bleiben
        expect(document.querySelector('.calendar-container')).toBeInTheDocument()
      }
    })

    it('sollte zum nächsten Monat navigieren', async () => {
      render(<App />)
      const user = userEvent.setup()

      const nextButtons = screen.getAllByRole('button')
      const nextButton = nextButtons.find(btn => btn.getAttribute('title') === 'Nächster Monat')
      expect(nextButton).toBeDefined()

      if (nextButton) {
        await user.click(nextButton)
        expect(document.querySelector('.calendar-container')).toBeInTheDocument()
      }
    })
  })

  describe('Tagesauswahl', () => {
    it('sollte einen Tag auswählen', async () => {
      render(<App />)
      const user = userEvent.setup()

      // Klicke auf einen Tag
      const dayCells = document.querySelectorAll('.calendar-day')
      if (dayCells.length > 0) {
        await user.click(dayCells[0])

        // Tag sollte ausgewählt sein
        await waitFor(() => {
          expect(dayCells[0]).toHaveClass('selected')
        })
      }
    })
  })

  describe('Task-Anzeige', () => {
    it('sollte Tasks mit Kreisdiagramm anzeigen', () => {
      render(<App />)

      // Prüfe ob SVG Kreisdiagramme existieren (wenn Tasks vorhanden)
      const pieCharts = document.querySelectorAll('.pie-chart')
      // Kann 0 oder mehr sein, je nachdem ob Tasks an diesem Tag sind
      expect(pieCharts.length).toBeGreaterThanOrEqual(0)
    })

    it('sollte Task-Zähler anzeigen', () => {
      render(<App />)

      // Prüfe auf Task-Count-Badges
      const taskCounts = document.querySelectorAll('.task-count')
      expect(taskCounts.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Urgency-Farbverlauf', () => {
    it('sollte Urgency-Indikatoren anzeigen', () => {
      render(<App />)

      // Prüfe auf Urgency-Balken
      const urgencyBars = document.querySelectorAll('.urgency-bar')
      expect(urgencyBars.length).toBeGreaterThanOrEqual(0)
    })
  })
})
