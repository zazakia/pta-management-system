#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const setupSchema = `
-- Create pta2 schema
CREATE SCHEMA IF NOT EXISTS pta2;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum
DO $$ BEGIN
  CREATE TYPE pta2.user_role AS ENUM (
    'parent',
    'teacher', 
    'treasurer',
    'principal',
    'admin'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Schools table
CREATE TABLE IF NOT EXISTS pta2.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS pta2.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  school_id UUID REFERENCES pta2.schools(id) ON DELETE CASCADE,
  grade_level TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS pta2.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role pta2.user_role NOT NULL,
  school_id UUID REFERENCES pta2.schools(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Parents table
CREATE TABLE IF NOT EXISTS pta2.parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  contact_number TEXT,
  email TEXT UNIQUE,
  payment_status BOOLEAN DEFAULT FALSE,
  payment_date TIMESTAMP,
  school_id UUID REFERENCES pta2.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS pta2.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  class_id UUID REFERENCES pta2.classes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pta2.parents(id) ON DELETE CASCADE,
  payment_status BOOLEAN DEFAULT FALSE,
  student_number TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS pta2.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES pta2.parents(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 250,
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS pta2.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id UUID REFERENCES pta2.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

const setupTriggers = `
-- Function to auto-update student payment status
CREATE OR REPLACE FUNCTION pta2.mark_students_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all students under this parent as paid
  UPDATE pta2.students
  SET payment_status = TRUE
  WHERE parent_id = NEW.parent_id;

  -- Update parent payment status
  UPDATE pta2.parents
  SET payment_status = TRUE,
      payment_date = NOW()
  WHERE id = NEW.parent_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_mark_students_paid ON pta2.payments;
CREATE TRIGGER trg_mark_students_paid
AFTER INSERT ON pta2.payments
FOR EACH ROW
EXECUTE FUNCTION pta2.mark_students_paid();
`;

const setupRLS = `
-- Enable Row Level Security
ALTER TABLE pta2.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta2.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta2.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta2.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta2.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta2.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta2.expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON pta2.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON pta2.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON pta2.user_profiles;
DROP POLICY IF EXISTS "Parents can view own data" ON pta2.parents;
DROP POLICY IF EXISTS "Parents can view own students" ON pta2.students;
DROP POLICY IF EXISTS "Teachers can view class students" ON pta2.students;
DROP POLICY IF EXISTS "Teachers can view own classes" ON pta2.classes;
DROP POLICY IF EXISTS "School staff can view school data" ON pta2.parents;
DROP POLICY IF EXISTS "School staff can view school students" ON pta2.students;
DROP POLICY IF EXISTS "Treasurers can record payments" ON pta2.payments;
DROP POLICY IF EXISTS "Users can view payments" ON pta2.payments;
DROP POLICY IF EXISTS "Admins can view all" ON pta2.schools;
DROP POLICY IF EXISTS "Admins can view all classes" ON pta2.classes;
DROP POLICY IF EXISTS "Staff can view school data" ON pta2.parents;
DROP POLICY IF EXISTS "Staff can modify school data" ON pta2.parents;
DROP POLICY IF EXISTS "Staff can view school students" ON pta2.students;
DROP POLICY IF EXISTS "Staff can modify school students" ON pta2.students;

-- RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON pta2.user_profiles
FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON pta2.user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON pta2.user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- School access for all data
CREATE POLICY "Admins can view all" ON pta2.schools
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM pta2.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'principal', 'treasurer')
  )
);

CREATE POLICY "Admins can view all classes" ON pta2.classes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM pta2.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'principal', 'treasurer')
  )
);

-- Parents can view their own data
CREATE POLICY "Parents can view own data" ON pta2.parents
FOR SELECT USING (user_id = auth.uid());

-- Staff can view and modify school data
CREATE POLICY "Staff can view school data" ON pta2.parents
FOR SELECT USING (
  school_id IN (
    SELECT school_id FROM pta2.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'principal', 'treasurer')
  )
);

CREATE POLICY "Staff can modify school data" ON pta2.parents
FOR ALL USING (
  school_id IN (
    SELECT school_id FROM pta2.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'principal', 'treasurer')
  )
);

-- Students policies
CREATE POLICY "Parents can view own students" ON pta2.students
FOR SELECT USING (
  parent_id IN (
    SELECT id FROM pta2.parents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view class students" ON pta2.students
FOR SELECT USING (
  class_id IN (
    SELECT id FROM pta2.classes WHERE teacher_id = auth.uid()
  )
);

CREATE POLICY "Staff can view school students" ON pta2.students
FOR SELECT USING (
  parent_id IN (
    SELECT p.id FROM pta2.parents p
    JOIN pta2.user_profiles up ON up.school_id = p.school_id
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'principal', 'treasurer')
  )
);

CREATE POLICY "Staff can modify school students" ON pta2.students
FOR ALL USING (
  parent_id IN (
    SELECT p.id FROM pta2.parents p
    JOIN pta2.user_profiles up ON up.school_id = p.school_id
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'principal', 'treasurer')
  )
);

-- Teachers can view their own classes
CREATE POLICY "Teachers can view own classes" ON pta2.classes
FOR SELECT USING (teacher_id = auth.uid());

-- Treasurers can insert payments
CREATE POLICY "Treasurers can record payments" ON pta2.payments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM pta2.user_profiles 
    WHERE id = auth.uid() AND role IN ('treasurer', 'admin')
  )
);

-- All authenticated users can view payments for transparency
CREATE POLICY "Users can view payments" ON pta2.payments
FOR SELECT USING (auth.uid() IS NOT NULL);
`;

const setupIndexes = `
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parents_school_id ON pta2.parents(school_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON pta2.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON pta2.students(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON pta2.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON pta2.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payments_parent_id ON pta2.payments(parent_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON pta2.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_school_id ON pta2.expenses(school_id);
`;

async function runSQL(sql: string, description: string) {
  console.log(`\n🔄 ${description}...`);
  
  const { error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error(`❌ Error in ${description}:`, error);
    return false;
  } else {
    console.log(`✅ ${description} completed successfully`);
    return true;
  }
}

async function runDirectSQL(sql: string, description: string) {
  console.log(`\n🔄 ${description}...`);
  
  try {
    // Use the raw SQL query method
    let result: any;
    try {
      result = await supabase.rpc('exec_sql', { 
        sql: sql 
      });
    } catch (err) {
      // Fallback: try using the SQL editor approach
      console.log('Fallback to REST API...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey || '',
          'Authorization': `Bearer ${supabaseServiceKey || ''}`
        },
        body: JSON.stringify({ sql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      result = await response.json();
    }
    
    const { error } = result;
    
    if (error) {
      console.error(`❌ Error in ${description}:`, error);
      return false;
    }
    
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${description}:`, error);
    console.log(`\n📋 Manual Setup Required:`);
    console.log(`Please run this SQL manually in your Supabase SQL editor:`);
    console.log(`\n${sql}\n`);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up PTA Management Database Schema...\n');
  
  // Test connection
  console.log('🔄 Testing Supabase connection...');
  const { data, error } = await supabase.from('information_schema.schemata').select('schema_name').limit(1);
  
  if (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Successfully connected to Supabase');
  
  // Run setup steps
  const steps = [
    { sql: setupSchema, description: 'Creating schema and tables' },
    { sql: setupTriggers, description: 'Setting up triggers and functions' },
    { sql: setupRLS, description: 'Configuring Row Level Security' },
    { sql: setupIndexes, description: 'Creating database indexes' }
  ];
  
  for (const step of steps) {
    const success = await runDirectSQL(step.sql, step.description);
    if (!success) {
      console.error(`\n❌ Setup failed at: ${step.description}`);
      process.exit(1);
    }
  }
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Run: pnpm db:seed (to add sample data)');
  console.log('2. Run: pnpm dev (to start the development server)');
  console.log('3. Visit: http://localhost:3001 (to test the application)');
}

// Only run if called directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

export { setupDatabase };