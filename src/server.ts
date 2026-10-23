import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { migrator } from './database/migrator';
import { sequelize } from './database/sequelize';

const bootstrap = async () => {
  await sequelize.authenticate();
  // Running pending migrations on boot keeps `docker compose up` one-step; with many replicas, run `db:migrate` as a release step instead.
  await migrator.up();

  const server = app.listen(env.PORT, () => logger.info(`API listening on :${env.PORT} (docs at /api/docs)`));

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection');
  process.exit(1);
});

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
