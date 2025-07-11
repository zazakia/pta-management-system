# PTA Management System Documentation

A comprehensive Parent-Teacher Association (PTA) management system built with Next.js 15, Supabase, and modern web technologies.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)

## 🔍 Overview

The PTA Management System is designed to streamline operations for Parent-Teacher Associations, providing role-based access for parents, teachers, treasurers, principals, and administrators. The system handles payment tracking, student management, class organization, and financial reporting.

### Key Capabilities

- **Payment Management**: Track PHP 250 PTA fees with automatic student status updates
- **Role-Based Access**: Different interfaces for parents, teachers, treasurers, and administrators
- **Student Tracking**: Link students to parents and classes with payment status monitoring
- **Reporting**: Real-time analytics and financial reporting
- **Secure Authentication**: Supabase Auth with Row Level Security (RLS)

## ✨ Features

### For Parents
- View children's payment status
- See class assignments and teacher information
- Track payment history
- Update contact information

### For Teachers
- View assigned classes and student payment status
- Monitor class-specific payment rates
- Access student contact information through parents

### For Treasurers
- Record payments and update parent status
- Generate payment reports and analytics
- Manage parent information
- Track collection rates and pending payments

### For Administrators
- Comprehensive system overview
- Manage all users, classes, and schools
- Advanced reporting and analytics
- System configuration and maintenance

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: SWR for client-side data fetching
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel, GitHub Actions

### Database Schema (pta2)

```sql
-- Core entities with relationships
pta2.schools              -- Educational institutions
pta2.user_profiles        -- User roles and school associations  
pta2.classes             -- School classes with teacher assignments
pta2.parents             -- Parent/guardian information with payment status
pta2.students            -- Student records linked to parents and classes
pta2.payments            -- Payment records with automatic student status updates
pta2.expenses            -- School expense tracking
```

### Key Design Patterns

- **RBAC (Role-Based Access Control)**: Different permissions for each user type
- **RLS (Row Level Security)**: Database-level security policies
- **Server Actions**: Form submissions and mutations
- **Route Groups**: Organized layouts with `(login)` and `(dashboard)`
- **CRUD Operations**: Centralized in `lib/supabase/crud.ts`
- **Automatic Triggers**: Payment status updates via database triggers

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pta-management-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Database setup**
   ```bash
   pnpm db:setup    # Create pta2 schema and tables
   pnpm db:seed     # Add sample data
   pnpm db:sync-users # Sync auth.users to user_profiles
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SUPABASE_PROJECT_ID=your_project_id
```

## 📚 Documentation Structure

- **[API Documentation](./api/)** - REST API endpoints and usage
- **[Testing Guide](./testing/)** - Unit, integration, and performance testing
- **[Deployment Guide](./deployment/)** - Production deployment instructions
- **[Development Guide](./development/)** - Local development and contribution guidelines

## 🔧 Development Commands

```bash
# Development
pnpm dev                 # Start dev server with Turbopack
pnpm build              # Build for production
pnpm start              # Start production server

# Database
pnpm db:setup           # Setup database schema
pnpm db:seed            # Seed with sample data
pnpm db:sync-users      # Sync auth users to profiles
pnpm db:types           # Generate TypeScript types

# Testing
pnpm test               # Run unit tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Generate coverage report
pnpm test:performance   # Run performance tests

# Code Quality
pnpm lint               # Run ESLint
pnpm type-check         # TypeScript type checking
pnpm fix                # Auto-fix common issues

# Documentation
pnpm docs:generate      # Generate API documentation

# Deployment
pnpm deploy:github      # Deploy via GitHub Actions
pnpm deploy:vercel      # Deploy to Vercel
```

## 🛠️ Project Structure

```
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── dashboard/         # Main dashboard pages
│   │   ├── layout.tsx         # Dashboard layout with navigation
│   │   └── page.tsx           # Dashboard home page
│   ├── (login)/              # Authentication pages
│   ├── api/                  # API routes
│   └── globals.css           # Global styles
├── components/               # Reusable UI components
│   ├── ui/                   # shadcn/ui components
│   └── parent-search-select.tsx
├── lib/                     # Utility functions and configurations
│   ├── supabase/            # Supabase client and operations
│   │   ├── client.ts        # Client-side Supabase client
│   │   ├── server.ts        # Server-side Supabase client
│   │   ├── crud.ts          # CRUD operations
│   │   ├── setup-manual.sql # Database schema
│   │   └── types.ts         # TypeScript types
│   └── utils.ts             # Utility functions
├── scripts/                 # Automation scripts
│   ├── auto-fix.js          # Auto-fixing system
│   ├── performance-test.js  # Performance testing
│   └── deploy-github.js     # Deployment automation
├── __tests__/              # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── components/         # Component tests
│   └── performance/        # Performance tests
├── docs/                   # Documentation
└── middleware.ts           # Auth middleware
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Permissions**: Different access levels for each user type
- **Environment Variable Protection**: Sensitive data in environment variables
- **HTTPS Enforcement**: SSL/TLS encryption in production
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries via Supabase

## 📊 Monitoring and Analytics

- **Performance Monitoring**: Automated performance testing
- **Error Tracking**: Comprehensive error handling and logging
- **User Analytics**: Usage tracking and reporting
- **Database Monitoring**: Query performance and optimization
- **Uptime Monitoring**: Service availability tracking

## 🤝 Contributing

Please see our [Development Guide](./development/) for detailed contribution guidelines, including:

- Code style and formatting
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the docs/ directory for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

---

**Last Updated**: January 2025
**Version**: 1.0.0