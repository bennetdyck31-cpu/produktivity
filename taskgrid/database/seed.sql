-- ============================================
-- SEED DATA
-- ============================================
-- Diese Daten dienen nur zu Testzwecken
-- In Produktion sollten keine Test-Daten eingefügt werden
-- ============================================

-- Beispielaufgaben (nur für Entwicklungszwecke)
-- Hinweis: user_id muss durch eine echte User-ID ersetzt werden

-- INSERT INTO public.tasks (
--     user_id,
--     title,
--     description,
--     category,
--     priority,
--     deadline,
--     status,
--     completed
-- ) VALUES
-- -- Überfällige Aufgabe
-- (
--     '00000000-0000-0000-0000-000000000000',
--     'Steuererklärung 2024',
--     'Unterlagen für das Finanzamt zusammenstellen',
--     'Privat',
--     'Hoch',
--     NOW() - INTERVAL '7 days',
--     'Offen',
--     FALSE
-- ),
-- -- Aufgabe für heute
-- (
--     '00000000-0000-0000-0000-000000000000',
--     'Projektpräsentation vorbereiten',
--     'Folien für das Kundenmeeting erstellen',
--     'Arbeit',
--     'Hoch',
--     NOW() + INTERVAL '4 hours',
--     'In Arbeit',
--     FALSE
-- ),
-- -- Aufgabe für diese Woche
-- (
--     '00000000-0000-0000-0000-000000000000',
--     'Mathe-Hausaufgaben',
--     'Seite 45-47 im Lehrbuch bearbeiten',
--     'Schule',
--     'Mittel',
--     NOW() + INTERVAL '3 days',
--     'Offen',
--     FALSE
-- ),
-- -- Niedrige Priorität
-- (
--     '00000000-0000-0000-0000-000000000000',
--     'Auto waschen',
--     'Innen- und Außenreinigung',
--     'Privat',
--     'Niedrig',
--     NOW() + INTERVAL '10 days',
--     'Offen',
--     FALSE
-- ),
-- -- Erledigte Aufgabe
-- (
--     '00000000-0000-0000-0000-000000000000',
--     'Einkaufen',
--     'Milch, Eier, Brot, Gemüse',
--     'Privat',
--     'Niedrig',
--     NOW() - INTERVAL '2 days',
--     'Erledigt',
--     TRUE
-- );

-- ============================================
-- KONFIGURATIONSHINWEISE
-- ============================================

-- Um die Supabase-Integration zu aktivieren:

-- 1. Supabase Projekt erstellen:
--    Gehe zu https://supabase.com und erstelle ein neues Projekt

-- 2. SQL Editor öffnen:
--    - Im Supabase Dashboard auf "SQL Editor" klicken
--    - "New query" erstellen
--    - Den Inhalt von schema.sql kopieren und ausführen

-- 3. Environment Variablen setzen:
--    Erstelle eine .env Datei im Projekt-Root:
--
--    VITE_SUPABASE_URL=https://your-project.supabase.co
--    VITE_SUPABASE_ANON_KEY=your-anon-key
--
--    Die Werte findest du unter:
--    Settings > API > Project URL (für URL)
--    Settings > API > Project API keys > anon/public (für Key)

-- 4. Authentication einrichten (optional):
--    - Gehe zu Authentication > Providers
--    - Aktiviere "Email" oder andere Provider
--    - Konfiguriere die gewünschten Optionen

-- 5. Realtime aktivieren:
--    - Gehe zu Database > Publications
--    - Stelle sicher, dass "supabase_realtime" existiert
--    - Die Tabelle "tasks" sollte zur Publication hinzugefügt sein
--    (Das macht der Schema-Import automatisch)

-- ============================================
-- NÜTZLICHE ABFRAGEN
-- ============================================

-- Alle Aufgaben eines Benutzers anzeigen:
-- SELECT * FROM tasks WHERE user_id = 'user-uuid-here' ORDER BY deadline;

-- Überfällige Aufgaben anzeigen:
-- SELECT * FROM overdue_tasks WHERE user_id = 'user-uuid-here';

-- Statistiken anzeigen:
-- SELECT * FROM task_statistics WHERE user_id = 'user-uuid-here';

-- Aufgaben nach Kategorie gruppieren:
-- SELECT category, COUNT(*) as count,
--        COUNT(*) FILTER (WHERE completed = true) as completed
-- FROM tasks
-- WHERE user_id = 'user-uuid-here'
-- GROUP BY category;

-- Historie einer Aufgabe anzeigen:
-- SELECT * FROM task_history
-- WHERE task_id = 'task-uuid-here'
-- ORDER BY created_at DESC;
