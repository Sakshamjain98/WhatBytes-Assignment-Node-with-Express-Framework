import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './config/logger';
import { sequelize } from './database/sequelize';
import { openApiDocument } from './docs/openapi';
import { errorHandler, notFoundHandler } from './common/middlewares/error-handler.middleware';
import { apiRouter } from './routes';

export const app = express();

app.disable('x-powered-by');
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    autoLogging: { ignore: (req) => req.url === '/health' },
  }),
);

// Swagger UI ships inline scripts, so it is mounted before the strict CSP.
app.get('/api/docs.json', (_req, res) => {
  res.json(openApiDocument);
});
app.use(
  '/api/docs',
  helmet({ contentSecurityPolicy: false }),
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument),
);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
