import type { UserRole } from '@apostolic-path/shared';
import { hasPermission } from '@apostolic-path/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { StudentService } from '../services/student.service.js';
import { zodToJsonSchema } from '../utils/zod-to-json.js';

const newBirthStatusSchema = z.object({
  waterBaptism: z.object({
    completed: z.boolean(),
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
  holyGhost: z.object({
    completed: z.boolean(),
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

const createStudentSchema = z.object({
  userId: z.string(),
  assignedTeacherId: z.string().optional(), // Optional in schema, but enforced in handler (auto-assigned for teachers)
  startDate: z.string().datetime().default(() => new Date().toISOString()),
  notes: z.string().optional(),
});

const updateStudentSchema = z.object({
  assignedTeacherId: z.string().optional(),
  newBirthStatus: newBirthStatusSchema.partial().optional(),
  notes: z.string().optional(),
});

const updateNewBirthSchema = z.object({
  milestone: z.enum(['waterBaptism', 'holyGhost']),
  completed: z.boolean(),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const studentRoutes = async (app: FastifyInstance) => {
  const studentService = new StudentService();

  // List all students
  app.get('/', {
    schema: {
      description: 'List all students in church',
      tags: ['Students'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'completed', 'all'] },
          teacherId: { type: 'string' },
          limit: { type: 'number', default: 50 },
          cursor: { type: 'string' },
        },
      },
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const churchId = request.churchContext.churchId;
      const userId = request.user.userId;
      const userRole = request.user.role as UserRole;
      const { status, teacherId, limit, cursor } = request.query as {
        status?: string;
        teacherId?: string;
        limit?: number;
        cursor?: string;
      };

      // Students can only see their own record
      if (userRole === 'student') {
        const student = await studentService.getByUserId(userId, churchId);
        return { success: true, data: student ? [student] : [], nextCursor: undefined };
      }

      // Teachers can only see their assigned students unless they have VIEW_ALL permission
      let effectiveTeacherId = teacherId;
      if (userRole === 'teacher' && !hasPermission(userRole, 'student:list')) {
        effectiveTeacherId = userId;
      }

      const result = await studentService.listByChurch(churchId, {
        status,
        teacherId: effectiveTeacherId,
        limit,
        cursor,
      });

      return { success: true, data: result.items, nextCursor: result.nextCursor };
    },
  });

  // Create new student record
  app.post('/', {
    schema: {
      description: 'Create a new student record',
      tags: ['Students'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(createStudentSchema),
    },
    preHandler: [app.authenticate, app.requirePermission('student:create')],
    handler: async (request, reply) => {
      const churchId = request.churchContext.churchId;
      const userRole = request.user.role as UserRole;
      const userId = request.user.userId;
      const data = createStudentSchema.parse(request.body);

      // Teachers can only assign students to themselves
      // They cannot assign to other teachers
      if (userRole === 'teacher') {
        if (data.assignedTeacherId && data.assignedTeacherId !== userId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Teachers can only assign students to themselves',
            },
          });
        }
        // Auto-assign to the creating teacher
        data.assignedTeacherId = userId;
      }

      // For non-teachers, validate they have permission to assign teachers
      if (userRole !== 'teacher') {
        if (!hasPermission(userRole, 'student:assign-teacher')) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to assign teachers to students',
            },
          });
        }
        
        // Pastors/Admins must provide a teacher
        if (!data.assignedTeacherId) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'A teacher must be assigned to every student',
            },
          });
        }
      }

      const student = await studentService.create({ ...data, churchId });

      return reply.code(201).send({ success: true, data: student });
    },
  });

  // Get student by ID
  app.get('/:id', {
    schema: {
      description: 'Get student by ID',
      tags: ['Students'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const userId = request.user.userId;
      const userRole = request.user.role as UserRole;

      const student = await studentService.getById(id, churchId);

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: { code: 'STUDENT_NOT_FOUND', message: 'Student record not found' },
        });
      }

      // Students can only view their own record
      if (userRole === 'student' && student.userId !== userId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'You can only view your own student record' },
        });
      }

      // Teachers can only view their assigned students unless they have VIEW_ALL permission
      if (
        userRole === 'teacher' &&
        student.assignedTeacherId !== userId &&
        !hasPermission(userRole, 'student:list')
      ) {
        return reply.code(403).send({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'You can only view students assigned to you' },
        });
      }

      return { success: true, data: student };
    },
  });

  // Update student
  app.patch('/:id', {
    schema: {
      description: 'Update student record',
      tags: ['Students'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(updateStudentSchema),
    },
    preHandler: [app.authenticate, app.requirePermission('student:update')],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const userId = request.user.userId;
      const userRole = request.user.role as UserRole;
      const data = updateStudentSchema.parse(request.body);

      // Teachers can only update their assigned students
      if (userRole === 'teacher') {
        const student = await studentService.getById(id, churchId);
        if (student && student.assignedTeacherId !== userId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'ACCESS_DENIED', message: 'You can only update students assigned to you' },
          });
        }
      }

      const student = await studentService.update(id, churchId, data as Parameters<typeof studentService.update>[2]);

      return { success: true, data: student };
    },
  });

  // Update New Birth milestone
  app.post('/:id/new-birth', {
    schema: {
      description: 'Update a New Birth milestone (repentance, baptism, Holy Ghost)',
      tags: ['Students'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(updateNewBirthSchema),
    },
    preHandler: [app.authenticate, app.requirePermission('student:update-milestones')],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const userId = request.user.userId;
      const userRole = request.user.role as UserRole;
      const data = updateNewBirthSchema.parse(request.body);

      // Teachers can only update their assigned students
      if (userRole === 'teacher') {
        const student = await studentService.getById(id, churchId);
        if (student && student.assignedTeacherId !== userId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'ACCESS_DENIED', message: 'You can only update students assigned to you' },
          });
        }
      }

      const student = await studentService.updateNewBirthMilestone(id, churchId, data);

      return { success: true, data: student };
    },
  });

  // Get New Birth summary for church
  app.get('/stats/new-birth', {
    schema: {
      description: 'Get New Birth statistics for church',
      tags: ['Students'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate, app.requirePermission('reports:view-church')],
    handler: async (request, reply) => {
      const churchId = request.churchContext.churchId;

      const stats = await studentService.getNewBirthStats(churchId);

      return { success: true, data: stats };
    },
  });

  // Get First Steps summary for church
  app.get('/stats/first-steps', {
    schema: {
      description: 'Get First Steps discipleship statistics for church',
      tags: ['Students'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate, app.requirePermission('reports:view-church')],
    handler: async (request, reply) => {
      const churchId = request.churchContext.churchId;

      const stats = await studentService.getFirstStepsStats(churchId);

      return { success: true, data: stats };
    },
  });

  // Update First Step progress
  app.post('/:id/first-steps/:step', {
    schema: {
      description: 'Update a First Step progress',
      tags: ['Students'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          started: { type: 'boolean' },
          completed: { type: 'boolean' },
          notes: { type: 'string' },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('firststeps:update')],
    handler: async (request, reply) => {
      const { id, step } = request.params as { id: string; step: string };
      const churchId = request.churchContext.churchId;
      const userId = request.user.userId;
      const userRole = request.user.role as UserRole;
      const data = request.body as { started?: boolean; completed?: boolean; notes?: string };

      // Teachers can only update their assigned students
      if (userRole === 'teacher') {
        const student = await studentService.getById(id, churchId);
        if (student && student.assignedTeacherId !== userId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'ACCESS_DENIED', message: 'You can only update students assigned to you' },
          });
        }
      }

      const student = await studentService.updateFirstStep(id, churchId, step, data);

      return { success: true, data: student };
    },
  });
};
