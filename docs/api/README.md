# API Documentation

The PTA Management System provides a comprehensive REST API for managing all aspects of the application. All endpoints require authentication via Supabase Auth.

## 🔐 Authentication

All API requests must include a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

The API uses Row Level Security (RLS) to ensure users can only access data they're authorized to see based on their role and school association.

## 📋 API Endpoints Overview

### Core Resources

| Resource | Description | Base URL |
|----------|-------------|----------|
| **Schools** | Educational institutions | `/api/schools` |
| **Users** | User profiles and roles | `/api/users` |
| **Classes** | School classes | `/api/classes` |
| **Parents** | Parent/guardian information | `/api/parents` |
| **Students** | Student records | `/api/students` |
| **Payments** | Payment transactions | `/api/payments` |
| **Expenses** | School expenses | `/api/expenses` |
| **Reports** | Analytics and reporting | `/api/reports` |

### Utility Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/profile` | Current user profile |
| `/api/test-db` | Database connection test |

## 🏫 Schools API

### GET /api/schools
Get all schools (admin/principal only)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Elementary School A",
    "address": "123 School Street",
    "phone": "+1234567890",
    "email": "admin@schoola.edu",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST /api/schools
Create a new school (admin only)

**Request Body:**
```json
{
  "name": "New School",
  "address": "456 Education Ave",
  "phone": "+1987654321",
  "email": "admin@newschool.edu"
}
```

### GET /api/schools/[id]
Get school by ID

### PUT /api/schools/[id]
Update school (admin/principal only)

### DELETE /api/schools/[id]
Delete school (admin only)

## 👥 Users API

### GET /api/users
Get all users (admin/principal only)

**Query Parameters:**
- `role`: Filter by user role (parent, teacher, treasurer, principal, admin)
- `school_id`: Filter by school association

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "auth_user_uuid",
    "full_name": "John Doe",
    "role": "parent",
    "school_id": "school_uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "school": {
      "name": "Elementary School A"
    }
  }
]
```

### POST /api/users
Create user profile (admin only)

**Request Body:**
```json
{
  "user_id": "auth_user_uuid",
  "full_name": "Jane Smith",
  "role": "teacher",
  "school_id": "school_uuid"
}
```

### GET /api/users/[id]
Get user by ID (own profile or admin/principal)

### PUT /api/users/[id]
Update user profile

### DELETE /api/users/[id]
Delete user (admin only, cannot delete self)

## 🎓 Classes API

### GET /api/classes
Get all classes

**Query Parameters:**
- `school_id`: Filter by school
- `teacher_id`: Filter by teacher

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Grade 1 - Section A",
    "grade_level": "Grade 1",
    "teacher_id": "teacher_uuid",
    "school_id": "school_uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "school": {
      "name": "Elementary School A"
    },
    "teacher": {
      "full_name": "Ms. Teacher"
    },
    "students": [
      {
        "id": "student_uuid",
        "name": "Student Name",
        "payment_status": true
      }
    ]
  }
]
```

### POST /api/classes
Create new class (admin/principal/treasurer only)

**Request Body:**
```json
{
  "name": "Grade 2 - Section B",
  "grade_level": "Grade 2",
  "teacher_id": "teacher_uuid",
  "school_id": "school_uuid"
}
```

### GET /api/classes/[id]
Get class by ID with student details

### PUT /api/classes/[id]
Update class (admin/principal/treasurer only)

### DELETE /api/classes/[id]
Delete class (admin only)

## 👨‍👩‍👧‍👦 Parents API

### GET /api/parents
Get all parents

**Query Parameters:**
- `school_id`: Filter by school
- `search`: Search by name, email, or phone

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Parent Name",
    "email": "parent@email.com",
    "contact_number": "+1234567890",
    "payment_status": true,
    "payment_date": "2024-01-15T00:00:00Z",
    "school_id": "school_uuid",
    "user_id": "auth_user_uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "students": [
      {
        "id": "student_uuid",
        "name": "Student Name",
        "class": {
          "name": "Grade 1 - Section A"
        }
      }
    ],
    "school": {
      "name": "Elementary School A"
    }
  }
]
```

### POST /api/parents
Create new parent (admin/principal/treasurer only)

**Request Body:**
```json
{
  "name": "New Parent",
  "email": "newparent@email.com",
  "contact_number": "+1555555555",
  "school_id": "school_uuid",
  "user_id": "auth_user_uuid"
}
```

### GET /api/parents/[id]
Get parent by ID with payment history

### PUT /api/parents/[id]
Update parent information

### DELETE /api/parents/[id]
Delete parent (admin only)

## 🎒 Students API

### GET /api/students
Get all students

**Query Parameters:**
- `class_id`: Filter by class
- `parent_id`: Filter by parent
- `school_id`: Filter by school

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Student Name",
    "student_number": "STU001",
    "class_id": "class_uuid",
    "parent_id": "parent_uuid",
    "payment_status": true,
    "created_at": "2024-01-01T00:00:00Z",
    "class": {
      "name": "Grade 1 - Section A",
      "grade_level": "Grade 1"
    },
    "parent": {
      "name": "Parent Name",
      "contact_number": "+1234567890",
      "payment_status": true
    }
  }
]
```

