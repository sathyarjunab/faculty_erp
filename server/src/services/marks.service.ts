import { Sequelize } from 'sequelize';
import ApiError from '../utils/ApiError';
import type { AcademicYearRepository } from '../repositories/academicYear.repository';
import type { ClassroomRepository } from '../repositories/classroom.repository';
import type { ExamRepository } from '../repositories/exam.repository';
import type { EnrollmentRepository } from '../repositories/enrollment.repository';
import type { MarkRepository } from '../repositories/mark.repository';
import type { ScoreChangeLogRepository } from '../repositories/scoreChangeLog.repository';
import type { GradeService } from './grade.service';
import type { AcademicYear } from '../models/academicYear.model';
import type { TeachingAssignment } from '../models/teachingAssignment.model';

interface MarksServiceDeps {
  academicYearRepository: AcademicYearRepository;
  classroomRepository: ClassroomRepository;
  examRepository: ExamRepository;
  enrollmentRepository: EnrollmentRepository;
  markRepository: MarkRepository;
  scoreChangeLogRepository: ScoreChangeLogRepository;
  gradeService: GradeService;
  sequelize: Sequelize;
}

export interface MarkEntryInput {
  enrollmentId: number | string;
  score?: number | string | null;
  isAbsent?: boolean;
}

interface NormalizedEntry {
  enrollmentId: number;
  score: number | null;
  isAbsent: boolean;
}

/**
 * Core marks workflow. Every write is scoped to an assignment the teacher owns
 * (that's the authorization boundary) and every change is recorded in
 * score_change_logs inside the same transaction as the mark write.
 */
