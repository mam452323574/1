import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251107000000_add_analysis_result_to_scans.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Applying migration: add_analysis_result_to_scans');
    console.log('Migration SQL:', migrationSQL);

    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }

    console.log('Migration applied successfully!');
    console.log('Result:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration();
