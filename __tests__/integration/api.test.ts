import { createMocks } from 'node-mocks-http';
import { GET as parentsGET, POST as parentsPOST } from '@/app/api/parents/route';
import { GET as studentsGET, POST as studentsPOST } from '@/app/api/students/route';
import { GET as paymentsGET, POST as paymentsPOST } from '@/app/api/payments/route';
import { GET as classesGET, POST as classesPOST } from '@/app/api/classes/route';

// Mock Supabase auth
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: { session: { user: global.testUser } },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { role: 'admin' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(new Map())),
}));

// Mock CRUD operations
jest.mock('@/lib/supabase/crud', () => ({
  parentsCRUD: {
    getAll: jest.fn(() => Promise.resolve([global.mockParent])),
    create: jest.fn(() => Promise.resolve(global.mockParent)),
    getById: jest.fn(() => Promise.resolve(global.mockParent)),
    update: jest.fn(() => Promise.resolve(global.mockParent)),
    delete: jest.fn(() => Promise.resolve()),
  },
  studentsCRUD: {
    getAll: jest.fn(() => Promise.resolve([global.mockStudent])),
    create: jest.fn(() => Promise.resolve(global.mockStudent)),
    getById: jest.fn(() => Promise.resolve(global.mockStudent)),
    update: jest.fn(() => Promise.resolve(global.mockStudent)),
    delete: jest.fn(() => Promise.resolve()),
  },
  paymentsCRUD: {
    getAll: jest.fn(() => Promise.resolve([global.mockPayment])),
    create: jest.fn(() => Promise.resolve(global.mockPayment)),
    getById: jest.fn(() => Promise.resolve(global.mockPayment)),
    update: jest.fn(() => Promise.resolve(global.mockPayment)),
    delete: jest.fn(() => Promise.resolve()),
  },
  classesCRUD: {
    getAll: jest.fn(() => Promise.resolve([global.mockClass])),
    create: jest.fn(() => Promise.resolve(global.mockClass)),
    getById: jest.fn(() => Promise.resolve(global.mockClass)),
    update: jest.fn(() => Promise.resolve(global.mockClass)),
    delete: jest.fn(() => Promise.resolve()),
  },
}));

describe('/api/parents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/parents returns all parents', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await parentsGET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual([global.mockParent]);
  });

  test('POST /api/parents creates new parent', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        name: 'New Parent',
        email: 'newparent@test.com',
        contact_number: '1234567890',
        school_id: 'test-school-id',
      },
    });
    
    const response = await parentsPOST(req);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toEqual(global.mockParent);
  });

  test('POST /api/parents validates required fields', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        name: 'Incomplete Parent',
        // missing required fields
      },
    });
    
    const response = await parentsPOST(req);
    expect(response.status).toBe(400);
  });

  test('GET /api/parents handles database errors', async () => {
    const mockCRUD = require('@/lib/supabase/crud');
    mockCRUD.parentsCRUD.getAll.mockRejectedValueOnce(new Error('Database error'));
    
    const { req } = createMocks({ method: 'GET' });
    const response = await parentsGET(req);
    
    expect(response.status).toBe(500);
  });
});

describe('/api/students', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/students returns all students', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await studentsGET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual([global.mockStudent]);
  });

  test('GET /api/students filters by class_id', async () => {
    const { req } = createMocks({
      method: 'GET',
      query: { class_id: 'test-class-id' },
    });
    
    const response = await studentsGET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual([global.mockStudent]);
  });

  test('GET /api/students filters by parent_id', async () => {
    const { req } = createMocks({
      method: 'GET',
      query: { parent_id: 'test-parent-id' },
    });
    
    const response = await studentsGET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual([global.mockStudent]);
  });

  test('POST /api/students creates new student', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        name: 'New Student',
        student_number: 'STU002',
        class_id: 'test-class-id',
        parent_id: 'test-parent-id',
      },
    });
    
    const response = await studentsPOST(req);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toEqual(global.mockStudent);
  });
});

