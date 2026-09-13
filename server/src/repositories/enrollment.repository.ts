import { makeBaseRepository } from './baseRepository';
import type { DbModels } from '../models/registry';
import type { StudentEnrollment } from '../models/studentEnrollment.model';

export const makeEnrollmentRepository = ({ StudentEnrollment, Student }: DbModels) => {
  const base = makeBaseRepository(StudentEnrollment);

  return {
    ...base,

    /** Active enrollments (with student identity) for a section in a year, roll-ordered. */
    findBySectionAndYear: (sectionId: number, academicYearId: number): Promise<StudentEnrollment[]> =>
      StudentEnrollment.findAll({
        where: { sectionId, academicYearId, status: 'active' },
        include: [{ model: Student, as: 'student' }],
        order: [['rollNo', 'ASC']],
      }),

    countBySectionAndYear: (sectionId: number, academicYearId: number): Promise<number> =>
      StudentEnrollment.count({ where: { sectionId, academicYearId, status: 'active' } }),
  };
};

export type EnrollmentRepository = ReturnType<typeof makeEnrollmentRepository>;
