import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iyvxnlzrubfyeyqmsqnm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_rDICo0K4A53lznS1P5CWCg_P02PP6jx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
