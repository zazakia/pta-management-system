import { createServerClient } from './server'
import { Database } from './types'

type Tables = Database['pta2']['Tables']
type School = Tables['schools']['Row']
type Class = Tables['classes']['Row']
type Parent = Tables['parents']['Row']
type Student = Tables['students']['Row']
type Payment = Tables['payments']['Row']
type Expense = Tables['expenses']['Row']
type UserProfile = Tables['user_profiles']['Row']

// Schools CRUD
export const schoolsCRUD = {
  async getAll() {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(school: Tables['schools']['Insert']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('schools')
      .insert(school as any)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['schools']['Update']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('schools')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Classes CRUD
export const classesCRUD = {
  async getAll(schoolId?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('classes')
      .select(`
        *,
        school:schools(name),
        teacher:user_profiles(full_name)
      `)
      .order('name')
    
    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        school:schools(name),
        teacher:user_profiles(full_name),
        students:students(id, name, payment_status)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  },

  async getByTeacher(teacherId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        school:schools(name),
        students:students(id, name, payment_status, parent:parents(name))
      `)
      .eq('teacher_id', teacherId)
      .order('name')
    
    if (error) throw error
    return data as any
  },

  async create(classData: Tables['classes']['Insert']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['classes']['Update']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  },

  async delete(id: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Parents CRUD
export const parentsCRUD = {
  async getAll(schoolId?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('parents')
      .select(`
        *,
        students:students(id, name, class:classes(name)),
        school:schools(name)
      `)
      .order('name')
    
    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('parents')
      .select(`
        *,
        students:students(id, name, class:classes(name, grade_level)),
        school:schools(name),
        payments:payments(id, amount, created_at, payment_method)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByUserId(userId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('parents')
      .select(`
        *,
        students:students(id, name, class:classes(name, grade_level)),
        school:schools(name)
      `)
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async create(parent: Tables['parents']['Insert']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('parents')
      .insert(parent)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['parents']['Update']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('parents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('parents')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Students CRUD
export const studentsCRUD = {
  async getAll(classId?: string, parentId?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('students')
      .select(`
        *,
        class:classes(name, grade_level),
        parent:parents(name, contact_number, payment_status)
      `)
      .order('name')
    
    if (classId) {
      query = query.eq('class_id', classId)
    }
    
    if (parentId) {
      query = query.eq('parent_id', parentId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        class:classes(name, grade_level, teacher:user_profiles(full_name)),
        parent:parents(name, contact_number, email, payment_status, payment_date)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByClass(classId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        parent:parents(name, contact_number, payment_status)
      `)
      .eq('class_id', classId)
      .order('name')
    
    if (error) throw error
    return data
  },

  async create(student: Tables['students']['Insert']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['students']['Update']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Payments CRUD
export const paymentsCRUD = {
  async getAll(parentId?: string, schoolId?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('payments')
      .select(`
        *,
        parent:parents(name, school:schools(name)),
        created_by_user:user_profiles(full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (parentId) {
      query = query.eq('parent_id', parentId)
    }
    
    if (schoolId) {
      query = query.eq('parent.school_id', schoolId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        parent:parents(name, contact_number, students:students(name)),
        created_by_user:user_profiles(full_name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(payment: Tables['payments']['Insert']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['payments']['Update']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Expenses CRUD
export const expensesCRUD = {
  async getAll(schoolId?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('expenses')
      .select(`
        *,
        school:schools(name),
        created_by_user:user_profiles(full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        school:schools(name),
        created_by_user:user_profiles(full_name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(expense: Tables['expenses']['Insert']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['expenses']['Update']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// User Profiles CRUD
export const userProfilesCRUD = {
  async getAll(schoolId?: string, role?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        school:schools(name)
      `)
      .order('full_name')
    
    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }
    
    if (role) {
      query = query.eq('role', role)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        school:schools(name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(profile: Tables['user_profiles']['Insert']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['user_profiles']['Update']) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Advanced CRUD operations
export const advancedCRUD = {
  // Bulk operations
  async bulkCreateStudents(students: Tables['students']['Insert'][]) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('students')
      .insert(students)
      .select()
    
    if (error) throw error
    return data
  },

  async bulkUpdatePaymentStatus(parentIds: string[], status: boolean) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('parents')
      .update({ 
        payment_status: status,
        payment_date: status ? new Date().toISOString() : null
      } as any)
      .in('id', parentIds)
      .select()
    
    if (error) throw error
    return data
  },

  // Search operations
  async searchParents(query: string, schoolId?: string) {
    const supabase = await createServerClient()
    let queryBuilder = supabase
      .from('parents')
      .select(`
        *,
        students:students(id, name, class:classes(name)),
        school:schools(name)
      `)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,contact_number.ilike.%${query}%`)
      .order('name')
    
    if (schoolId) {
      queryBuilder = queryBuilder.eq('school_id', schoolId)
    }
    
    const { data, error } = await queryBuilder
    if (error) throw error
    return data
  },

  async searchStudents(query: string, schoolId?: string) {
    const supabase = await createServerClient()
    let queryBuilder = supabase
      .from('students')
      .select(`
        *,
        class:classes(name, grade_level, school_id),
        parent:parents(name, contact_number, payment_status)
      `)
      .or(`name.ilike.%${query}%,student_number.ilike.%${query}%`)
      .order('name')
    
    if (schoolId) {
      queryBuilder = queryBuilder.eq('class.school_id', schoolId)
    }
    
    const { data, error } = await queryBuilder
    if (error) throw error
    return data
  },

  // Advanced filters
  async getUnpaidParents(schoolId?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('parents')
      .select(`
        *,
        students:students(id, name, class:classes(name)),
        school:schools(name)
      `)
      .eq('payment_status', false)
      .order('name')
    
    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getStudentsWithoutParents() {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        class:classes(name, grade_level),
        parent:parents(name, contact_number)
      `)
      .is('parent_id', null)
      .order('name')
    
    if (error) throw error
    return data
  },

  async getClassesWithoutTeachers(schoolId?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('classes')
      .select(`
        *,
        school:schools(name),
        students:students(id, name)
      `)
      .is('teacher_id', null)
      .order('name')
    
    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  }
}

// Reporting functions
export const reportingCRUD = {
  async getSchoolSummary(schoolId: string) {
    const supabase = await createServerClient()
    
    try {
      // Get basic counts
      const [parentsResult, studentsResult, paymentsResult, classesResult] = await Promise.all([
        supabase.from('parents').select('id, payment_status').eq('school_id', schoolId),
        supabase.from('students').select('id, payment_status').eq('parent.school_id', schoolId),
        supabase.from('payments').select('id, amount, created_at').eq('parent.school_id', schoolId),
        supabase.from('classes').select('id, name').eq('school_id', schoolId)
      ])
      
      const parents = parentsResult.data || []
      const students = studentsResult.data || []
      const payments = paymentsResult.data || []
      const classes = classesResult.data || []
      
      const paidParents = parents.filter((p: any) => p.payment_status)
      const totalAmount = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      
      return {
        totalParents: parents.length,
        paidParents: paidParents.length,
        paymentRate: parents.length > 0 ? (paidParents.length / parents.length) * 100 : 0,
        totalStudents: students.length,
        totalClasses: classes.length,
        totalPayments: payments.length,
        totalAmount,
        averagePayment: payments.length > 0 ? totalAmount / payments.length : 0
      }
    } catch (error) {
      // Fallback for when database is not available
      return {
        totalParents: 0,
        paidParents: 0,
        paymentRate: 0,
        totalStudents: 0,
        totalClasses: 0,
        totalPayments: 0,
        totalAmount: 0,
        averagePayment: 0
      }
    }
  },

  async getTeacherReport(teacherId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        grade_level,
        students:students(
          id,
          name,
          payment_status,
          parent:parents(name, contact_number, payment_status)
        )
      `)
      .eq('teacher_id', teacherId)
    
    if (error) throw error
    return data || []
  },

  async getPaymentAnalytics(schoolId?: string, startDate?: string, endDate?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('payments')
      .select(`
        id,
        amount,
        created_at,
        payment_method,
        parent:parents(name, school_id)
      `)
      .order('created_at', { ascending: false })
    
    if (schoolId) {
      query = query.eq('parent.school_id', schoolId)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  }
}