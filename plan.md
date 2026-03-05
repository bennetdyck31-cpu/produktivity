# 📋 TaskGrid – Neuer Projektplan (Docker & Kalender-Zentriert)

> Eine schlichte, edle und mobilfreundliche ToDo-App mit interaktivem Kalender für die persönliche Planung.

---

## 🎯 Kernkonzept
Das primäre Interface ist ein Kalender, der sich wie folgt verhält:
- **Interaktive Tagesfelder**: Beim Klick auf ein Datum (z.B. 5.3.26) vergrößert sich das Feld fließend.
- **Stichpunkt-Schnelleingabe**: Im vergrößerten Modus können schnelle ToDo-Einträge als simple Liste vorgenommen werden.
- **Visualisierung**: Jedes vergrößerte Feld zeigt ein **Kreisdiagramm (Pie Chart)** zum Aufgaben-Fortschritt des Tages.
- **Dringlichkeits-Farben**: Unerledigte Aufgaben wechseln täglich fließend die Farbe von **Grün (geplant)** hin zu **Rot (dringlich)**.
- **Hover-Aktionen**: Beim Hovern über einen Task erscheinen direkt die Optionen: **Abschließen, Bearbeiten, Löschen**.

---

## 🎨 Design-System & UI
**Stil**: Schlicht, edel, modern und unbedingt **handyfreundlich** (Mobile-First).

### Farbpalette (Helles Theme)
| Element | Farbe/Hex | Beschreibung |
|---------|-----------|--------------|
| **Hintergrund** | `#F9F9F6` | Sehr sanftes Off-White / Cremeweiß |
| **Oberflächen** | `#FFFFFF` | Reine weiße Karten für Kalenderfelder, subtiler Schatten |
| **Primärtext** | `#2C2A29` | Fast Schwarz, hoher Kontrast |
| **Akzent 1** | `#4A5D23` | Dunkles Matt-Grün (Abschlüsse, positive Aktionen) |
| **Akzent 2** | `#8B5A2B` | Schlichtes Braun (Sekundäre Aktionen, Ränder) |

### Dynamische Task-Farben (Zeit-Verlauf)
- **Geplant (> 3 Tage Zeit)**: Sanftes Grün
- **Nähernd (1-2 Tage Zeit)**: Warnendes Ocker / Gelb
- **Dringlich (Heute/Überfällig)**: Gedämpftes Rot

---

## ⚙️ Technologie-Stack & Architektur
Alles wird **vollständig auf Docker** umgebaut.

- **Frontend**: React + Vite (als eigener Docker Container)
- **Backend / API**: Node.js + Express (Docker Container)
- **Datenbank**: PostgreSQL 16 (Docker Container)
- **Orchestrierung**: Eine zentrale `docker-compose.yml`, die alle drei Services startet.

### 📁 Geplante Ordnerstruktur
```text
/
├── frontend/          # React App (wird aus 'taskgrid' umbenannt/ersetzt)
│   ├── src/           # Components: Calendar, DayExpanded, TaskItem, PieChart
│   └── Dockerfile
├── backend/           # Express API
│   ├── server.js      # API Routen
│   ├── init.sql       # Neues DB Schema für Termin-basierte Tasks
│   └── Dockerfile
└── docker-compose.yml # Fährt DB, Backend & Frontend gemeinsam hoch
```

---

## 🗺️ Implementierungs-Roadmap

### Phase 1: Vollständiger Docker-Umbau 🐳
- [ ] Das Frontend (`taskgrid`) dockerisieren (Dockerfile erstellen).
- [ ] `docker-compose.yml` im Hauptordner erweitern, sodass Frontend, Backend und DB als Verbund laufen.
- [ ] Supabase aus dem Projekt komplett entfernen.
- [ ] Ordnerstruktur sauber aufteilen (`/frontend` und `/backend`).

### Phase 2: Design-System & Kalender-Basis 🎨
- [ ] Altes Excel-Style Tabellen-Design restlos entfernen.
- [ ] Neues CSS-Designsystem (Helles Theme, Braun/Grün-Akzente) implementieren.
- [ ] Einen fully-responsive CSS-Grid Kalender bauen (Monatsansicht).

### Phase 3: Interaktive Tagesfelder & Circular Progress 📅
- [ ] Expand-Animation für Tagesfelder beim Klick einbauen.
- [ ] Stichpunkt-Eingabefeld im expandierten Tagesfeld integrieren.
- [ ] Kompaktes Kreisdiagramm (Pie Chart) pro Tag für die Stati der Tasks integrieren.

### Phase 4: Farb-Dynamik & Hover-Aktionen ✨
- [ ] Logik in React implementieren: Farbwechsel der unerledigten Tasks von Grün zu Rot basierend auf dem aktuellen Datum.
- [ ] Hover-Menü für Tasks hinzufügen (✅ Beenden | ✏️ Bearbeiten | 🗑️ Löschen).
- [ ] Backend API anbinden, um Tasks tageweise abzuspeichern und zu laden.