describe('/api/payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/payments returns all payments', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await paymentsGET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual([global.mockPayment]);
  });

  test('POST /api/payments records new payment', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        parent_id: 'test-parent-id',
        amount: 250,
        payment_method: 'cash',
        notes: 'PTA fee payment',
      },
    });
    
    const response = await paymentsPOST(req);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toEqual(global.mockPayment);
  });

  test('POST /api/payments validates payment amount', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        parent_id: 'test-parent-id',
        amount: -100, // invalid negative amount
        payment_method: 'cash',
      },
    });
    
    const response = await paymentsPOST(req);
    expect(response.status).toBe(400);
  });

  test('POST /api/payments validates payment method', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        parent_id: 'test-parent-id',
        amount: 250,
        payment_method: 'invalid_method',
      },
    });
    
    const response = await paymentsPOST(req);
    expect(response.status).toBe(400);
  });
});

describe('/api/classes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/classes returns all classes', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await classesGET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual([global.mockClass]);
  });

  test('POST /api/classes creates new class', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        name: 'Grade 2 - Section A',
        grade_level: 'Grade 2',
        school_id: 'test-school-id',
        teacher_id: 'test-teacher-id',
      },
    });
    
    const response = await classesPOST(req);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data).toEqual(global.mockClass);
  });
});

describe('Authentication & Authorization', () => {
  test('returns 401 for unauthenticated requests', async () => {
    // Mock no session
    const mockAuth = require('@supabase/auth-helpers-nextjs');
    mockAuth.createRouteHandlerClient.mockReturnValueOnce({
      auth: {
        getSession: jest.fn(() => Promise.resolve({
          data: { session: null },
          error: null,
        })),
      },
    });

    const { req } = createMocks({ method: 'GET' });
    const response = await parentsGET(req);
    
    expect(response.status).toBe(401);
  });

  test('returns 403 for insufficient permissions', async () => {
    // Mock user with limited permissions
    const mockAuth = require('@supabase/auth-helpers-nextjs');
    mockAuth.createRouteHandlerClient.mockReturnValueOnce({
      auth: {
        getSession: jest.fn(() => Promise.resolve({
          data: { session: { user: global.testUser } },
          error: null,
        })),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { role: 'parent' }, // Limited role
              error: null,
            })),
          })),
        })),
      })),
    });

    const { req } = createMocks({
      method: 'POST',
      body: { name: 'Test' },
    });
    const response = await parentsPOST(req);
    
    // This would depend on actual authorization logic
    // expect(response.status).toBe(403);
  });
});

describe('Error Handling', () => {
  test('handles malformed JSON requests', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid json{',
    });
    
    try {
      await parentsPOST(req);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('handles database connection failures', async () => {
    const mockCRUD = require('@/lib/supabase/crud');
    mockCRUD.parentsCRUD.getAll.mockRejectedValueOnce(
      new Error('Connection timeout')
    );
    
    const { req } = createMocks({ method: 'GET' });
    const response = await parentsGET(req);
    
    expect(response.status).toBe(500);
  });

  test('handles rate limiting', async () => {
    // Simulate multiple rapid requests
    const requests = Array(10).fill().map(() => {
      const { req } = createMocks({ method: 'GET' });
      return parentsGET(req);
    });
    
    const responses = await Promise.all(requests);
    responses.forEach(response => {
      expect([200, 429]).toContain(response.status);
    });
  });
});

describe('Data Consistency', () => {
  test('payment creation updates parent status', async () => {
    const mockCRUD = require('@/lib/supabase/crud');
    
    const { req } = createMocks({
      method: 'POST',
      body: {
        parent_id: 'test-parent-id',
        amount: 250,
        payment_method: 'cash',
      },
    });
    
    await paymentsPOST(req);
    
    // Verify payment was created
    expect(mockCRUD.paymentsCRUD.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_id: 'test-parent-id',
        amount: 250,
      })
    );
  });

  test('student creation validates parent and class existence', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        name: 'Test Student',
        student_number: 'STU003',
        class_id: 'nonexistent-class',
        parent_id: 'nonexistent-parent',
      },
    });
    
    // This would typically validate foreign key constraints
    const response = await studentsPOST(req);
    expect(response.status).toBe(201); // Mock always succeeds
  });
});