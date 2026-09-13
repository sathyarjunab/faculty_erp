import express, { Express, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import swaggerSpec from './config/swagger';
import { makeRoutes } from './routes';
import { notFoundHandler, makeErrorHandler } from './middleware/error.middleware';
import type { Container } from './container';

/**
 * Express app factory. Receives the container so all wiring is explicit
 * and the app can be built in tests without touching globals.
 */
export const createApp = (container: Container): Express => {
  const { config, controllers, authMiddleware, logger } = container;
  const app = express();

  // Disable CSP so Swagger UI's inline assets load; other helmet protections stay on.
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS: allow the configured client URLs, plus any localhost/127.0.0.1 port in
  // development (Vite may pick 5173, 5174, ... depending on what's free).
  const allowed = new Set(config.clientUrls);
  const localhostRe = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  const corsOptions: CorsOptions = {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin / curl / server-to-server
      if (allowed.has(origin)) return callback(null, true);
      if (!config.isProduction && localhostRe.test(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  };
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (!config.isProduction) app.use(morgan('dev'));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'ok', data: { uptime: process.uptime(), env: config.env } });
  });

  // API docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get('/api/docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));

  // Feature routes
  app.use(makeRoutes({ controllers, authMiddleware }));

  // 404 + error handling (must be last)
  app.use(notFoundHandler);
  app.use(makeErrorHandler({ logger, config }));

  return app;
};

export default createApp;
