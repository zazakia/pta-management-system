# Vel PTA Management Web App – PRD & Developer Specification

**Prepared by:** Bautista  
**Date:** 2025-07-09

---

## 📌 1. Overview

### **Problem Statement**

Manual tracking of PTA payments is inefficient:

- Hard to know who has paid.
- Lacks transparency and auditing clarity.
- No real-time reporting for principals, teachers, PTA officers.

---

### **Objective**

✅ Real-time, **offline-first**, and **secure-first** PTA payment tracking using **Next.js + React + Supabase**.

---

## 👥 2. Users

- **Parents / Guardians:** Pay PTA contributions.  
- **Teachers:** Monitor class payment statuses.  
- **Treasurer / Assistant:** Record and receive payments.  
- **Principal / PTA Officers:** View reports and KPI dashboards.

---

## 💡 3. Key Features

### **3.1 Income Workflow**

1. **Parents Pay:**  
   - **PHP 250 one-time payment per family/parent/guardian.**
   - Multiple students under the same parent are marked as paid upon single payment.

2. **Receive Payment:**  
   - Treasurer/assistant receives and records payment.
   - Issues receipt (physical or digital).

3. **Record Collection:**  
   - Payment is linked to parent/guardian.  
   - System updates **all student records under that parent as paid**.

4. **Live Reporting:**  
   - KPI dashboards for principal and PTA officers:
     - Total collections
     - Per class paid/unpaid students

5. **Detailed Reports:**  
   - Teachers see payment status per student in class.

---

### **3.2 Expenses Workflow**

- Record expenses by category/account (e.g. guards, snacks).
- Link expenses to income for financial transparency.
- Export expense reports for audit.

---

## 🗃️ 4. Data Relationships

- **Parent/Guardian → Students:** One-to-many.
- **Payment → Parent/Guardian:** One-to-one per school year.

When a parent/guardian payment is recorded:

✅ All students linked to them are marked as paid.

---

## 🔐 5. Technical Requirements

### **Framework & Stack**

- **Frontend:** Next.js + React
- **Backend:** Supabase (PostgreSQL, Auth, Storage) create and use PTA1 schema as main schema not the public schema

### **Offline-First**

- Local IndexedDB caching with Supabase sync for payment collection.

### **Security-First**

- RLS enforced for role-based data access.  
- Secure auth via Supabase Auth.  
- Encrypted storage for receipts.

---

## 📝 6. SQL Schema Updates

```sql
-- Parents table
create table parents (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_number text,
  email text unique,
  payment_status boolean default false,
  payment_date timestamp,
  created_at timestamp default now()
);

-- Students table
create table students (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  class_id uuid references classes(id),
  parent_id uuid references parents(id),
  payment_status boolean default false,
  created_at timestamp default now()
);

-- Payments table
create table payments (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references parents(id),
  amount numeric not null,
  receipt_url text,
  created_by uuid references users(id),
  created_at timestamp default now()
);


#Trigger to Mark All Students as Paid When Parent Pays
create or replace function mark_students_paid()
returns trigger as $$
begin
  update students
  set payment_status = true
  where parent_id = NEW.parent_id;

  update parents
  set payment_status = true,
      payment_date = now()
  where id = NEW.parent_id;

  return NEW;
end;
$$ language plpgsql;

create trigger trg_mark_students_paid
after insert on payments
for each row
execute procedure mark_students_paid();

#Next.js Supabase Code Snippets
#Record Parent Payment and Auto-Mark Students as Paid
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function recordParentPayment(parentId, amount, receiptUrl, userId) {
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      parent_id: parentId,
      amount,
      receipt_url: receiptUrl,
      created_by: userId,
    }]);

  if (error) {
    console.error('Payment record failed:', error);
    throw error;
  }

  return data;
}

#Fetch Students with Updated Payment Status
export async function getStudentsByClass(classId) {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, payment_status, parent_id')
    .eq('class_id', classId);

  if (error) {
    console.error('Fetching students failed:', error);
    throw error;
  }

  return data;
}


#Claude Prompt Templates
#Use these templates to accelerate feature generation in Claude via Cursor:

#Prompt 1 – SQL Migration
You are a senior database engineer. Generate SQL migration scripts to:

- Create parents, students, payments tables.
- Include triggers to auto-update student payment status upon parent payment record.
Ensure schema compatibility with Supabase PostgreSQL.

#Prompt 2 – Next.js Supabase API
You are a senior Next.js Supabase developer. Generate an API handler to:

- Accept POST requests for recording parent payments.
- Call Supabase insert into payments table.
- Return updated student payment statuses for the parent’s students.
Include error handling and modular exports.

