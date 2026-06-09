import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = window._env?.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = window._env?.SUPABASE_ANON_KEY || 'placeholder';

window._supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
