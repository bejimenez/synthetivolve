// apps/api/src/supabase.ts
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Service Role Key must be set in environment variables.');
}

// use the service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseKey);