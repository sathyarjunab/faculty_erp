import { Op, FindOptions } from 'sequelize';
import { makeBaseRepository } from './baseRepository';
import type { DbModels } from '../models/registry';
import type { Mark } from '../models/mark.model';

interface MarkScope {
  subjectIds: number[];
  examIds: number[];
  enrollmentIds: number[];
}

export const makeMarkRepository = ({ Mark }: DbModels) => {
  const base = makeBaseRepository(Mark);

  return {
    ...base,

    /** All marks for a subject+exam limited to a set of enrollments. */
    findForSubjectExam: (
      subjectId: number,
      examId: number,
      enrollmentIds: number[],
      options: FindOptions = {}
    ): Promise<Mark[]> =>
      Mark.findAll({ where: { subjectId, examId, enrollmentId: { [Op.in]: enrollmentIds } }, ...options }),

    findOneByKeys: (
      enrollmentId: number,
      subjectId: number,
      examId: number,
      options: FindOptions = {}
    ): Promise<Mark | null> => Mark.findOne({ where: { enrollmentId, subjectId, examId }, ...options }),

    /** Marks across several subjects/exams — used by dashboard analytics. */
    findByScope: ({ subjectIds, examIds, enrollmentIds }: MarkScope, options: FindOptions = {}): Promise<Mark[]> =>
      Mark.findAll({
        where: {
          subjectId: { [Op.in]: subjectIds },
          examId: { [Op.in]: examIds },
          enrollmentId: { [Op.in]: enrollmentIds },
        },
        ...options,
      }),

    /** All marks (every subject) for a set of enrollments + exams — used by whole-class homeroom analytics. */
    findForEnrollmentsAndExams: (
      enrollmentIds: number[],
      examIds: number[],
      options: FindOptions = {}
    ): Promise<Mark[]> =>
      Mark.findAll({
        where: { enrollmentId: { [Op.in]: enrollmentIds }, examId: { [Op.in]: examIds } },
        ...options,
      }),
  };
};

export type MarkRepository = ReturnType<typeof makeMarkRepository>;
