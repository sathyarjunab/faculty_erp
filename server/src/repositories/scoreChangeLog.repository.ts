import { Op } from 'sequelize';
import { makeBaseRepository } from './baseRepository';
import type { DbModels } from '../models/registry';
import type { ScoreChangeLog } from '../models/scoreChangeLog.model';

interface Pagination {
  limit: number;
  offset: number;
}

interface VisibleScope {
  teacherId: number;
  // Enrollments belonging to the teacher's homeroom sections (edits by anyone here are visible).
  homeroomEnrollmentIds: number[];
}

export const makeScoreChangeLogRepository = ({
  ScoreChangeLog,
  StudentEnrollment,
  Student,
  Subject,
  Exam,
  Teacher,
}: DbModels) => {
  const base = makeBaseRepository(ScoreChangeLog);

  const include = [
    { model: StudentEnrollment, as: 'enrollment', include: [{ model: Student, as: 'student' }] },
    { model: Subject, as: 'subject' },
    { model: Exam, as: 'exam' },
    { model: Teacher, as: 'teacher' },
  ];

  return {
    ...base,

    /**
     * Logs visible to a teacher: their own edits, PLUS any teacher's edits to
     * marks of students in the teacher's homeroom sections (class-teacher view).
     */
    findVisibleForTeacher: (
      { teacherId, homeroomEnrollmentIds }: VisibleScope,
      { limit, offset }: Pagination
    ): Promise<{ rows: ScoreChangeLog[]; count: number }> => {
      const or: Record<string, unknown>[] = [{ teacherId }];
      if (homeroomEnrollmentIds.length) {
        or.push({ enrollmentId: { [Op.in]: homeroomEnrollmentIds } });
      }
      return ScoreChangeLog.findAndCountAll({
        where: { [Op.or]: or },
        include,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      }) as Promise<{ rows: ScoreChangeLog[]; count: number }>;
    },
  };
};

export type ScoreChangeLogRepository = ReturnType<typeof makeScoreChangeLogRepository>;
