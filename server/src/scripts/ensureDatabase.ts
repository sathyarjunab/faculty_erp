import mysql from 'mysql2/promise';
import config from '../config/env';
import logger from '../utils/logger';

/**
 * Creates the target MySQL database if it doesn't exist yet, so `sync` / `seed`
 * work against a fresh MySQL server without a manual CREATE DATABASE step.
 */
export const ensureDatabase = async (): Promise<void> => {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();
  logger.info(`Database ensured → ${config.db.name}`);
};

export default ensureDatabase;