### POST /api/students
Create new student (admin/principal/treasurer only)

**Request Body:**
```json
{
  "name": "New Student",
  "student_number": "STU002",
  "class_id": "class_uuid",
  "parent_id": "parent_uuid"
}
```

### GET /api/students/[id]
Get student by ID with detailed information

### PUT /api/students/[id]
Update student information

### DELETE /api/students/[id]
Delete student (admin only)

## 💰 Payments API

### GET /api/payments
Get all payments

**Query Parameters:**
- `parent_id`: Filter by parent
- `school_id`: Filter by school
- `start_date`: Filter from date (ISO 8601)
- `end_date`: Filter to date (ISO 8601)

**Response:**
```json
[
  {
    "id": "uuid",
    "parent_id": "parent_uuid",
    "amount": 250,
    "payment_method": "cash",
    "notes": "PTA fee payment",
    "created_by": "user_uuid",
    "created_at": "2024-01-15T00:00:00Z",
    "parent": {
      "name": "Parent Name",
      "school": {
        "name": "Elementary School A"
      }
    },
    "created_by_user": {
      "full_name": "Treasurer Name"
    }
  }
]
```

### POST /api/payments
Record new payment (admin/principal/treasurer only)

**Request Body:**
```json
{
  "parent_id": "parent_uuid",
  "amount": 250,
  "payment_method": "cash",
  "notes": "PTA fee payment"
}
```

**Payment Methods:**
- `cash`
- `check`
- `bank_transfer`
- `gcash`
- `other`

### GET /api/payments/[id]
Get payment by ID with parent and student details

### PUT /api/payments/[id]
Update payment (admin/principal/treasurer only)

### DELETE /api/payments/[id]
Delete payment (admin only)

## 💳 Expenses API

### GET /api/expenses
Get all expenses (admin/principal/treasurer only)

**Query Parameters:**
- `school_id`: Filter by school
- `category`: Filter by expense category
- `start_date`: Filter from date
- `end_date`: Filter to date

### POST /api/expenses
Create new expense (admin/principal/treasurer only)

**Request Body:**
```json
{
  "description": "Office supplies",
  "amount": 150.00,
  "category": "supplies",
  "school_id": "school_uuid",
  "notes": "Purchased paper and pens"
}
```

### GET /api/expenses/[id]
Get expense by ID

### PUT /api/expenses/[id]
Update expense

### DELETE /api/expenses/[id]
Delete expense (admin only)

## 📊 Reports API

### GET /api/reports
Get comprehensive school reports (admin/principal/treasurer only)

**Query Parameters:**
- `school_id`: Filter by school
- `type`: Report type (payment_summary, collection_rate, class_breakdown)

**Response:**
```json
{
  "school_summary": {
    "total_parents": 150,
    "paid_parents": 120,
    "payment_rate": 80,
    "total_students": 180,
    "total_classes": 12,
    "total_payments": 120,
    "total_amount": 30000,
    "average_payment": 250
  },
  "class_breakdown": [
    {
      "class_name": "Grade 1 - Section A",
      "total_students": 15,
      "paid_students": 12,
      "payment_rate": 80
    }
  ],
  "monthly_collections": [
    {
      "month": "2024-01",
      "total_amount": 5000,
      "payment_count": 20
    }
  ]
}
```

## 👤 Profile API

### GET /api/profile
Get current user's profile information

**Response:**
```json
{
  "id": "uuid",
  "user_id": "auth_user_uuid",
  "full_name": "Current User",
  "role": "parent",
  "school_id": "school_uuid",
  "school": {
    "name": "Elementary School A"
  }
}
```

## 🔧 Test Database API

### GET /api/test-db
Test database connection and basic operations

**Response:**
```json
{
  "status": "success",
  "message": "Database connection successful",
  "timestamp": "2024-01-01T00:00:00Z",
  "tests": {
    "connection": true,
    "schema_exists": true,
    "sample_query": true
  }
}
```

## 🚨 Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (database error)

### Error Codes

- `VALIDATION_ERROR` - Request data validation failed
- `UNAUTHORIZED` - Authentication token missing or invalid
- `FORBIDDEN` - Insufficient permissions for operation
- `NOT_FOUND` - Requested resource not found
- `DATABASE_ERROR` - Database operation failed
- `DUPLICATE_ENTRY` - Resource already exists

## 🔄 Database Triggers

The system includes automatic database triggers:

### Payment Status Updates
When a payment is recorded:
1. Parent's `payment_status` is set to `true`
2. Parent's `payment_date` is updated
3. All children's `payment_status` is set to `true`

### User Profile Creation
When a new user signs up:
1. A corresponding `user_profiles` record is created
2. Default role is set based on email domain or manual assignment

## 📝 Rate Limiting

API endpoints are protected with rate limiting:
- **Authentication endpoints**: 10 requests per minute
- **Read operations**: 100 requests per minute
- **Write operations**: 30 requests per minute
- **Report generation**: 10 requests per minute

## 🛡️ Security Considerations

- All sensitive operations require appropriate role permissions
- Row Level Security (RLS) enforces data access policies
- Input validation prevents SQL injection and XSS attacks
- Audit logging tracks all data modifications
- Regular security updates and monitoring

---

For more detailed examples and integration guides, see the [Development Documentation](../development/).