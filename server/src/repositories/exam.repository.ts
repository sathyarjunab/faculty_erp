import { makeBaseRepository } from './baseRepository';
import type { DbModels } from '../models/registry';
import type { Exam } from '../models/exam.model';

export const makeExamRepository = ({ Exam }: DbModels) => {
  const base = makeBaseRepository(Exam);

  return {
    ...base,

    /** Exams defined for a class in a year, in display order. */
    findByClassAndYear: (classId: number, academicYearId: number): Promise<Exam[]> =>
      Exam.findAll({
        where: { classId, academicYearId },
        order: [
          ['sequence', 'ASC'],
          ['id', 'ASC'],
        ],
      }),

    findByIdForClass: (id: number, classId: number, academicYearId: number): Promise<Exam | null> =>
      Exam.findOne({ where: { id, classId, academicYearId } }),
  };
};

export type ExamRepository = ReturnType<typeof makeExamRepository>;
