-- Sample Data for PTA2 Schema
-- Run this AFTER the main schema setup

-- Insert sample school
INSERT INTO pta2.schools (id, name, address) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Vel Elementary School', '123 Education St, Manila, Philippines');

-- Insert sample parents
INSERT INTO pta2.parents (id, name, contact_number, email, school_id) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 'Maria Santos', '+63-912-345-6789', 'maria.santos@email.com', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', 'Juan dela Cruz', '+63-917-876-5432', 'juan.delacruz@email.com', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440004', 'Ana Reyes', '+63-905-555-0123', 'ana.reyes@email.com', '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample classes
INSERT INTO pta2.classes (id, name, school_id, grade_level) VALUES 
('550e8400-e29b-41d4-a716-446655440005', 'Grade 1-A', '550e8400-e29b-41d4-a716-446655440001', 'Grade 1'),
('550e8400-e29b-41d4-a716-446655440006', 'Grade 2-B', '550e8400-e29b-41d4-a716-446655440001', 'Grade 2'),
('550e8400-e29b-41d4-a716-446655440007', 'Grade 3-C', '550e8400-e29b-41d4-a716-446655440001', 'Grade 3');

-- Insert sample students
INSERT INTO pta2.students (id, name, class_id, parent_id, student_number) VALUES 
('550e8400-e29b-41d4-a716-446655440008', 'Miguel Santos', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'STU-2024-001'),
('550e8400-e29b-41d4-a716-446655440009', 'Sofia Santos', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'STU-2024-002'),
('550e8400-e29b-41d4-a716-44665544000a', 'Carlos dela Cruz', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'STU-2024-003'),
('550e8400-e29b-41d4-a716-44665544000b', 'Isabella Reyes', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'STU-2024-004');

-- Sample payment (will trigger auto-update for all Maria Santos' children)
INSERT INTO pta2.payments (parent_id, amount, payment_method, notes) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 250, 'cash', 'Payment for school year 2024-2025');