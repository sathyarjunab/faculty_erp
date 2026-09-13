import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import ExcelJS from 'exceljs';
import { OAuth2Client } from 'google-auth-library';
import { RequestHandler } from 'express';
import { Sequelize } from 'sequelize';

import config, { AppConfig } from './config/env';
import logger from './utils/logger';
import { sequelize } from './config/database';
import db from './models';
import { makeRepositories, Repositories } from './repositories';
import { makeServices, Services, ExternalDeps } from './services';
import { makeControllers, Controllers } from './controllers';
import { makeAuthMiddleware } from './middleware/auth.middleware';

export interface Container {
  config: AppConfig;
  logger: typeof logger;
  sequelize: Sequelize;
  repositories: Repositories;
  services: Services;
  controllers: Controllers;
  authMiddleware: RequestHandler;
}

/**
 * Composition root.
 * Instantiates third-party deps once, then builds the layers bottom-up:
 *   models → repositories → services → controllers (+ auth middleware).
 * Nothing else in the app calls `new` or requires third-party libs directly.
 */
export const createContainer = (): Container => {
  const deps: ExternalDeps = {
    jwt,
    bcrypt,
    nodemailer,
    ExcelJS,
    logger,
    googleClient: config.google.clientId ? new OAuth2Client(config.google.clientId) : null,
  };

  const repositories = makeRepositories(db);
  const services = makeServices({ repositories, sequelize, config, deps });
  const controllers = makeControllers({ services, config });
  const authMiddleware = makeAuthMiddleware({ tokenService: services.tokenService });

  return { config, logger, sequelize, repositories, services, controllers, authMiddleware };
};

export default createContainer;
