-- TaskGrid Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
    description TEXT CHECK (char_length(description) <= 2000),
    category TEXT DEFAULT 'Sonstiges' CHECK (category IN ('Arbeit', 'Privat', 'Schule', 'Sonstiges')),
    priority TEXT DEFAULT 'Mittel' CHECK (priority IN ('Hoch', 'Mittel', 'Niedrig')),
    deadline TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Offen' CHECK (status IN ('Offen', 'In Arbeit', 'Erledigt')),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task history table for audit logging
CREATE TABLE IF NOT EXISTS public.task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'completed', 'reopened')),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_category TEXT DEFAULT 'Sonstiges',
    default_priority TEXT DEFAULT 'Mittel',
    email_notifications BOOLEAN DEFAULT TRUE,
    notification_days_before INTEGER DEFAULT 1,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_deadline ON public.tasks(user_id, completed, deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_user_category ON public.tasks(user_id, category);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON public.tasks(user_id, priority);

-- GIN index for full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_tasks_search ON public.tasks USING gin(
    to_tsvector('german', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Indexes for task_history
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON public.task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON public.task_history(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view their own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Task history policies (read-only for users)
CREATE POLICY "Users can view their own task history"
    ON public.task_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert task history"
    ON public.task_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
    ON public.user_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for tasks table
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for user_preferences table
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log task changes to history
CREATE OR REPLACE FUNCTION public.log_task_change()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    old_vals JSONB;
    new_vals JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        action_type := 'created';
        old_vals := NULL;
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
            action_type := 'completed';
        ELSIF NEW.completed = FALSE AND OLD.completed = TRUE THEN
            action_type := 'reopened';
        ELSE
            action_type := 'updated';
        END IF;
        old_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'deleted';
        old_vals := to_jsonb(OLD);
        new_vals := NULL;
    END IF;

    INSERT INTO public.task_history (
        task_id,
        user_id,
        action,
        old_values,
        new_values
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.user_id, OLD.user_id),
        action_type,
        old_vals,
        new_vals
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task history logging
CREATE TRIGGER tasks_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.log_task_change();

-- Function to create user preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VIEWS
-- ============================================

-- View for upcoming deadlines
CREATE OR REPLACE VIEW public.upcoming_tasks AS
SELECT
    t.*,
    CASE
        WHEN t.deadline < NOW() THEN 'overdue'
        WHEN t.deadline < NOW() + INTERVAL '1 day' THEN 'today'
        WHEN t.deadline < NOW() + INTERVAL '7 days' THEN 'week'
        WHEN t.deadline < NOW() + INTERVAL '30 days' THEN 'month'
        ELSE 'later'
    END as urgency
FROM public.tasks t
WHERE t.completed = FALSE
ORDER BY t.deadline ASC;

-- View for task statistics
CREATE OR REPLACE VIEW public.task_statistics AS
SELECT
    user_id,
    COUNT(*) FILTER (WHERE completed = FALSE) as open_tasks,
    COUNT(*) FILTER (WHERE completed = TRUE) as completed_tasks,
    COUNT(*) FILTER (WHERE completed = FALSE AND deadline < NOW()) as overdue_tasks,
    COUNT(*) FILTER (WHERE completed = FALSE AND deadline < NOW() + INTERVAL '7 days') as due_this_week,
    COUNT(*) as total_tasks
FROM public.tasks
GROUP BY user_id;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get tasks with pagination
CREATE OR REPLACE FUNCTION public.get_tasks_paginated(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_sort_by TEXT DEFAULT 'deadline',
    p_sort_order TEXT DEFAULT 'asc'
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    priority TEXT,
    deadline TIMESTAMPTZ,
    status TEXT,
    completed BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY EXECUTE format('
        SELECT
            t.*,
            COUNT(*) OVER() as total_count
        FROM public.tasks t
        WHERE t.user_id = $1
        ORDER BY t.%I %s
        LIMIT $2 OFFSET $3
    ', p_sort_by, p_sort_order)
    USING p_user_id, p_limit, p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search tasks
CREATE OR REPLACE FUNCTION public.search_tasks(
    p_user_id UUID,
    p_query TEXT,
    p_limit INTEGER DEFAULT 20
)
RETURNS SETOF public.tasks AS $$
BEGIN
    RETURN QUERY
    SELECT t.*
    FROM public.tasks t
    WHERE t.user_id = p_user_id
      AND (
          to_tsvector('german', coalesce(t.title, '') || ' ' || coalesce(t.description, ''))
          @@ plainto_tsquery('german', p_query)
      )
    ORDER BY t.deadline ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to batch update task status
CREATE OR REPLACE FUNCTION public.batch_update_task_status(
    p_task_ids UUID[],
    p_completed BOOLEAN,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.tasks
    SET
        completed = p_completed,
        status = CASE WHEN p_completed THEN 'Erledigt' ELSE 'Offen' END,
        updated_at = NOW()
    WHERE id = ANY(p_task_ids)
      AND user_id = p_user_id;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get overdue tasks
CREATE OR REPLACE FUNCTION public.get_overdue_tasks(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS SETOF public.tasks AS $$
BEGIN
    RETURN QUERY
    SELECT t.*
    FROM public.tasks t
    WHERE t.user_id = p_user_id
      AND t.completed = FALSE
      AND t.deadline < NOW()
    ORDER BY t.deadline ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REAL-TIME SUBSCRIPTION SETUP
-- ============================================

-- Add tables to publication for real-time
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    END IF;
END
$$;
