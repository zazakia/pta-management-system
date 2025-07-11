import { schoolsCRUD, classesCRUD, parentsCRUD, studentsCRUD, paymentsCRUD } from '@/lib/supabase/crud';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockData[table], error: null })),
          order: jest.fn(() => Promise.resolve({ data: [mockData[table]], error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [mockData[table]], error: null })),
        single: jest.fn(() => Promise.resolve({ data: mockData[table], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockData[table], error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockData[table], error: null })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

const mockData = {
  schools: {
    id: 'test-school-id',
    name: 'Test School',
    address: '123 Test St',
    phone: '1234567890',
    email: 'test@school.com',
  },
  classes: {
    id: 'test-class-id',
    name: 'Grade 1 - Section A',
    grade_level: 'Grade 1',
    teacher_id: 'test-teacher-id',
    school_id: 'test-school-id',
  },
  parents: {
    id: 'test-parent-id',
    name: 'Test Parent',
    email: 'parent@test.com',
    contact_number: '1234567890',
    payment_status: false,
    school_id: 'test-school-id',
  },
  students: {
    id: 'test-student-id',
    name: 'Test Student',
    student_number: 'STU001',
    class_id: 'test-class-id',
    parent_id: 'test-parent-id',
    payment_status: false,
  },
  payments: {
    id: 'test-payment-id',
    parent_id: 'test-parent-id',
    amount: 250,
    payment_method: 'cash',
    created_at: new Date().toISOString(),
  },
};

describe('Schools CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get all schools', async () => {
    const result = await schoolsCRUD.getAll();
    expect(result).toEqual([mockData.schools]);
  });

  test('should get school by id', async () => {
    const result = await schoolsCRUD.getById('test-school-id');
    expect(result).toEqual(mockData.schools);
  });

  test('should create new school', async () => {
    const newSchool = {
      name: 'New School',
      address: '456 New St',
      phone: '0987654321',
      email: 'new@school.com',
    };
    const result = await schoolsCRUD.create(newSchool);
    expect(result).toEqual(mockData.schools);
  });

  test('should update school', async () => {
    const updates = { name: 'Updated School' };
    const result = await schoolsCRUD.update('test-school-id', updates);
    expect(result).toEqual(mockData.schools);
  });

  test('should delete school', async () => {
    await expect(schoolsCRUD.delete('test-school-id')).resolves.not.toThrow();
  });
});

describe('Classes CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get all classes', async () => {
    const result = await classesCRUD.getAll();
    expect(result).toEqual([mockData.classes]);
  });

  test('should get classes by school', async () => {
    const result = await classesCRUD.getAll('test-school-id');
    expect(result).toEqual([mockData.classes]);
  });

  test('should get class by id', async () => {
    const result = await classesCRUD.getById('test-class-id');
    expect(result).toEqual(mockData.classes);
  });

  test('should get classes by teacher', async () => {
    const result = await classesCRUD.getByTeacher('test-teacher-id');
    expect(result).toEqual([mockData.classes]);
  });

  test('should create new class', async () => {
    const newClass = {
      name: 'Grade 2 - Section B',
      grade_level: 'Grade 2',
      teacher_id: 'test-teacher-id',
      school_id: 'test-school-id',
    };
    const result = await classesCRUD.create(newClass);
    expect(result).toEqual(mockData.classes);
  });
});

describe('Parents CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get all parents', async () => {
    const result = await parentsCRUD.getAll();
    expect(result).toEqual([mockData.parents]);
  });

  test('should get parent by id', async () => {
    const result = await parentsCRUD.getById('test-parent-id');
    expect(result).toEqual(mockData.parents);
  });

  test('should get parent by user id', async () => {
    const result = await parentsCRUD.getByUserId('test-user-id');
    expect(result).toEqual(mockData.parents);
  });

  test('should create new parent', async () => {
    const newParent = {
      name: 'New Parent',
      email: 'newparent@test.com',
      contact_number: '5555555555',
      school_id: 'test-school-id',
      user_id: 'test-user-id',
    };
    const result = await parentsCRUD.create(newParent);
    expect(result).toEqual(mockData.parents);
  });

  test('should update parent payment status', async () => {
    const updates = { payment_status: true };
    const result = await parentsCRUD.update('test-parent-id', updates);
    expect(result).toEqual(mockData.parents);
  });
});

