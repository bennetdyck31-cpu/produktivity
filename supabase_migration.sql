-- Run this once in Supabase SQL Editor (supabase.com → SQL Editor)
-- URL: https://supabase.com/dashboard/project/czsvsumeqqbcwcogbnjm/sql/new

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  day_date    DATE        NOT NULL,
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_day_date ON tasks(day_date);

-- Row Level Security — allow full access via anon key (personal use)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON tasks;

CREATE POLICY "Allow all for anon" ON tasks
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
