import logger from '../utils/logger';
import { sequelize } from '../config/database';
import ensureDatabase from './ensureDatabase';
import '../models'; // register models + associations onto sequelize

/**
 * Creates/updates all tables from the models.
 *   npm run db:sync         -> alter existing tables to match models
 *   npm run db:sync:force   -> DROP and recreate all tables (destructive)
 */
const run = async (): Promise<void> => {
  const force = process.argv.includes('--force');
  await ensureDatabase();
  await sequelize.authenticate();

  logger.info(force ? 'Syncing schema (FORCE: dropping tables)...' : 'Syncing schema (alter)...');
  await sequelize.sync(force ? { force: true } : { alter: true });
  logger.info('Schema sync complete.');

  await sequelize.close();
  process.exit(0);
};

run().catch(async (err) => {
  logger.error('Schema sync failed:', err);
  try {
    await sequelize.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
