# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production application
- `pnpm start` - Start production server

### Database Operations (Supabase)
- `pnpm db:setup` - Run setup script to create pta2 schema
- `pnpm db:seed` - Seed database with sample PTA data
- `pnpm db:sync-users` - Sync existing auth.users to pta2.user_profiles
- `pnpm db:types` - Generate TypeScript types from Supabase schema (update PROJECT_ID first)

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL) with pta2 schema
- **Authentication**: Supabase Auth with Row Level Security
- **Payments**: Simple payment recording (no processing)
- **UI**: shadcn/ui components with Tailwind CSS
- **State Management**: SWR for client-side data fetching

### Database Schema (pta2)
Core entities with their relationships:
- **schools**: Educational institutions
- **user_profiles**: User roles and school associations
- **classes**: School classes with teacher assignments
- **parents**: Parent/guardian information with payment status
- **students**: Student records linked to parents and classes
- **payments**: Payment records with automatic student status updates
- **expenses**: School expense tracking

### Authentication & Authorization
- Supabase Auth with magic links and email/password
- Row Level Security (RLS) for data access control
- Global middleware protects `/dashboard` routes
- RBAC system with roles: parent, teacher, treasurer, principal, admin

### File Structure
```
app/
├── (login)/          # Authentication pages (sign-in, sign-up)
├── (dashboard)/      # Protected dashboard pages
├── api/             # API routes (payments, students, classes, etc.)
lib/
├── supabase/        # Supabase client, server, CRUD operations
├── auth/            # Legacy auth files (to be removed)
├── db/              # Legacy database files (to be removed)
components/ui/       # Reusable UI components
```

### Key Patterns
- Server Actions for form submissions and mutations
- Route groups for layout organization `(login)`, `(dashboard)`
- Supabase middleware for authentication and session management
- CRUD operations centralized in `lib/supabase/crud.ts`
- Automatic payment status updates via database triggers
- Role-based data access through RLS policies

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_BASE_URL` - Application base URL
- `SUPABASE_PROJECT_ID` - For type generation (optional)

### Development Notes
- Uses `@/` path alias for imports
- Supabase client handles database operations
- RLS policies enforce data security
- SWR provides optimistic updates and caching
- Payment triggers automatically update student status
- All data operations use the `pta2` schema

### PTA-Specific Features
- **Payment Recording**: PHP 250 per family, auto-marks all children as paid
- **Role-Based Access**: Different views for parents, teachers, treasurers, principals
- **Class Management**: Teachers can view their class payment status
- **Reporting**: Real-time payment summaries and analytics
- **Student-Parent Linking**: Multiple students can belong to one parent/guardian