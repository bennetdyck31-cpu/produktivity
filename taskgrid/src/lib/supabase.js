import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://czsvsumeqqbcwcogbnjm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6c3ZzdW1lcXFiY3djb2dibmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTUxMjYsImV4cCI6MjA4ODI5MTEyNn0.tPXBtBFhtJ8gnbcdWohyU9blgcp9oSXiKb4jbXoVITc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
