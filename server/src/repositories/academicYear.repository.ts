import { makeBaseRepository } from './baseRepository';
import type { DbModels } from '../models/registry';
import type { AcademicYear } from '../models/academicYear.model';

export const makeAcademicYearRepository = ({ AcademicYear }: DbModels) => {
  const base = makeBaseRepository(AcademicYear);

  return {
    ...base,

    /** The currently active academic year (falls back to the most recent). */
    findActive: async (): Promise<AcademicYear | null> => {
      const active = await AcademicYear.findOne({ where: { isActive: true } });
      if (active) return active;
      return AcademicYear.findOne({ order: [['id', 'DESC']] });
    },
  };
};

export type AcademicYearRepository = ReturnType<typeof makeAcademicYearRepository>;
