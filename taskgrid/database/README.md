# TaskGrid Datenbank-Schema

Dieser Ordner enthält alle SQL-Dateien für die Supabase-Datenbank-Konfiguration.

## Dateien

| Datei | Beschreibung |
|-------|-------------|
| `schema.sql` | Vollständiges Datenbankschema mit Tabellen, Indizes, RLS-Policies und Triggern |
| `seed.sql` | Beispieldaten und Konfigurationshinweise |

## Schnellstart

### 1. Supabase Projekt einrichten

1. Gehe zu [https://supabase.com](https://supabase.com) und erstelle ein kostenloses Konto
2. Erstelle ein neues Projekt
3. Warte, bis das Projekt bereit ist

### 2. Datenbank-Schema importieren

1. Öffne das Supabase Dashboard
2. Navigiere zu "SQL Editor"
3. Klicke auf "New query"
4. Kopiere den Inhalt von `schema.sql` in den Editor
5. Klicke auf "Run"

Das Schema enthält:
- **tasks** - Haupttabelle für Aufgaben
- **task_history** - Audit-Log für Änderungen
- **user_preferences** - Benutzereinstellungen
- **Views** für Statistiken und überfällige Aufgaben
- **RLS Policies** für Datensicherheit
- **Trigger** für automatische Timestamps und Logging
- **Funktionen** für erweiterte Abfragen

### 3. Environment-Variablen konfigurieren

Erstelle eine `.env` Datei im Projekt-Root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Die Werte findest du im Supabase Dashboard unter:
- **Project Settings > API > Project URL** (für URL)
- **Project Settings > API > Project API keys > anon/public** (für Key)

### 4. Authentication aktivieren (optional)

Falls du Benutzer-Authentifizierung nutzen möchtest:

1. Gehe zu **Authentication > Providers**
2. Aktiviere "Email" oder andere Provider
3. Konfiguriere die Anmelde-Optionen

## Datenbank-Schema

### Tabelle: tasks

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel, automatisch generiert |
| user_id | UUID | Fremdschlüssel zu auth.users |
| title | TEXT | Aufgabentitel (max. 200 Zeichen) |
| description | TEXT | Beschreibung (max. 2000 Zeichen) |
| category | TEXT | Kategorie: Arbeit, Privat, Schule, Sonstiges |
| priority | TEXT | Priorität: Hoch, Mittel, Niedrig |
| deadline | TIMESTAMPTZ | Fälligkeitsdatum |
| status | TEXT | Status: Offen, In Arbeit, Erledigt |
| completed | BOOLEAN | Erledigt-Status |
| created_at | TIMESTAMPTZ | Erstellungsdatum |
| updated_at | TIMESTAMPTZ | Letzte Aktualisierung |

### Tabelle: task_history

Speichert alle Änderungen an Aufgaben für Audit-Zwecke.

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primärschlüssel |
| task_id | UUID | Referenz zur Aufgabe |
| user_id | UUID | Benutzer, der die Änderung gemacht hat |
| action | TEXT | Aktion: created, updated, deleted, completed, reopened |
| old_values | JSONB | Vorherige Werte |
| new_values | JSONB | Neue Werte |
| created_at | TIMESTAMPTZ | Zeitpunkt der Änderung |

### Tabelle: user_preferences

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| user_id | UUID | Primärschlüssel, Referenz zu auth.users |
| default_category | TEXT | Standardkategorie für neue Aufgaben |
| default_priority | TEXT | Standardpriorität für neue Aufgaben |
| email_notifications | BOOLEAN | E-Mail-Benachrichtigungen aktiviert |
| notification_days_before | INTEGER | Tage vor Deadline für Benachrichtigung |
| theme | TEXT | UI-Theme: light, dark, system |

## Sicherheit

### Row Level Security (RLS)

Alle Tabellen haben RLS aktiviert. Benutzer können nur ihre eigenen Daten sehen und bearbeiten:

- **SELECT**: Benutzer sieht nur eigene tasks
- **INSERT**: Benutzer kann nur eigene tasks erstellen
- **UPDATE**: Benutzer kann nur eigene tasks aktualisieren
- **DELETE**: Benutzer kann nur eigene tasks löschen

### Indizes

Für optimale Performance:

- `idx_tasks_user_id` - Für Benutzer-bezogene Abfragen
- `idx_tasks_deadline` - Für Sortierung nach Fälligkeitsdatum
- `idx_tasks_completed` - Für Filterung nach Status
- `idx_tasks_user_completed_deadline` - Composite-Index für häufige Filterkombinationen
- `idx_tasks_search` - GIN-Index für Volltextsuche

## Funktionen

### get_tasks_paginated()

Gibt Aufgaben mit Pagination zurück:

```sql
SELECT * FROM get_tasks_paginated(
  'user-uuid-here',  -- user_id
  50,                -- limit
  0,                 -- offset
  'deadline',        -- sort_by
  'asc'              -- sort_order
);
```

### search_tasks()

Volltextsuche in Titel und Beschreibung:

```sql
SELECT * FROM search_tasks(
  'user-uuid-here',
  'projekt',
  20
);
```

### batch_update_task_status()

Aktualisiert den Status mehrerer Aufgaben auf einmal:

```sql
SELECT batch_update_task_status(
  ARRAY['task-id-1', 'task-id-2']::UUID[],
  TRUE,  -- completed
  'user-uuid-here'
);
```

### get_overdue_tasks()

Gibt überfällige Aufgaben zurück:

```sql
SELECT * FROM get_overdue_tasks('user-uuid-here', 100);
```

## Views

### upcoming_tasks

Zeigt bevorstehende Aufgaben mit Dringlichkeitsstufe:

```sql
SELECT * FROM upcoming_tasks;
```

Spalten:
- Alle task-Spalten
- `urgency`: overdue, today, week, month, later

### task_statistics

Statistiken pro Benutzer:

```sql
SELECT * FROM task_statistics;
```

Spalten:
- `user_id`
- `open_tasks` - Anzahl offener Aufgaben
- `completed_tasks` - Anzahl erledigter Aufgaben
- `overdue_tasks` - Anzahl überfälliger Aufgaben
- `due_this_week` - Fällig diese Woche
- `total_tasks` - Gesamtanzahl

## Triggers

### update_updated_at_column

Aktualisiert automatisch `updated_at` bei Änderungen.

### tasks_history_trigger

Protokolliert alle Änderungen in `task_history`.

### on_auth_user_created

Erstellt automatisch Benutzereinstellungen beim Registrieren.

## Troubleshooting

### Fehler: "relation does not exist"

Stelle sicher, dass:
1. Das Schema korrekt importiert wurde
2. Du dich in der richtigen Datenbank befindest (public schema)
3. Die Tabellennamen korrekt geschrieben sind (case-sensitive!)

### Fehler: "permission denied"

Stelle sicher, dass:
1. RLS korrekt konfiguriert ist
2. Der Benutzer authentifiziert ist
3. Die Policies die gewünschten Operationen erlauben

### Fehler: "new row violates row-level security policy"

Die `user_id` muss bei INSERT auf die aktuelle Benutzer-ID gesetzt werden:

```javascript
const { data: { user } } = await supabase.auth.getUser()
await supabase.from('tasks').insert({
  user_id: user.id,  // WICHTIG!
  title: 'Neue Aufgabe',
  // ...
})
```

### Realtime funktioniert nicht

Überprüfe:
1. Ist die Tabelle zur Publication hinzugefügt?
2. Läuft der Channel-Name eindeutig?
3. Ist der Filter korrekt gesetzt?

## Weitere Ressourcen

- [Supabase Dokumentation](https://supabase.com/docs)
- [PostgreSQL Dokumentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
