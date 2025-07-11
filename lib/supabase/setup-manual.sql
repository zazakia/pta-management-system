-- PTA Management System Database Setup
-- Copy and paste this entire SQL script into your Supabase SQL Editor

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parents_school_id ON pta2.parents(school_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON pta2.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON pta2.students(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON pta2.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON pta2.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payments_parent_id ON pta2.payments(parent_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON pta2.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_school_id ON pta2.expenses(school_id);

-- Insert sample school data
INSERT INTO pta2.schools (name, address) 
VALUES ('Demo Elementary School', '123 Education St, City, State')
ON CONFLICT DO NOTHING;

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_school_id UUID;
BEGIN
  -- Get the first available school as default
  SELECT id INTO default_school_id 
  FROM pta2.schools 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- Create a default user profile when a new auth user is created
  INSERT INTO pta2.user_profiles (id, full_name, role, school_id)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1),
      'Unknown User'
    ),
    'parent', -- Default role, user can change later
    default_school_id -- Default to first school
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;