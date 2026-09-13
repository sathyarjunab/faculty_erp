import { Sequelize } from 'sequelize';
import config from './env';
import logger from '../utils/logger';

/**
 * Single shared Sequelize instance for the whole app.
 * Models attach themselves to this instance via their init factories.
 */
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  logging: config.db.logging ? (msg: string) => logger.debug(msg) : false,
  define: {
    underscored: true, // snake_case columns (created_at, academic_year_id, ...)
    freezeTableName: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectToDatabase = async (): Promise<Sequelize> => {
  await sequelize.authenticate();
  logger.info(`MySQL connected → ${config.db.host}:${config.db.port}/${config.db.name}`);
  return sequelize;
};

export default sequelize;
