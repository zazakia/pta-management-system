import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: undefined,
    error: undefined,
    isLoading: false,
    mutate: jest.fn(),
  })),
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Global test helpers
global.testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {},
};

global.mockProfile = {
  id: 'test-profile-id',
  user_id: 'test-user-id',
  full_name: 'Test User',
  role: 'admin',
  school_id: 'test-school-id',
};

global.mockParent = {
  id: 'test-parent-id',
  name: 'Test Parent',
  email: 'parent@test.com',
  contact_number: '1234567890',
  payment_status: true,
  school_id: 'test-school-id',
};

global.mockStudent = {
  id: 'test-student-id',
  name: 'Test Student',
  student_number: 'STU001',
  class_id: 'test-class-id',
  parent_id: 'test-parent-id',
  payment_status: true,
};

global.mockClass = {
  id: 'test-class-id',
  name: 'Grade 1 - Section A',
  grade_level: 'Grade 1',
  teacher_id: 'test-teacher-id',
  school_id: 'test-school-id',
};

global.mockPayment = {
  id: 'test-payment-id',
  parent_id: 'test-parent-id',
  amount: 250,
  payment_method: 'cash',
  created_at: new Date().toISOString(),
};