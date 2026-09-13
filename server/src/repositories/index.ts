import { makeBaseRepository } from './baseRepository';
import { makeTeacherRepository } from './teacher.repository';
import { makeOtpRepository } from './otp.repository';
import { makeAcademicYearRepository } from './academicYear.repository';
import { makeClassroomRepository } from './classroom.repository';
import { makeEnrollmentRepository } from './enrollment.repository';
import { makeExamRepository } from './exam.repository';
import { makeMarkRepository } from './mark.repository';
import { makeScoreChangeLogRepository } from './scoreChangeLog.repository';
import type { DbModels } from '../models/registry';

/**
 * Repository registry factory.
 * Builds every repository from the model registry and returns them by name.
 * This is the only layer that receives raw models.
 */
export const makeRepositories = (models: DbModels) => ({
  academicYear: makeAcademicYearRepository(models),
  teacher: makeTeacherRepository(models),
  otp: makeOtpRepository(models),
  classroom: makeClassroomRepository(models),
  enrollment: makeEnrollmentRepository(models),
  exam: makeExamRepository(models),
  mark: makeMarkRepository(models),
  scoreChangeLog: makeScoreChangeLogRepository(models),

  // Plain CRUD repositories for the remaining models.
  subject: makeBaseRepository(models.Subject),
  class: makeBaseRepository(models.Class),
  section: makeBaseRepository(models.Section),
  student: makeBaseRepository(models.Student),
});

export type Repositories = ReturnType<typeof makeRepositories>;
