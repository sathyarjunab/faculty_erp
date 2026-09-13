/* eslint-disable no-await-in-loop */
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';
import { sequelize } from '../config/database';
import ensureDatabase from './ensureDatabase';
import db from '../models';
import type { ClassModel } from '../models/class.model';
import type { Section } from '../models/section.model';
import type { Exam } from '../models/exam.model';
import type { Student } from '../models/student.model';
import type { StudentEnrollment } from '../models/studentEnrollment.model';
import type { TeachingAssignment } from '../models/teachingAssignment.model';

const {
  AcademicYear,
  Teacher,
  Class,
  Section: SectionModel,
  Subject,
  Student: StudentModel,
  StudentEnrollment: EnrollmentModel,
  Exam: ExamModel,
  TeachingAssignment: AssignmentModel,
  Mark,
  ScoreChangeLog,
  OtpCode,
} = db;

const FIRST_NAMES = [
  'Aarav', 'Diya', 'Rohan', 'Isha', 'Kabir', 'Ananya', 'Vivaan', 'Sara',
  'Aditya', 'Meera', 'Arjun', 'Nisha', 'Karan', 'Priya', 'Dev', 'Riya',
];
const LAST_NAMES = ['Sharma', 'Verma', 'Nair', 'Iyer', 'Gupta', 'Reddy', 'Khan', 'Bose'];

interface ExamDef {
  name: string;
  sequence: number;
  maxMarks: number;
}
interface ClassDef {
  name: string;
  sections: string[];
  exams: ExamDef[];
  studentsPerSection: number;
}
interface ClassBundle {
  klass: ClassModel;
  sections: Record<string, Section>;
  exams: Exam[];
}
type EnrollmentInfo = { enrollment: StudentEnrollment; student: Student };

const clearAll = async (): Promise<void> => {
  await ScoreChangeLog.destroy({ where: {} });
  await Mark.destroy({ where: {} });
  await AssignmentModel.destroy({ where: {} });
  await ExamModel.destroy({ where: {} });
  await Subject.destroy({ where: {} });
  await EnrollmentModel.destroy({ where: {} });
  await StudentModel.destroy({ where: {} });
  await SectionModel.destroy({ where: {} });
  await Class.destroy({ where: {} });
  await OtpCode.destroy({ where: {} });
  await Teacher.destroy({ where: {} });
  await AcademicYear.destroy({ where: {} });
  logger.info('Existing data cleared.');
};

