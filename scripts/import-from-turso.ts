import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://xpdjggmhifobuelsjkoh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZGpnZ21oaWZvYnVlbHNqa29oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2MTE5OSwiZXhwIjoyMDgxNDM3MTk5fQ.Lf0_rDwPQXryojV2-AawWWDvONrJIIxV_pySVmUbQ74';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importFromTurso() {
  try {
    const backup = JSON.parse(fs.readFileSync('turso-backup-1765866298361.json', 'utf8'));

    // Import vendors
    const vendors = backup.tables.vendors.rows;
    console.log(`Importing ${vendors.length} vendors...`);
    const { error: vendorError } = await supabase.from('vendors').insert(vendors);
    if (vendorError) console.error('Vendor import error:', vendorError);
    else console.log('✓ Vendors imported');

    // Import budgets
    const budgets = backup.tables.budgets.rows;
    console.log(`Importing ${budgets.length} budgets...`);
    const { error: budgetError } = await supabase.from('budgets').insert(budgets);
    if (budgetError) console.error('Budget import error:', budgetError);
    else console.log('✓ Budgets imported');

    // Import users
    const users = backup.tables.user.rows;
    console.log(`Importing ${users.length} users...`);
    for (const user of users) {
      const { error: userError } = await supabase.from('user').insert(user);
      if (userError) console.error('User import error:', userError);
    }
    console.log('✓ Users imported');

    // Import expenses
    const expenses = backup.tables.expenses.rows;
    console.log(`Importing ${expenses.length} expenses...`);
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
    const batchSize = 50;
    for (let i = 0; i < mappedExpenses.length; i += batchSize) {
      const batch = mappedExpenses.slice(i, i + batchSize);
      const { error } = await supabase.from('expenses').insert(batch);
      if (error) console.error(`Expense batch ${i / batchSize + 1} error:`, error);
      else console.log(`✓ Expenses batch ${i / batchSize + 1}`);
    }

    console.log('✅ Import completed!');
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importFromTurso();