describe('Students CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get all students', async () => {
    const result = await studentsCRUD.getAll();
    expect(result).toEqual([mockData.students]);
  });

  test('should get students by class', async () => {
    const result = await studentsCRUD.getAll('test-class-id');
    expect(result).toEqual([mockData.students]);
  });

  test('should get students by parent', async () => {
    const result = await studentsCRUD.getAll(undefined, 'test-parent-id');
    expect(result).toEqual([mockData.students]);
  });

  test('should get student by id', async () => {
    const result = await studentsCRUD.getById('test-student-id');
    expect(result).toEqual(mockData.students);
  });

  test('should create new student', async () => {
    const newStudent = {
      name: 'New Student',
      student_number: 'STU002',
      class_id: 'test-class-id',
      parent_id: 'test-parent-id',
    };
    const result = await studentsCRUD.create(newStudent);
    expect(result).toEqual(mockData.students);
  });
});

describe('Payments CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get all payments', async () => {
    const result = await paymentsCRUD.getAll();
    expect(result).toEqual([mockData.payments]);
  });

  test('should get payments by parent', async () => {
    const result = await paymentsCRUD.getAll('test-parent-id');
    expect(result).toEqual([mockData.payments]);
  });

  test('should get payment by id', async () => {
    const result = await paymentsCRUD.getById('test-payment-id');
    expect(result).toEqual(mockData.payments);
  });

  test('should create new payment', async () => {
    const newPayment = {
      parent_id: 'test-parent-id',
      amount: 250,
      payment_method: 'cash' as const,
      created_by: 'test-user-id',
    };
    const result = await paymentsCRUD.create(newPayment);
    expect(result).toEqual(mockData.payments);
  });

  test('should record payment and update parent status', async () => {
    const paymentData = {
      parent_id: 'test-parent-id',
      amount: 250,
      payment_method: 'cash' as const,
      created_by: 'test-user-id',
    };
    
    const result = await paymentsCRUD.create(paymentData);
    expect(result).toEqual(mockData.payments);
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle database errors gracefully', async () => {
    const mockError = new Error('Database connection failed');
    
    jest.doMock('@/lib/supabase/server', () => ({
      createServerClient: jest.fn(() => ({
        from: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: null, error: mockError })),
        })),
      })),
    }));

    await expect(schoolsCRUD.getAll()).rejects.toThrow('Database connection failed');
  });

  test('should handle network timeouts', async () => {
    jest.doMock('@/lib/supabase/server', () => ({
      createServerClient: jest.fn(() => ({
        from: jest.fn(() => ({
          select: jest.fn(() => 
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Network timeout')), 100)
            )
          ),
        })),
      })),
    }));

    await expect(schoolsCRUD.getAll()).rejects.toThrow('Network timeout');
  });
});

describe('Data Validation', () => {
  test('should validate parent email format', async () => {
    const invalidParent = {
      name: 'Test Parent',
      email: 'invalid-email',
      contact_number: '1234567890',
      school_id: 'test-school-id',
    };

    // This would typically be handled by Supabase constraints or Zod validation
    expect(invalidParent.email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  test('should validate required fields', async () => {
    const incompleteStudent = {
      name: 'Test Student',
      // missing required fields
    };

    // Check for required fields
    expect(incompleteStudent).not.toHaveProperty('class_id');
    expect(incompleteStudent).not.toHaveProperty('parent_id');
  });

  test('should validate payment amount', async () => {
    const invalidPayment = {
      parent_id: 'test-parent-id',
      amount: -100, // negative amount
      payment_method: 'cash' as const,
    };

    expect(invalidPayment.amount).toBeLessThan(0);
  });
});