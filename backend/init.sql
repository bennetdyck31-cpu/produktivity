-- TaskGrid Datenbankschema (PostgreSQL)
-- Wird automatisch beim ersten `docker-compose up` ausgeführt

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  category    TEXT        NOT NULL DEFAULT 'Sonstiges',
  priority    TEXT        NOT NULL DEFAULT 'Mittel',
  deadline    TIMESTAMPTZ NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'Offen',
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für häufige Abfragen
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Beispiel-Daten (optional, zum Testen)
INSERT INTO tasks (title, description, category, priority, deadline, status) VALUES
  ('Projektpräsentation vorbereiten', 'Folien für das Kundenmeeting', 'Arbeit', 'Hoch', NOW() + INTERVAL '2 days', 'Offen'),
  ('Steuererklärung', 'Unterlagen für 2025 sammeln', 'Privat', 'Mittel', NOW() - INTERVAL '1 day', 'Offen'),
  ('Mathe-Hausaufgaben', 'Seite 45-47 im Lehrbuch', 'Schule', 'Mittel', NOW() + INTERVAL '1 day', 'In Arbeit'),
  ('Einkaufen', 'Milch, Eier, Brot, Gemüse', 'Privat', 'Niedrig', NOW() + INTERVAL '5 days', 'Offen');
