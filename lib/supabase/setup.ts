// Database setup script for pta2 schema
// This contains the SQL commands to run in Supabase SQL editor

export const setupSchema = `
-- Create pta2 schema
CREATE SCHEMA IF NOT EXISTS pta2;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum
CREATE TYPE pta2.user_role AS ENUM (
  'parent',
  'teacher', 
  'treasurer',
  'principal',
  'admin'
);

-- Schools table
CREATE TABLE pta2.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Classes table
CREATE TABLE pta2.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  school_id UUID REFERENCES pta2.schools(id) ON DELETE CASCADE,
  grade_level TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User profiles table (extends auth.users)
CREATE TABLE pta2.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role pta2.user_role NOT NULL,
  school_id UUID REFERENCES pta2.schools(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Parents table
CREATE TABLE pta2.parents (
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
CREATE TABLE pta2.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  class_id UUID REFERENCES pta2.classes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pta2.parents(id) ON DELETE CASCADE,
  payment_status BOOLEAN DEFAULT FALSE,
  student_number TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE pta2.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES pta2.parents(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 250,
  category TEXT NOT NULL DEFAULT 'membership',
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE pta2.expenses (
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

-- Trigger to auto-mark students as paid when parent payment is recorded
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

-- RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON pta2.user_profiles
FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON pta2.user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Parents can view their own data
CREATE POLICY "Parents can view own data" ON pta2.parents
FOR SELECT USING (user_id = auth.uid());

-- Parents can view their own students
CREATE POLICY "Parents can view own students" ON pta2.students
FOR SELECT USING (
  parent_id IN (
    SELECT id FROM pta2.parents WHERE user_id = auth.uid()
  )
);

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view class students" ON pta2.students
FOR SELECT USING (
  class_id IN (
    SELECT id FROM pta2.classes WHERE teacher_id = auth.uid()
  )
);

-- Teachers can view their own classes
CREATE POLICY "Teachers can view own classes" ON pta2.classes
FOR SELECT USING (teacher_id = auth.uid());

-- Admins, principals, and treasurers can view all data in their school
CREATE POLICY "School staff can view school data" ON pta2.parents
FOR SELECT USING (
  school_id IN (
    SELECT school_id FROM pta2.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'principal', 'treasurer')
  )
);

CREATE POLICY "School staff can view school students" ON pta2.students
FOR SELECT USING (
  parent_id IN (
    SELECT p.id FROM pta2.parents p
    JOIN pta2.user_profiles up ON up.school_id = p.school_id
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'principal', 'treasurer')
  )
);

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
CREATE INDEX idx_parents_school_id ON pta2.parents(school_id);
CREATE INDEX idx_students_parent_id ON pta2.students(parent_id);
CREATE INDEX idx_students_class_id ON pta2.students(class_id);
CREATE INDEX idx_classes_school_id ON pta2.classes(school_id);
CREATE INDEX idx_classes_teacher_id ON pta2.classes(teacher_id);
CREATE INDEX idx_payments_parent_id ON pta2.payments(parent_id);
CREATE INDEX idx_payments_created_at ON pta2.payments(created_at);
CREATE INDEX idx_expenses_school_id ON pta2.expenses(school_id);
`;

console.log('Copy and paste the above SQL into your Supabase SQL editor to set up the pta2 schema.');