import { FindOptions } from 'sequelize';
import { makeBaseRepository } from './baseRepository';
import type { DbModels } from '../models/registry';
import type { Teacher } from '../models/teacher.model';

/**
 * Teacher repository. The default model scope hides passwordHash;
 * *WithSecret finders include it for authentication.
 */
export const makeTeacherRepository = ({ Teacher }: DbModels) => {
  const base = makeBaseRepository(Teacher);

  return {
    ...base,

    findByEmail: (email: string, options: FindOptions = {}): Promise<Teacher | null> =>
      Teacher.findOne({ where: { email: email.toLowerCase() }, ...options }),

    findByEmailWithSecret: (email: string, options: FindOptions = {}): Promise<Teacher | null> =>
      Teacher.scope('withSecret').findOne({ where: { email: email.toLowerCase() }, ...options }),

    findByPkWithSecret: (id: number, options: Omit<FindOptions, 'where'> = {}): Promise<Teacher | null> =>
      Teacher.scope('withSecret').findByPk(id, options),

    findByGoogleId: (googleId: string, options: FindOptions = {}): Promise<Teacher | null> =>
      Teacher.findOne({ where: { googleId }, ...options }),
  };
};

export type TeacherRepository = ReturnType<typeof makeTeacherRepository>;
