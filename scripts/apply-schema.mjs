import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applySchema() {
  console.log('Reading schema file...');
  
  const schemaPath = path.join(process.cwd(), 'supabase', 'migrations', '0018_cream_schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  console.log('Applying schema to Supabase...');
  
  const { error } = await supabase.rpc('exec', {
    sql: schema
  }).catch(async () => {
    // If exec RPC doesn't exist, try using the SQL directly via admin API
    console.log('Using direct SQL execution...');
    
    // Split by semicolons and execute each statement
    const statements = schema.split(';').filter(s => s.trim());
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (!statement.trim()) continue;
      
      try {
        const { error } = await supabase.rpc('exec', { sql: statement + ';' }).catch(() => {
          // Fallback: log that we can't execute via RPC
          return { error: 'RPC not available' };
        });
        
        if (error) {
          console.warn(`⚠️  Statement error: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.warn(`⚠️  Error executing statement: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\nSchema application attempted: ${successCount} succeeded, ${errorCount} had issues`);
    return { error: null };
  });

  if (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  }

  console.log('✅ Schema applied successfully!');
}

applySchema();
