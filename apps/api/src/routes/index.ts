import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { churchRoutes } from './churches.js';
import { healthRoutes } from './health.js';
import { lessonRoutes } from './lessons.js';
import { studentRoutes } from './students.js';
import { studyRoutes } from './studies.js';
import { userRoutes } from './users.js';

export const registerRoutes = async (app: FastifyInstance) => {
  // Public routes
  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  // Protected routes (require authentication)
  await app.register(churchRoutes, { prefix: '/api/v1/churches' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(studentRoutes, { prefix: '/api/v1/students' });
  await app.register(studyRoutes, { prefix: '/api/v1/studies' });
  await app.register(lessonRoutes, { prefix: '/api/v1/lessons' });
};
