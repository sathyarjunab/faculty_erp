import { Sequelize } from 'sequelize';
import type { OAuth2Client } from 'google-auth-library';
import { makeTokenService } from './token.service';
import { makeMailService } from './mail.service';
import { makeGradeService } from './grade.service';
import { makeAuthService } from './auth.service';
import { makeProfileService } from './profile.service';
import { makeClassroomService } from './classroom.service';
import { makeMarksService } from './marks.service';
import { makeExportService } from './export.service';
import { makeDashboardService } from './dashboard.service';
import type { Repositories } from '../repositories';
import type { AppConfig } from '../config/env';
import type { Logger } from '../utils/logger';

export interface ExternalDeps {
  jwt: typeof import('jsonwebtoken');
  bcrypt: typeof import('bcryptjs');
  nodemailer: typeof import('nodemailer');
  ExcelJS: typeof import('exceljs');
  logger: Logger;
  googleClient: OAuth2Client | null;
}

interface MakeServicesArgs {
  repositories: Repositories;
  sequelize: Sequelize;
  config: AppConfig;
  deps: ExternalDeps;
}

/**
 * Service registry factory. Builds every service, injecting repositories and
 * third-party dependencies. This is the composition point for the domain layer.
 */
export const makeServices = ({ repositories, sequelize, config, deps }: MakeServicesArgs) => {
  const tokenService = makeTokenService({ config, jwt: deps.jwt });
  const mailService = makeMailService({ config, nodemailer: deps.nodemailer, logger: deps.logger });
  const gradeService = makeGradeService({ config });

  const authService = makeAuthService({
    teacherRepository: repositories.teacher,
    otpRepository: repositories.otp,
    tokenService,
    mailService,
    googleClient: deps.googleClient,
    bcrypt: deps.bcrypt,
    config,
    logger: deps.logger,
  });

  const profileService = makeProfileService({
    teacherRepository: repositories.teacher,
    authService,
    bcrypt: deps.bcrypt,
  });

  const classroomService = makeClassroomService({
    academicYearRepository: repositories.academicYear,
    classroomRepository: repositories.classroom,
    enrollmentRepository: repositories.enrollment,
  });

  const marksService = makeMarksService({
    academicYearRepository: repositories.academicYear,
    classroomRepository: repositories.classroom,
    examRepository: repositories.exam,
    enrollmentRepository: repositories.enrollment,
    markRepository: repositories.mark,
    scoreChangeLogRepository: repositories.scoreChangeLog,
    gradeService,
    sequelize,
  });

  const exportService = makeExportService({ ExcelJS: deps.ExcelJS, marksService });

  const dashboardService = makeDashboardService({
    academicYearRepository: repositories.academicYear,
    classroomRepository: repositories.classroom,
    enrollmentRepository: repositories.enrollment,
    examRepository: repositories.exam,
    markRepository: repositories.mark,
    scoreChangeLogRepository: repositories.scoreChangeLog,
    subjectRepository: repositories.subject,
    gradeService,
    config,
  });

  return {
    tokenService,
    mailService,
    gradeService,
    authService,
    profileService,
    classroomService,
    marksService,
    exportService,
    dashboardService,
  };
};

export type Services = ReturnType<typeof makeServices>;
