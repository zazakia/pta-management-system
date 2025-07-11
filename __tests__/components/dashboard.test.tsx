import React from 'react';

interface Props {
  toBeInTheDocument?: any;
  [key: string]: any;
}

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/(dashboard)/page';

// Mock SWR with different scenarios
const mockSWR = jest.fn();
jest.mock('swr', () => ({
  __esModule: true,
  default: mockSWR,
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    test('displays loading skeleton when profile is loading', () => {
      mockSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
      });

      render(<HomePage />);
      
      expect(screen.getAllByTestId(/loading-card|animate-pulse/i)).toBeTruthy();
    });
  });

  describe('Profile Not Found', () => {
    test('displays profile setup message when no profile exists', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: undefined,
        isLoading: false,
      });

      render(<HomePage />);
      
      expect(screen.getByText('Profile Not Found')).toBeInTheDocument();
      expect(screen.getByText('Complete Profile')).toBeInTheDocument();
    });
  });

  describe('Parent Dashboard', () => {
    const mockParentProfile = {
      ...global.mockProfile,
      role: 'parent',
    };

    const mockStudents = [
      {
        id: 'student-1',
        name: 'Student One',
        payment_status: true,
        class: { name: 'Grade 1-A' },
      },
      {
        id: 'student-2',
        name: 'Student Two',
        payment_status: false,
        class: { name: 'Grade 2-B' },
      },
    ];

    const mockPayments = [
      {
        id: 'payment-1',
        amount: 250,
        created_at: '2024-01-15T00:00:00Z',
      },
    ];

    test('renders parent dashboard with correct stats', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockParentProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockStudents,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockPayments,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Children')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Total students
        expect(screen.getByText('1/2 paid')).toBeInTheDocument();
      });
    });

    test('displays student list with payment status', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockParentProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockStudents,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockPayments,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Student One')).toBeInTheDocument();
        expect(screen.getByText('Student Two')).toBeInTheDocument();
        expect(screen.getByText('Grade 1-A')).toBeInTheDocument();
        expect(screen.getByText('Grade 2-B')).toBeInTheDocument();
        
        const paidBadges = screen.getAllByText('Paid');
        const unpaidBadges = screen.getAllByText('Unpaid');
        expect(paidBadges).toHaveLength(1);
        expect(unpaidBadges).toHaveLength(1);
      });
    });

    test('handles empty student list', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockParentProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('No students linked to your account.')).toBeInTheDocument();
      });
    });
  });

  describe('Teacher Dashboard', () => {
    const mockTeacherProfile = {
      ...global.mockProfile,
      role: 'teacher',
    };

    const mockClasses = [
      {
        id: 'class-1',
        name: 'Grade 1-A',
        grade_level: 'Grade 1',
        students: [
          { id: 'student-1', payment_status: true },
          { id: 'student-2', payment_status: false },
        ],
      },
      {
        id: 'class-2',
        name: 'Grade 2-B',
        grade_level: 'Grade 2',
        students: [
          { id: 'student-3', payment_status: true },
          { id: 'student-4', payment_status: true },
        ],
      },
    ];

    test('renders teacher dashboard with class statistics', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockTeacherProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockClasses,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Classes')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Total classes
        expect(screen.getByText('4')).toBeInTheDocument(); // Total students
        expect(screen.getByText('75%')).toBeInTheDocument(); // Payment rate
      });
    });

    test('displays class list with payment summary', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockTeacherProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockClasses,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Grade 1-A')).toBeInTheDocument();
        expect(screen.getByText('Grade 2-B')).toBeInTheDocument();
        expect(screen.getByText('1/2 paid')).toBeInTheDocument();
        expect(screen.getByText('2/2 paid')).toBeInTheDocument();
      });
    });
  });

  describe('Treasurer Dashboard', () => {
    const mockTreasurerProfile = {
      ...global.mockProfile,
      role: 'treasurer',
    };

    const mockPayments = [
      {
        id: 'payment-1',
        amount: 250,
        created_at: '2024-01-15T00:00:00Z',
        parent: { name: 'Parent One' },
      },
      {
        id: 'payment-2',
        amount: 250,
        created_at: '2024-01-10T00:00:00Z',
        parent: { name: 'Parent Two' },
      },
    ];

    const mockParents = [
      { id: 'parent-1', payment_status: true },
      { id: 'parent-2', payment_status: true },
      { id: 'parent-3', payment_status: false },
    ];

    test('renders treasurer dashboard with financial stats', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockTreasurerProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockPayments,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockParents,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Collections')).toBeInTheDocument();
        expect(screen.getByText('PHP 500')).toBeInTheDocument(); // Total amount
        expect(screen.getByText('67%')).toBeInTheDocument(); // Payment rate
        expect(screen.getByText('1')).toBeInTheDocument(); // Pending parents
      });
    });

    test('displays quick action buttons', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockTreasurerProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockPayments,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockParents,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Record Payment')).toBeInTheDocument();
        expect(screen.getByText('Manage Parents')).toBeInTheDocument();
        expect(screen.getByText('View Reports')).toBeInTheDocument();
      });
    });

    test('displays recent payments list', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockTreasurerProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockPayments,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockParents,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Payments')).toBeInTheDocument();
        expect(screen.getByText('Parent One')).toBeInTheDocument();
        expect(screen.getByText('Parent Two')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Dashboard', () => {
    const mockAdminProfile = {
      ...global.mockProfile,
      role: 'admin',
    };

    const mockData = {
      parents: [
        { id: 'parent-1', payment_status: true },
        { id: 'parent-2', payment_status: false },
      ],
      students: [
        { id: 'student-1' },
        { id: 'student-2' },
        { id: 'student-3' },
      ],
      payments: [
        { id: 'payment-1', amount: 250 },
        { id: 'payment-2', amount: 250 },
      ],
      classes: [
        { id: 'class-1' },
        { id: 'class-2' },
      ],
    };

    test('renders admin dashboard with comprehensive stats', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockAdminProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.parents,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.students,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.payments,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.classes,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Parents')).toBeInTheDocument();
        expect(screen.getByText('Total Students')).toBeInTheDocument();
        expect(screen.getByText('Total Collections')).toBeInTheDocument();
        expect(screen.getByText('Payment Rate')).toBeInTheDocument();
        
        expect(screen.getByText('2')).toBeInTheDocument(); // Total parents
        expect(screen.getByText('3')).toBeInTheDocument(); // Total students
        expect(screen.getByText('PHP 500')).toBeInTheDocument(); // Total collections
        expect(screen.getByText('50%')).toBeInTheDocument(); // Payment rate
      });
    });

    test('displays admin quick actions', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockAdminProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.parents,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.students,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.payments,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.classes,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByText('Parents')).toBeInTheDocument();
        expect(screen.getByText('Students')).toBeInTheDocument();
        expect(screen.getByText('Classes')).toBeInTheDocument();
      });
    });

    test('displays payment overview with progress bar', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: mockAdminProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.parents,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.students,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.payments,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: mockData.classes,
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Payment Overview')).toBeInTheDocument();
        expect(screen.getByText('Paid Parents:')).toBeInTheDocument();
        expect(screen.getByText('Pending:')).toBeInTheDocument();
        expect(screen.getByText('Collection Rate:')).toBeInTheDocument();
      });
    });
  });

  describe('Unknown Role Handling', () => {
    test('displays unknown role message for unrecognized roles', async () => {
      const unknownRoleProfile = {
        ...global.mockProfile,
        role: 'unknown_role',
      };

      mockSWR.mockReturnValue({
        data: unknownRoleProfile,
        isLoading: false,
      });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Unknown Role')).toBeInTheDocument();
        expect(screen.getByText('Your account role is not recognized. Please contact an administrator.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: global.mockProfile,
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: undefined,
          error: new Error('API Error'),
          isLoading: false,
        });

      render(<HomePage />);
      
      // Component should still render with fallback data
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    test('handles undefined/null data arrays safely', async () => {
      mockSWR
        .mockReturnValueOnce({
          data: { ...global.mockProfile, role: 'treasurer' },
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: null, // null payments
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: undefined, // undefined parents
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Collections')).toBeInTheDocument();
        expect(screen.getByText('PHP 0')).toBeInTheDocument();
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', async () => {
      mockSWR.mockReturnValue({
        data: global.mockProfile,
        isLoading: false,
      });

      render(<HomePage />);
      
      await waitFor(() => {
        const cards = screen.getAllByRole('article');
        expect(cards.length).toBeGreaterThan(0);
        
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toBeVisible();
        });
      });
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      mockSWR
        .mockReturnValueOnce({
          data: { ...global.mockProfile, role: 'treasurer' },
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
        });

      render(<HomePage />);
      
      await waitFor(() => {
        const recordPaymentButton = screen.getByText('Record Payment');
        expect(recordPaymentButton).toBeInTheDocument();
      });

      const recordPaymentButton = screen.getByText('Record Payment');
      await user.tab();
      
      // Check if button can receive focus
      expect(recordPaymentButton.closest('a')).toBeInTheDocument();
    });
  });
});