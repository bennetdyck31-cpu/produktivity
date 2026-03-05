# TaskGrid – ToDo Kalender App

Eine moderne ToDo-App mit Excel-ähnlichem Kalender-Layout für persönliche Planung und Strukturierung.

## Features

- **Kalender-Ansicht**: Excel-ähnliches Monatslayout mit interaktiven Tagesfeldern
- **Erweiterbare Tagesfelder**: Klick auf einen Tag öffnet Detailansicht mit
  - Stichpunktliste aller Tasks
  - Kreisdiagramm (Fortschritt erledigt/offen)
  - Farbverlauf basierend auf Dringlichkeit
- **Task-Verwaltung**: Erstellen, Bearbeiten, Löschen, Als erledigt markieren
- **Farbverlauf für überfällige Tasks**:
  - Grün (`#769E6B`): Geplant
  - Ocker/Gelb (`#D4A373`): Bald fällig
  - Rot (`#CD5C5C`): Überfällig
  - Grau (`#A0A0A0`): Erledigt
- **Hover-Actions**: Bearbeiten/Löschen-Buttons erscheinen bei Hover über Tasks
- **Docker-Backend**: PostgreSQL Datenbank mit Express API

## Technologie-Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express + PostgreSQL
- **Infrastruktur**: Docker Compose
- **Styling**: CSS Custom Properties (Elegant Light Theme)

## Neue Komponenten (März 2026)

### Kalender-Komponenten

```
src/components/calendar/
├── CalendarGrid.jsx   # Hauptkalender mit Monatsnavigation
├── CalendarDay.jsx    # Tagesfeld mit Tasks und Pie-Chart
├── PieChart.jsx       # SVG Kreisdiagramm für Task-Statistiken
├── DayExpansion.jsx   # Expandiertes Tagesfeld (Modal)
└── index.js           # Exporte
```

### Hooks

```
src/hooks/
├── useTaskUrgency.js    # Berechnet Dringlichkeits-Farbe (Grün→Rot)
├── useTasks.js          # Task-Statistiken
└── useDeadlineStatus.js # Deadline-Status
```

### Design-System (Elegant Light Theme)

```css
:root {
  /* Hintergründe */
  --bg-primary: #F9F9F6;    /* Creme/Off-White */
  --bg-surface: #FFFFFF;    /* Weiße Karten */
  --bg-elevated: #F0F0EB;  /* Hover/Aktiv */

  /* Text */
  --text-primary: #2C2A29;   /* Fast Schwarz */
  --text-secondary: #5C5A59; /* Gedämpftes Grau */
  --text-muted: #8C8A89;     /* Hellgrau */

  /* Akzente */
  --accent-green: #4A5D23;  /* Dunkles Mattgrün */
  --accent-brown: #8B5A2B;  /* Einfaches Braun */

  /* Dringlichkeits-Farben */
  --task-planned: #769E6B;  /* Weiches Grün */
  --task-soon: #D4A373;     /* Warn-Ocker */
  --task-urgent: #CD5C5C;   /* Gedämpftes Rot */
  --task-done: #A0A0A0;     /* Grau */
}
```

## Installation & Start

### 1. Frontend starten

```bash
cd taskgrid
npm install
npm run dev
```

Das Frontend läuft auf `http://localhost:5173`

### 2. Backend starten (Docker)

```bash
docker-compose up --build
```

Das Backend läuft auf `http://localhost:3001`

## API Endpoints

- `GET /api/tasks` – Alle Aufgaben abrufen
- `POST /api/tasks` – Neue Aufgabe erstellen
- `PATCH /api/tasks/:id` – Aufgabe aktualisieren
- `DELETE /api/tasks/:id` – Aufgabe löschen

## Fixed Bugs (März 2026)

### 1. React Hook Verstoß in CalendarGrid.jsx
**Problem**: `useTaskStats` wurde innerhalb einer `map()` Schleife aufgerufen, was gegen React-Regeln verstößt.
**Fix**: Berechnung jetzt direkt in der Map-Funktion ohne Hook
**Datei**: `src/components/calendar/CalendarGrid.jsx`

### 2. Falscher Import in App.jsx
**Problem**: Import-Pfad `{ Calendar } from './components/Calendar'` existierte nicht.
**Fix**: Korrigiert zu `{ CalendarGrid } from './components/calendar/CalendarGrid'`
**Datei**: `src/App.jsx`

### 3. Backend CORS falsch konfiguriert
**Problem**: CORS war nur auf `localhost:1000` erlaubt, Vite läuft aber auf Port 5173.
**Fix**: CORS erlaubt jetzt mehrere Ports: `[5173, 3000, 1000]`
**Datei**: `backend/server.js`

### 4. Min-Date bei Task-Bearbeitung
**Problem**: Das Datum-Feld hatte ein `min`-Attribut auf "heute", was die Bearbeitung vergangener Tasks verhinderte.
**Fix**: `minDate` wird nur für neue Tasks gesetzt
**Datei**: `src/components/tasks/TaskModal.jsx`

### 5. Sidebar Date-Handling inkonsistent
**Problem**: Die Sidebar gab nur die Tagnummer weiter, nicht das vollständige Date-Objekt.
**Fix**: Gibt jetzt vollständiges Date-Objekt zurück
**Datei**: `src/components/layout/Sidebar.jsx`

### 6. Test-Inkompatibilität
**Problem**: Alte Tests erwarteten alte TaskGrid-Struktur mit Tabellenansicht.
**Fix**: Neue Tests für Kalender-Ansicht geschrieben
**Datei**: `src/components/__tests__/App.test.jsx`

## Datenbank-Schema

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Sonstiges',
  priority TEXT DEFAULT 'Mittel',
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'Offen',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Entwicklung

```bash
# Tests ausführen
npm test

# Build erstellen
npm run build

# Linting
npm run lint
```

## Geplante Verbesserungen

- [ ] Backend-Anbindung mit fetch() für persistente Datenspeicherung
- [ ] Benutzer-Authentifizierung
- [ ] Mobile responsive Verbesserungen
- [ ] Drag & Drop für Tasks zwischen Tagen

## Lizenz

MIT
