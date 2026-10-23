import { Sequelize } from 'sequelize';
import { env } from '../config/env';

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: { underscored: true },
  pool: { max: 10, min: 0, idle: 10_000, acquire: 30_000 },
});
