#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class DatabaseMigration {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.migrationsDir = path.join(this.projectRoot, 'lib', 'supabase', 'migrations');
    this.supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      migrate: '🚀',
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async ensureMigrationsTable() {
    this.log('Ensuring migrations table exists...', 'info');
    
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      );
      
      -- Enable RLS on migrations table
      ALTER TABLE public._migrations ENABLE ROW LEVEL SECURITY;
      
      -- Only service role can access migrations
      CREATE POLICY IF NOT EXISTS "Service role can manage migrations"
      ON public._migrations
      FOR ALL
      TO service_role
      USING (true);
    `;
    
    const { error } = await this.supabase.rpc('exec_sql', { sql: createMigrationsTable });
    
    if (error) {
      throw new Error(`Failed to create migrations table: ${error.message}`);
    }
    
    this.log('Migrations table ready', 'success');
  }

  async getAppliedMigrations() {
    const { data, error } = await this.supabase
      .from('_migrations')
      .select('filename')
      .eq('success', true);
    
    if (error) {
      throw new Error(`Failed to get applied migrations: ${error.message}`);
    }
    
    return data.map(row => row.filename);
  }

  async createMigrationsDirectory() {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
      this.log('Created migrations directory', 'success');
    }
  }

  async generateMigration(name) {
    await this.createMigrationsDirectory();
    
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filepath = path.join(this.migrationsDir, filename);
    
    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

BEGIN;

-- Add your migration SQL here
-- Example:
-- CREATE TABLE pta2.example_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Enable RLS if needed
-- ALTER TABLE pta2.example_table ENABLE ROW LEVEL SECURITY;

-- Add RLS policies if needed
-- CREATE POLICY "Users can read their own data"
-- ON pta2.example_table
-- FOR SELECT
-- TO authenticated
-- USING (auth.uid() = user_id);

COMMIT;
`;
    
    fs.writeFileSync(filepath, template);
    this.log(`Generated migration: ${filename}`, 'success');
    return filename;
  }

  async runMigration(filename) {
    const filepath = path.join(this.migrationsDir, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Migration file not found: ${filename}`);
    }
    
    const sql = fs.readFileSync(filepath, 'utf8');
    this.log(`Running migration: ${filename}`, 'migrate');
    
    try {
      // Execute the migration SQL
      const { error } = await this.supabase.rpc('exec_sql', { sql });
      
      if (error) {
        throw error;
      }
      
      // Record successful migration
      const { error: recordError } = await this.supabase
        .from('_migrations')
        .insert({
          filename,
          success: true
        });
      
      if (recordError) {
        this.log(`Warning: Migration succeeded but failed to record: ${recordError.message}`, 'warning');
      }
      
      this.log(`Migration completed: ${filename}`, 'success');
      
    } catch (error) {
      // Record failed migration
      await this.supabase
        .from('_migrations')
        .insert({
          filename,
          success: false,
          error_message: error.message
        });
      
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  async rollbackMigration(filename) {
    this.log(`Rolling back migration: ${filename}`, 'warning');
    
    // Check if rollback file exists
    const rollbackFilename = filename.replace('.sql', '_rollback.sql');
    const rollbackPath = path.join(this.migrationsDir, rollbackFilename);
    
    if (!fs.existsSync(rollbackPath)) {
      throw new Error(`Rollback file not found: ${rollbackFilename}`);
    }
    
    const sql = fs.readFileSync(rollbackPath, 'utf8');
    
    try {
      const { error } = await this.supabase.rpc('exec_sql', { sql });
      
      if (error) {
        throw error;
      }
      
      // Remove migration record
      const { error: deleteError } = await this.supabase
        .from('_migrations')
        .delete()
        .eq('filename', filename);
      
      if (deleteError) {
        this.log(`Warning: Rollback succeeded but failed to remove record: ${deleteError.message}`, 'warning');
      }
      
      this.log(`Rollback completed: ${filename}`, 'success');
      
    } catch (error) {
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }

  async runPendingMigrations() {
    await this.ensureMigrationsTable();
    await this.createMigrationsDirectory();
    
    // Get all migration files
    const migrationFiles = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.includes('_rollback'))
      .sort();
    
    if (migrationFiles.length === 0) {
      this.log('No migration files found', 'info');
      return;
    }
    
    // Get applied migrations
    const appliedMigrations = await this.getAppliedMigrations();
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      this.log('No pending migrations', 'info');
      return;
    }
    
    this.log(`Found ${pendingMigrations.length} pending migrations`, 'info');
    
    // Run each pending migration
    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }
    
    this.log(`Completed ${pendingMigrations.length} migrations`, 'success');
  }

  async checkMigrationStatus() {
    await this.ensureMigrationsTable();
    
    const { data: migrations, error } = await this.supabase
      .from('_migrations')
      .select('*')
      .order('applied_at', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to get migration status: ${error.message}`);
    }
    
    console.log('\n📊 Migration Status:');
    console.log('='.repeat(80));
    
    if (migrations.length === 0) {
      console.log('No migrations have been applied yet.');
      return;
    }
    
    migrations.forEach(migration => {
      const status = migration.success ? '✅' : '❌';
      const date = new Date(migration.applied_at).toLocaleString();
      console.log(`${status} ${migration.filename} (${date})`);
      
      if (!migration.success && migration.error_message) {
        console.log(`   Error: ${migration.error_message}`);
      }
    });
    
    const successCount = migrations.filter(m => m.success).length;
    const failureCount = migrations.filter(m => !m.success).length;
    
    console.log('\n📈 Summary:');
    console.log(`  Total migrations: ${migrations.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${failureCount}`);
  }

  async createInitialMigration() {
    const name = 'initial_pta2_schema';
    const filename = await this.generateMigration(name);
    const filepath = path.join(this.migrationsDir, filename);
    
    // Read the existing setup-manual.sql
    const setupPath = path.join(this.projectRoot, 'lib', 'supabase', 'setup-manual.sql');
    
    if (fs.existsSync(setupPath)) {
      const setupSql = fs.readFileSync(setupPath, 'utf8');
      
      // Wrap in transaction
      const migrationSql = `-- Migration: Initial PTA2 Schema
-- Created: ${new Date().toISOString()}
-- This migration creates the complete PTA2 schema

BEGIN;

${setupSql}

COMMIT;
`;
      
      fs.writeFileSync(filepath, migrationSql);
      this.log(`Created initial migration from setup-manual.sql`, 'success');
    } else {
      this.log('setup-manual.sql not found, using empty template', 'warning');
    }
    
    return filename;
  }

  async resetDatabase() {
    this.log('WARNING: This will reset the entire pta2 schema!', 'warning');
    
    const resetSql = `
      -- Drop pta2 schema and recreate
      DROP SCHEMA IF EXISTS pta2 CASCADE;
      
      -- Drop migrations table
      DROP TABLE IF EXISTS public._migrations CASCADE;
    `;
    
    const { error } = await this.supabase.rpc('exec_sql', { sql: resetSql });
    
    if (error) {
      throw new Error(`Failed to reset database: ${error.message}`);
    }
    
    this.log('Database reset completed', 'success');
  }

  async validateSchema() {
    this.log('Validating database schema...', 'info');
    
    const validationQueries = [
      {
        name: 'pta2 schema exists',
        sql: `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'pta2'`
      },
      {
        name: 'schools table exists',
        sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'pta2' AND table_name = 'schools'`
      },
      {
        name: 'user_profiles table exists',
        sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'pta2' AND table_name = 'user_profiles'`
      },
      {
        name: 'RLS enabled on parents table',
        sql: `SELECT tablename FROM pg_tables WHERE schemaname = 'pta2' AND tablename = 'parents' AND rowsecurity = true`
      }
    ];
    
    let allValid = true;
    
    for (const check of validationQueries) {
      try {
        const { data, error } = await this.supabase.rpc('exec_sql', { sql: check.sql });
        
        if (error || !data || data.length === 0) {
          this.log(`❌ ${check.name}`, 'error');
          allValid = false;
        } else {
          this.log(`✅ ${check.name}`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${check.name}: ${error.message}`, 'error');
        allValid = false;
      }
    }
    
    if (allValid) {
      this.log('Schema validation passed', 'success');
    } else {
      this.log('Schema validation failed', 'error');
    }
    
    return allValid;
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    const migration = new DatabaseMigration();
    
    switch (command) {
      case 'run':
        await migration.runPendingMigrations();
        break;
        
      case 'generate':
        if (!arg) {
          console.error('Usage: node migrate-db.js generate <migration_name>');
          process.exit(1);
        }
        await migration.generateMigration(arg);
        break;
        
      case 'status':
        await migration.checkMigrationStatus();
        break;
        
      case 'rollback':
        if (!arg) {
          console.error('Usage: node migrate-db.js rollback <migration_filename>');
          process.exit(1);
        }
        await migration.rollbackMigration(arg);
        break;
        
      case 'reset':
        await migration.resetDatabase();
        break;
        
      case 'validate':
        await migration.validateSchema();
        break;
        
      case 'init':
        await migration.createInitialMigration();
        break;
        
      default:
        console.log(`
Database Migration Tool

Usage: node migrate-db.js <command> [args]

Commands:
  run                    - Run all pending migrations
  generate <name>        - Generate a new migration file
  status                 - Show migration status
  rollback <filename>    - Rollback a specific migration
  reset                  - Reset the entire database (DANGEROUS!)
  validate               - Validate database schema
  init                   - Create initial migration from setup-manual.sql

Examples:
  node migrate-db.js run
  node migrate-db.js generate add_user_roles
  node migrate-db.js status
  node migrate-db.js rollback 20240115120000_add_user_roles.sql
        `);
        break;
    }
    
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseMigration };