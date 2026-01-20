import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LessonService } from '../services/lesson.service.js';
import { zodToJsonSchema } from '../utils/zod-to-json.js';

const updateLessonSchema = z.object({
  status: z.enum(['not-started', 'in-progress', 'completed']).optional(),
  teacherNotes: z.string().optional(),
  studentNotes: z.string().optional(),
  completedDate: z.string().datetime().optional(),
});

export const lessonRoutes = async (app: FastifyInstance) => {
  const lessonService = new LessonService();

  // Get lessons for a study
  app.get('/study/:studyId', {
    schema: {
      description: 'Get all lessons for a Bible study',
      tags: ['Lessons'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { studyId } = request.params as { studyId: string };

      const lessons = await lessonService.listByStudy(studyId);

      return { success: true, data: lessons };
    },
  });

  // Get lesson by ID
  app.get('/:id', {
    schema: {
      description: 'Get lesson by ID',
      tags: ['Lessons'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;

      const lesson = await lessonService.getById(id, churchId);

      if (!lesson) {
        return reply.status(404).send({
          success: false,
          error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found' },
        });
      }

      return { success: true, data: lesson };
    },
  });

  // Update lesson progress
  app.patch('/:id', {
    schema: {
      description: 'Update lesson progress',
      tags: ['Lessons'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(updateLessonSchema),
    },
    preHandler: [app.authenticate, app.requireRole(['admin', 'pastor', 'teacher'])],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const data = updateLessonSchema.parse(request.body);

      const lesson = await lessonService.update(id, churchId, data);

      return { success: true, data: lesson };
    },
  });

  // Mark lesson complete
  app.post('/:id/complete', {
    schema: {
      description: 'Mark lesson as complete',
      tags: ['Lessons'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          notes: { type: 'string' },
        },
      },
    },
    preHandler: [app.authenticate, app.requireRole(['admin', 'pastor', 'teacher'])],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const { notes } = (request.body as { notes?: string }) || {};

      const lesson = await lessonService.markComplete(id, churchId, notes);

      return { success: true, data: lesson };
    },
  });

  // Add note to lesson
  app.post('/:id/notes', {
    schema: {
      description: 'Add a note to the lesson',
      tags: ['Lessons'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['teacher', 'student'] },
          content: { type: 'string' },
        },
        required: ['type', 'content'],
      },
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const { type, content } = request.body as { type: 'teacher' | 'student'; content: string };

      const lesson = await lessonService.addNote(id, churchId, type, content);

      return { success: true, data: lesson };
    },
  });
};
