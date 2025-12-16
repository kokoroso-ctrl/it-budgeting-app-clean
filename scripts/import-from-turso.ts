import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://xpdjggmhifobuelsjkoh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZGpnZ21oaWZvYnVlbHNqa29oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2MTE5OSwiZXhwIjoyMDgxNDM3MTk5fQ.Lf0_rDwPQXryojV2-AawWWDvONrJIIxV_pySVmUbQ74';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importFromTurso() {
  try {
    // Read backup file
    const backup = JSON.parse(fs.readFileSync('turso-backup-1765866298361.json', 'utf8'));
    const expenses = backup.tables.expenses.rows;

    console.log(`Importing ${expenses.length} expenses...`);

    // Map fields to match new schema (remove invoice fields)
    const mappedExpenses = expenses.map((exp: any) => ({
      id: exp.id,
      date: exp.date,
      vendor: exp.vendor,
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      status: exp.status,
      po_number: exp.po_number,
      warranty: exp.warranty,
      expired_warranty: exp.expired_warranty,
      license_type: exp.license_type,
      expired_subscription: exp.expired_subscription,
      created_at: exp.created_at,
      updated_at: exp.updated_at
    }));

    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < mappedExpenses.length; i += batchSize) {
      const batch = mappedExpenses.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('expenses')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`Imported batch ${i / batchSize + 1} (${batch.length} items)`);
      }
    }

    console.log('Import completed!');
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importFromTurso();
