import { createClient } from "@libsql/client";
import * as fs from "fs";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function backupDatabase() {
  console.log("🔄 Starting Turso database backup...\n");

  const tables = ["expenses", "budgets", "vendors", "user", "session", "account", "verification"];
  const backup: any = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  for (const table of tables) {
    try {
      console.log(`📊 Backing up table: ${table}`);
      const result = await client.execute(`SELECT * FROM ${table}`);
      backup.tables[table] = {
        rows: result.rows,
        count: result.rows.length,
      };
      console.log(`✓ ${table}: ${result.rows.length} rows\n`);
    } catch (error: any) {
      console.log(`⚠️  ${table}: ${error.message}\n`);
      backup.tables[table] = {
        rows: [],
        count: 0,
        error: error.message,
      };
    }
  }

  const filename = `turso-backup-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));

  console.log(`✅ Backup completed: ${filename}`);
  console.log(`\n📊 Summary:`);
  for (const [table, data] of Object.entries(backup.tables) as any) {
    console.log(`   - ${table}: ${data.count} rows`);
  }

  client.close();
}

backupDatabase().catch(console.error);
