import config from './config/env';
import logger from './utils/logger';
import { connectToDatabase } from './config/database';
import createContainer from './container';
import createApp from './app';

const start = async (): Promise<void> => {
  try {
    await connectToDatabase();

    const container = createContainer();
    const app = createApp(container);

    const server = app.listen(config.port, () => {
      logger.info(`Server running  → http://localhost:${config.port}`);
      logger.info(`API docs        → http://localhost:${config.port}/api/docs`);
      logger.info(`Health check    → http://localhost:${config.port}/api/health`);
    });

    const shutdown = (signal: string): void => {
      logger.info(`${signal} received, shutting down...`);
      server.close(() => {
        container.sequelize.close().finally(() => process.exit(0));
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

void start();