const seed = async (): Promise<void> => {
  await ensureDatabase();
  await sequelize.authenticate();
  await sequelize.sync();
  await clearAll();

  // ── Academic years ────────────────────────────────────────────────
  const prevYear = await AcademicYear.create({ label: '2024-25', isActive: false });
  const year = await AcademicYear.create({ label: '2025-26', isActive: true });

  // ── Subjects ──────────────────────────────────────────────────────
  const subjects: Record<string, Awaited<ReturnType<typeof Subject.create>>> = {};
  const subjectDefs: [string, string][] = [
    ['Mathematics', 'MATH'],
    ['Science', 'SCI'],
    ['English', 'ENG'],
    ['Social Studies', 'SOC'],
    ['Drawing', 'DRAW'],
  ];
  for (const [name, code] of subjectDefs) {
    subjects[code] = await Subject.create({ name, code });
  }

  // ── Teachers (password: Password123) ──────────────────────────────
  const passwordHash = await bcrypt.hash('Password123', 10);
  const anita = await Teacher.create({
    name: 'Anita Sharma', email: 'anita@school.edu', passwordHash, emailVerified: true, dept: 'Mathematics',
  });
  const rahul = await Teacher.create({
    name: 'Rahul Verma', email: 'rahul@school.edu', passwordHash, emailVerified: true, dept: 'Science',
  });
  const meera = await Teacher.create({
    name: 'Meera Nair', email: 'meera@school.edu', passwordHash, emailVerified: true, dept: 'English',
  });

  // ── Classes, sections, exams ──────────────────────────────────────
  const lowerExams: ExamDef[] = [
    { name: 'Term 1', sequence: 1, maxMarks: 50 },
    { name: 'Term 2', sequence: 2, maxMarks: 50 },
    { name: 'Final', sequence: 3, maxMarks: 100 },
  ];
  const higherExams: ExamDef[] = [
    { name: 'First Term', sequence: 1, maxMarks: 50 },
    { name: 'Mid Term', sequence: 2, maxMarks: 50 },
    { name: 'Second Term', sequence: 3, maxMarks: 50 },
    { name: 'Final', sequence: 4, maxMarks: 100 },
  ];

  const classDefs: ClassDef[] = [
    { name: 'Pre-KG', sections: ['A'], exams: lowerExams, studentsPerSection: 4 },
    { name: 'Grade 1', sections: ['A', 'B'], exams: lowerExams, studentsPerSection: 5 },
    { name: 'Grade 10', sections: ['A', 'B'], exams: higherExams, studentsPerSection: 6 },
  ];

  const classes: Record<string, ClassBundle> = {};
  let admissionCounter = 1;
  const enrollmentsBySection: Record<number, EnrollmentInfo[]> = {};

  for (const def of classDefs) {
    const klass = await Class.create({ name: def.name, academicYearId: year.id });
    const sectionMap: Record<string, Section> = {};

    for (const sName of def.sections) {
      const section = await SectionModel.create({ classId: klass.id, name: sName });
      sectionMap[sName] = section;

      const list: EnrollmentInfo[] = [];
      for (let i = 0; i < def.studentsPerSection; i += 1) {
        const first = FIRST_NAMES[(admissionCounter * 3 + i) % FIRST_NAMES.length];
        const last = LAST_NAMES[(admissionCounter + i) % LAST_NAMES.length];
        const admissionNo = `ADM-2025-${String(admissionCounter).padStart(4, '0')}`;
        admissionCounter += 1;
        const student = await StudentModel.create({ admissionNo, name: `${first} ${last}` });
        const enrollment = await EnrollmentModel.create({
          studentId: student.id,
          classId: klass.id,
          sectionId: section.id,
          rollNo: `${def.name.replace(/\s/g, '')}${sName}-${String(i + 1).padStart(2, '0')}`,
          academicYearId: year.id,
          status: 'active',
        });
        list.push({ enrollment, student });
      }
      enrollmentsBySection[section.id] = list;
    }

    const exams: Exam[] = [];
    for (const e of def.exams) {
      exams.push(await ExamModel.create({ ...e, classId: klass.id, academicYearId: year.id }));
    }

    classes[def.name] = { klass, sections: sectionMap, exams };
  }

  // ── Previous-year history (demonstrates promotion) ────────────────
  const grade9 = await Class.create({ name: 'Grade 9', academicYearId: prevYear.id });
  const grade9A = await SectionModel.create({ classId: grade9.id, name: 'A' });
  for (const { student } of enrollmentsBySection[classes['Grade 10'].sections.A.id]) {
    await EnrollmentModel.create({
      studentId: student.id,
      classId: grade9.id,
      sectionId: grade9A.id,
      rollNo: `Grade9A-${String(student.id).slice(-2)}`,
      academicYearId: prevYear.id,
      status: 'promoted',
    });
  }

  // ── Teaching assignments (the linchpin) ───────────────────────────
  const assign = (teacherId: number, subjectCode: string, className: string, sectionName: string) =>
    AssignmentModel.create({
      teacherId,
      subjectId: subjects[subjectCode].id,
      sectionId: classes[className].sections[sectionName].id,
      academicYearId: year.id,
    });

  const anitaG10A = await assign(anita.id, 'MATH', 'Grade 10', 'A');
  const anitaG10B = await assign(anita.id, 'MATH', 'Grade 10', 'B');
  await assign(anita.id, 'MATH', 'Grade 1', 'A');

  const rahulG10A = await assign(rahul.id, 'SCI', 'Grade 10', 'A');
  await assign(rahul.id, 'SCI', 'Grade 1', 'B');

  await assign(meera.id, 'ENG', 'Grade 10', 'B');
  await assign(meera.id, 'ENG', 'Pre-KG', 'A');

  // ── Class teachers (homeroom) ─────────────────────────────────────
  // A teacher can be class teacher of multiple sections; a homeroom need not be
  // one they teach in (Anita heads Pre-KG A but teaches no subject there).
  const setClassTeacher = async (className: string, sectionName: string, teacherId: number): Promise<void> => {
    const section = classes[className].sections[sectionName];
    section.classTeacherId = teacherId;
    await section.save();
  };
  await setClassTeacher('Grade 10', 'A', anita.id);
  await setClassTeacher('Pre-KG', 'A', anita.id); // homeroom where Anita teaches nothing
  await setClassTeacher('Grade 1', 'B', rahul.id);
  await setClassTeacher('Grade 10', 'B', meera.id);

  // ── Sample marks + change logs for Anita (so the dashboard has data) ─
  const seedMarksFor = async (assignment: TeachingAssignment, examList: Exam[], examCount: number): Promise<void> => {
    const enrollments = enrollmentsBySection[assignment.sectionId];
    for (let e = 0; e < examCount; e += 1) {
      const exam = examList[e];
      for (let i = 0; i < enrollments.length; i += 1) {
        const { enrollment } = enrollments[i];
        const isAbsent = e === 1 && i === 0;
        const base = 0.55 + ((i * 7) % 40) / 100;
        const score = isAbsent ? null : Math.min(exam.maxMarks, Math.round(exam.maxMarks * base));
        const mark = await Mark.create({
          enrollmentId: enrollment.id,
          subjectId: assignment.subjectId,
          examId: exam.id,
          score,
          isAbsent,
          teacherId: assignment.teacherId,
          academicYearId: year.id,
        });
        await ScoreChangeLog.create({
          markId: mark.id,
          teacherId: assignment.teacherId,
          enrollmentId: enrollment.id,
          subjectId: assignment.subjectId,
          examId: exam.id,
          oldScore: null,
          newScore: score,
          oldIsAbsent: null,
          newIsAbsent: isAbsent,
          action: 'create',
        });
      }
    }
  };

  await seedMarksFor(anitaG10A, classes['Grade 10'].exams, 2);
  await seedMarksFor(anitaG10B, classes['Grade 10'].exams, 1);
  // Rahul teaches Science to Grade 10-A (Anita's homeroom) — shows up in her
  // whole-class analytics and as an "other teacher" edit in her class log.
  await seedMarksFor(rahulG10A, classes['Grade 10'].exams, 1);

  logger.info('──────────────────────────────────────────────');
  logger.info('Seed complete. Sample login (all teachers): password "Password123"');
  logger.info('  anita@school.edu  (Mathematics — has sample marks & logs)');
  logger.info('  rahul@school.edu  (Science)');
  logger.info('  meera@school.edu  (English)');
  logger.info('──────────────────────────────────────────────');

  await sequelize.close();
  process.exit(0);
};

seed().catch(async (err) => {
  logger.error('Seed failed:', err);
  try {
    await sequelize.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
