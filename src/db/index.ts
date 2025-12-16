import { drizzle } from 'drizzle-orm/postgres-js';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

const databaseUrl = process.env.DATABASE_URL || 
  `postgresql://postgres.xpdjggmhifobuelsjkoh@db.xpdjggmhifobuelsjkoh.supabase.co:5432/postgres`;

const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });

export type Database = typeof db;