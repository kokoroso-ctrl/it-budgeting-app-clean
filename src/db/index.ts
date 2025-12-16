import { drizzle } from 'drizzle-orm/postgres-js';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

const connectionString = `postgresql://postgres.xpdjggmhifobuelsjkoh:${process.env.SUPABASE_DB_PASSWORD || 'fq9qG6WY8A5UDcMo'}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`;

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

export type Database = typeof db;