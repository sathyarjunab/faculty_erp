import { Op } from 'sequelize';
import { makeBaseRepository } from './baseRepository';
import type { DbModels } from '../models/registry';
import type { ScoreChangeLog } from '../models/scoreChangeLog.model';

interface Pagination {
  limit: number;
  offset: number;
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
     * Logs for a set of enrollments (the class teacher's homeroom students),
     * regardless of which teacher made the change. Newest first.
     */
    findForEnrollments: (
      enrollmentIds: number[],
      { limit, offset }: Pagination
    ): Promise<{ rows: ScoreChangeLog[]; count: number }> => {
      if (!enrollmentIds.length) return Promise.resolve({ rows: [], count: 0 });
      return ScoreChangeLog.findAndCountAll({
        where: { enrollmentId: { [Op.in]: enrollmentIds } },
        include,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      }) as Promise<{ rows: ScoreChangeLog[]; count: number }>;
    },
  };
};

export type ScoreChangeLogRepository = ReturnType<typeof makeScoreChangeLogRepository>;
