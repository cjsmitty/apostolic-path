import { z } from 'zod';

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().default('USA'),
});

// Church schemas
export const createChurchSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  address: addressSchema,
  pastorName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

// User roles - all available roles in the system
export const userRoleSchema = z.enum([
  'platform_admin',
  'admin',
  'pastor',
  'teacher',
  'member',
  'student',
]);

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  role: userRoleSchema,
  churchIds: z.array(z.string()).optional(), // For multi-church access
});

export const updateUserSchema = createUserSchema.partial().omit({ email: true });

// Student schemas
export const newBirthMilestoneSchema = z.object({
  milestone: z.enum(['repentance', 'baptism', 'holyGhost']),
  completed: z.boolean(),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const createStudentSchema = z.object({
  userId: z.string(),
  assignedTeacherId: z.string().optional(),
  notes: z.string().optional(),
});

// Study schemas
export const createStudySchema = z.object({
  title: z.string().min(2).max(200),
  curriculum: z.enum(['search-for-truth', 'exploring-gods-word', 'first-principles', 'custom']),
  studentIds: z.array(z.string()).min(1),
  scheduledDay: z.string().optional(),
  scheduledTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Lesson schemas
export const updateLessonSchema = z.object({
  status: z.enum(['not-started', 'in-progress', 'completed']).optional(),
  teacherNotes: z.string().optional(),
  studentNotes: z.string().optional(),
  completedDate: z.string().datetime().optional(),
});

// Export types inferred from schemas
export type CreateChurchInput = z.infer<typeof createChurchSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type NewBirthMilestoneInput = z.infer<typeof newBirthMilestoneSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateStudyInput = z.infer<typeof createStudySchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
