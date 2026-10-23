import { SequelizeStorage, Umzug } from 'umzug';
import { logger } from '../config/logger';
import { sequelize } from './sequelize';

export const migrator = new Umzug({
  migrations: { glob: ['migrations/*.{js,ts}', { cwd: __dirname, ignore: '**/*.d.ts' }] },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'migrations' }),
  logger,
});

export type Migration = typeof migrator._types.migration;
