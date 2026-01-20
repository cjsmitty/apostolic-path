import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { config } from './config/index.js';
import { authPlugin } from './plugins/auth.js';
import { churchContextPlugin } from './plugins/church-context.js';
import { errorHandler } from './plugins/error-handler.js';
import { permissionsPlugin } from './plugins/permissions.js';
import { registerRoutes } from './routes/index.js';

const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport:
        config.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Apostolic Path API',
        description: 'API for the Apostolic Path discipleship platform',
        version: '0.1.0',
      },
      servers: [
        {
          url: `http://localhost:${config.port}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Custom plugins
  await app.register(errorHandler);
  await app.register(authPlugin);
  await app.register(churchContextPlugin);
  await app.register(permissionsPlugin);

  // Register routes
  await registerRoutes(app);

  // Health check
  app.get('/health', async () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }));

  return app;
};

const start = async () => {
  try {
    const app = await buildApp();
    await app.listen({ port: config.port, host: config.host });
    console.log(`🚀 Apostolic Path API running at http://${config.host}:${config.port}`);
    console.log(`📚 API Documentation: http://${config.host}:${config.port}/docs`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

export { buildApp };
