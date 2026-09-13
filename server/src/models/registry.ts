/**
 * Type of the model registry passed to each model's static associate().
 * Uses `import type` so there is no runtime import cycle between models.
 */
import type { AcademicYear } from './academicYear.model';
import type { Teacher } from './teacher.model';
import type { ClassModel } from './class.model';
import type { Section } from './section.model';
import type { Subject } from './subject.model';
import type { Student } from './student.model';
import type { StudentEnrollment } from './studentEnrollment.model';
import type { Exam } from './exam.model';
import type { TeachingAssignment } from './teachingAssignment.model';
import type { Mark } from './mark.model';
import type { ScoreChangeLog } from './scoreChangeLog.model';
import type { OtpCode } from './otpCode.model';

export interface DbModels {
  AcademicYear: typeof AcademicYear;
  Teacher: typeof Teacher;
  Class: typeof ClassModel;
  Section: typeof Section;
  Subject: typeof Subject;
  Student: typeof Student;
  StudentEnrollment: typeof StudentEnrollment;
  Exam: typeof Exam;
  TeachingAssignment: typeof TeachingAssignment;
  Mark: typeof Mark;
  ScoreChangeLog: typeof ScoreChangeLog;
  OtpCode: typeof OtpCode;
}
