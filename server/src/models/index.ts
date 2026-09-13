import sequelize from '../config/database';
import { Sequelize } from 'sequelize';
import type { DbModels } from './registry';

import { AcademicYear, initAcademicYear } from './academicYear.model';
import { Teacher, initTeacher } from './teacher.model';
import { ClassModel, initClass } from './class.model';
import { Section, initSection } from './section.model';
import { Subject, initSubject } from './subject.model';
import { Student, initStudent } from './student.model';
import { StudentEnrollment, initStudentEnrollment } from './studentEnrollment.model';
import { Exam, initExam } from './exam.model';
import { TeachingAssignment, initTeachingAssignment } from './teachingAssignment.model';
import { Mark, initMark } from './mark.model';
import { ScoreChangeLog, initScoreChangeLog } from './scoreChangeLog.model';
import { OtpCode, initOtpCode } from './otpCode.model';

// 1. Initialize every model onto the shared sequelize instance.
initAcademicYear(sequelize);
initTeacher(sequelize);
initClass(sequelize);
initSection(sequelize);
initSubject(sequelize);
initStudent(sequelize);
initStudentEnrollment(sequelize);
initExam(sequelize);
initTeachingAssignment(sequelize);
initMark(sequelize);
initScoreChangeLog(sequelize);
initOtpCode(sequelize);

// 2. Assemble the typed registry.
export const models: DbModels = {
  AcademicYear,
  Teacher,
  Class: ClassModel,
  Section,
  Subject,
  Student,
  StudentEnrollment,
  Exam,
  TeachingAssignment,
  Mark,
  ScoreChangeLog,
  OtpCode,
};

// 3. Wire associations (order-independent now that all are initialized).
AcademicYear.associate(models);
Teacher.associate(models);
ClassModel.associate(models);
Section.associate(models);
Subject.associate(models);
Student.associate(models);
StudentEnrollment.associate(models);
Exam.associate(models);
TeachingAssignment.associate(models);
Mark.associate(models);
ScoreChangeLog.associate(models);

export interface Db extends DbModels {
  sequelize: Sequelize;
}

const db: Db = { ...models, sequelize };

export { sequelize };
export default db;
