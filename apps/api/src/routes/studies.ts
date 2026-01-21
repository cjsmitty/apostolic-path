import type { UserRole } from '@apostolic-path/shared';
import { hasPermission } from '@apostolic-path/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { StudyService } from '../services/study.service.js';
import { zodToJsonSchema } from '../utils/zod-to-json.js';

const createStudySchema = z.object({
  title: z.string().min(2).max(200),
  curriculum: z.enum(['search-for-truth', 'exploring-gods-word', 'first-principles', 'custom']),
  studentIds: z.array(z.string()).min(1),
  scheduledDay: z.string().optional(),
  scheduledTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const updateStudySchema = createStudySchema.partial();

export const studyRoutes = async (app: FastifyInstance) => {
  const studyService = new StudyService();

  // List all studies
  app.get('/', {
    schema: {
      description: 'List all Bible studies in church',
      tags: ['Studies'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['in-progress', 'completed', 'paused', 'all'] },
          teacherId: { type: 'string' },
          curriculum: { type: 'string' },
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

      const query = request.query as {
        status?: string;
        teacherId?: string;
        curriculum?: string;
        limit?: number;
        cursor?: string;
      };

      // Students can only see their own studies
      if (userRole === 'student') {
        const studies = await studyService.listByStudent(userId, churchId);
        return { success: true, data: studies, nextCursor: undefined };
      }

      // Teachers can only see their own studies unless they have VIEW_ALL permission
      const teacherFilter =
        userRole === 'teacher' && !hasPermission(userRole, 'study:list')
          ? userId
          : query.teacherId;

      const result = await studyService.listByChurch(churchId, {
        ...query,
        teacherId: teacherFilter,
      });

      return { success: true, data: result.items, nextCursor: result.nextCursor };
    },
  });

  // Create new study
  app.post('/', {
    schema: {
      description: 'Create a new Bible study',
      tags: ['Studies'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(createStudySchema),
    },
    preHandler: [app.authenticate, app.requirePermission('study:create')],
    handler: async (request, reply) => {
      const churchId = request.churchContext.churchId;
      const teacherId = request.user.userId;
      const data = createStudySchema.parse(request.body);

      const study = await studyService.create({
        ...data,
        churchId,
        teacherId,
      });

      return reply.status(201).send({ success: true, data: study });
    },
  });

  // Get study by ID
  app.get('/:id', {
    schema: {
      description: 'Get Bible study by ID',
      tags: ['Studies'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const userId = request.user.userId;
      const userRole = request.user.role as UserRole;

      const study = await studyService.getById(id, churchId);

      if (!study) {
        return reply.code(404).send({
          success: false,
          error: { code: 'STUDY_NOT_FOUND', message: 'Study not found' },
        });
      }

      // Students can only view their own studies
      if (userRole === 'student' && !study.studentIds?.includes(userId)) {
        return reply.code(403).send({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'You can only view studies you are enrolled in' },
        });
      }

      // Teachers can only view their own studies unless they have VIEW_ALL permission
      if (
        userRole === 'teacher' &&
        study.teacherId !== userId &&
        !hasPermission(userRole, 'study:list')
      ) {
        return reply.code(403).send({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'You can only view studies you are leading' },
        });
      }

      return { success: true, data: study };
    },
  });

  // Update study
  app.patch('/:id', {
    schema: {
      description: 'Update Bible study',
      tags: ['Studies'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(updateStudySchema),
    },
    preHandler: [app.authenticate, app.requirePermission('study:update')],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const userId = request.user.userId;
      const userRole = request.user.role as UserRole;
      const data = updateStudySchema.parse(request.body);

      // Teachers can only update their own studies
      if (userRole === 'teacher') {
        const existingStudy = await studyService.getById(id, churchId);
        if (existingStudy && existingStudy.teacherId !== userId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'ACCESS_DENIED', message: 'You can only update studies you are leading' },
          });
        }
      }

      const study = await studyService.update(id, churchId, data);

      return { success: true, data: study };
    },
  });

  // Update study status
  app.post('/:id/status', {
    schema: {
      description: 'Update study status',
      tags: ['Studies'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['in-progress', 'completed', 'paused'] },
        },
        required: ['status'],
      },
    },
    preHandler: [app.authenticate, app.requirePermission('study:update')],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const userId = request.user.userId;
      const userRole = request.user.role as UserRole;
      const { status } = request.body as { status: string };

      // Teachers can only update their own studies
      if (userRole === 'teacher') {
        const existingStudy = await studyService.getById(id, churchId);
        if (existingStudy && existingStudy.teacherId !== userId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'ACCESS_DENIED', message: 'You can only update studies you are leading' },
          });
        }
      }

      const study = await studyService.updateStatus(id, churchId, status);

      return { success: true, data: study };
    },
  });

  // Get studies for a specific student
  app.get('/student/:studentId', {
    schema: {
      description: 'Get all studies for a student',
      tags: ['Studies'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { studentId } = request.params as { studentId: string };
      const churchId = request.churchContext.churchId;

      const studies = await studyService.listByStudent(studentId, churchId);

      return { success: true, data: studies };
    },
  });
};
