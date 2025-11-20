import { drizzle } from 'drizzle-orm/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../supabaseClient';

function assertAdminClient(client: SupabaseClient<Record<string, unknown>> | null) {
  if (!client) {
    throw new Error('SUPABASE_SECRET_KEY est requis pour les opérations côté serveur.');
  }

  return client;
}

export const db = drizzle(assertAdminClient(supabaseAdmin));