export const makeMarksService = ({
  academicYearRepository,
  classroomRepository,
  examRepository,
  enrollmentRepository,
  markRepository,
  scoreChangeLogRepository,
  gradeService,
  sequelize,
}: MarksServiceDeps) => {
  const getActiveYear = async (): Promise<AcademicYear> => {
    const year = await academicYearRepository.findActive();
    if (!year) throw ApiError.notFound('No academic year configured.');
    return year;
  };

  const requireOwnedAssignment = async (
    assignmentId: number,
    teacherId: number
  ): Promise<{ assignment: TeachingAssignment; classId: number }> => {
    const assignment = await classroomRepository.findAssignmentByIdForTeacher(assignmentId, teacherId);
    if (!assignment) throw ApiError.notFound('Assignment not found or you do not teach this subject.');
    const classId = assignment.section?.klass?.id;
    if (!classId) throw ApiError.internal('Assignment is missing its class reference.');
    return { assignment, classId };
  };

  const classroomOf = (assignment: TeachingAssignment) => ({
    sectionId: assignment.section!.id,
    sectionName: assignment.section!.name,
    classId: assignment.section!.klass?.id ?? null,
    className: assignment.section!.klass?.name ?? null,
  });

  const subjectOf = (assignment: TeachingAssignment) => ({
    assignmentId: assignment.id,
    subjectId: assignment.subject!.id,
    subjectName: assignment.subject!.name,
    subjectCode: assignment.subject!.code,
  });

  const listExams = async (assignmentId: number, teacherId: number) => {
    const year = await getActiveYear();
    const { assignment, classId } = await requireOwnedAssignment(assignmentId, teacherId);
    const exams = await examRepository.findByClassAndYear(classId, year.id);
    return {
      classroom: classroomOf(assignment),
      subject: subjectOf(assignment),
      exams: exams.map((e) => ({ id: e.id, name: e.name, sequence: e.sequence, maxMarks: e.maxMarks })),
    };
  };

  const getMarksSheet = async (assignmentId: number, examId: number, teacherId: number) => {
    const year = await getActiveYear();
    const { assignment, classId } = await requireOwnedAssignment(assignmentId, teacherId);

    const exam = await examRepository.findByIdForClass(examId, classId, year.id);
    if (!exam) throw ApiError.notFound('Exam not found for this class.');

    const enrollments = await enrollmentRepository.findBySectionAndYear(assignment.sectionId, year.id);
    const enrollmentIds = enrollments.map((e) => e.id);
    const marks = enrollmentIds.length
      ? await markRepository.findForSubjectExam(assignment.subjectId, exam.id, enrollmentIds)
      : [];
    const markByEnrollment = new Map(marks.map((m) => [m.enrollmentId, m]));

    const students = enrollments.map((enr) => {
      const mark = markByEnrollment.get(enr.id) || null;
      const score = mark ? mark.score : null;
      const isAbsent = mark ? mark.isAbsent : false;
      const result = gradeService.evaluate({ score, maxMarks: exam.maxMarks, isAbsent });
      return {
        enrollmentId: enr.id,
        studentId: enr.student?.id ?? null,
        rollNo: enr.rollNo,
        studentName: enr.student?.name ?? null,
        markId: mark ? mark.id : null,
        score,
        isAbsent,
        percentage: result.percentage,
        grade: result.grade,
        status: result.status,
      };
    });

    return {
      academicYear: { id: year.id, label: year.label },
      classroom: classroomOf(assignment),
      subject: subjectOf(assignment),
      exam: { id: exam.id, name: exam.name, sequence: exam.sequence, maxMarks: exam.maxMarks },
      students,
    };
  };

  const normalizeEntry = (entry: MarkEntryInput, maxMarks: number, validIds: Set<number>): NormalizedEntry => {
    const enrollmentId = Number(entry.enrollmentId);
    if (!validIds.has(enrollmentId)) {
      throw ApiError.badRequest(`Enrollment ${entry.enrollmentId} is not in this classroom.`);
    }
    const isAbsent = !!entry.isAbsent;
    let score: number | null = null;
    if (!isAbsent && entry.score !== null && entry.score !== undefined && entry.score !== '') {
      score = Number(entry.score);
      if (Number.isNaN(score)) throw ApiError.badRequest(`Invalid score for enrollment ${entry.enrollmentId}.`);
      if (score < 0 || score > maxMarks) {
        throw ApiError.badRequest(`Score for enrollment ${entry.enrollmentId} must be between 0 and ${maxMarks}.`);
      }
    }
    return { enrollmentId, score, isAbsent };
  };

  const saveMarks = async (
    assignmentId: number,
    examId: number,
    teacherId: number,
    entries: MarkEntryInput[]
  ) => {
    const year = await getActiveYear();
    const { assignment, classId } = await requireOwnedAssignment(assignmentId, teacherId);

    const exam = await examRepository.findByIdForClass(examId, classId, year.id);
    if (!exam) throw ApiError.notFound('Exam not found for this class.');

    const enrollments = await enrollmentRepository.findBySectionAndYear(assignment.sectionId, year.id);
    const validIds = new Set(enrollments.map((e) => e.id));

    if (!Array.isArray(entries) || entries.length === 0) {
      throw ApiError.badRequest('No mark entries provided.');
    }
    const normalized = entries.map((e) => normalizeEntry(e, exam.maxMarks, validIds));

    let created = 0;
    let updated = 0;

    await sequelize.transaction(async (transaction) => {
      for (const entry of normalized) {
        const existing = await markRepository.findOneByKeys(entry.enrollmentId, assignment.subjectId, exam.id, {
          transaction,
        });

        if (!existing) {
          if (entry.score === null && !entry.isAbsent) continue;

          const mark = await markRepository.create(
            {
              enrollmentId: entry.enrollmentId,
              subjectId: assignment.subjectId,
              examId: exam.id,
              score: entry.score,
              isAbsent: entry.isAbsent,
              teacherId,
              academicYearId: year.id,
            },
            { transaction }
          );
          await scoreChangeLogRepository.create(
            {
              markId: mark.id,
              teacherId,
              enrollmentId: entry.enrollmentId,
              subjectId: assignment.subjectId,
              examId: exam.id,
              oldScore: null,
              newScore: entry.score,
              oldIsAbsent: null,
              newIsAbsent: entry.isAbsent,
              action: 'create',
            },
            { transaction }
          );
          created += 1;
          continue;
        }

        const oldScore = existing.score;
        const oldIsAbsent = existing.isAbsent;
        if (oldScore === entry.score && oldIsAbsent === entry.isAbsent) continue;

        existing.score = entry.score;
        existing.isAbsent = entry.isAbsent;
        existing.teacherId = teacherId;
        await existing.save({ transaction });

        await scoreChangeLogRepository.create(
          {
            markId: existing.id,
            teacherId,
            enrollmentId: entry.enrollmentId,
            subjectId: assignment.subjectId,
            examId: exam.id,
            oldScore,
            newScore: entry.score,
            oldIsAbsent,
            newIsAbsent: entry.isAbsent,
            action: 'update',
          },
          { transaction }
        );
        updated += 1;
      }
    });

    const sheet = await getMarksSheet(assignmentId, examId, teacherId);
    return { created, updated, ...sheet };
  };

  return { getActiveYear, requireOwnedAssignment, listExams, getMarksSheet, saveMarks };
};

export type MarksService = ReturnType<typeof makeMarksService>;
export type MarksSheet = Awaited<ReturnType<MarksService['getMarksSheet']>>;
