import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qpprzcckolmdyabnmgol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA5MTYsImV4cCI6MjA4OTkzNjkxNn0.Pp9fTdklyomxmG6wsb8FBzyhLXaXEx983ofdaiPG_So";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
