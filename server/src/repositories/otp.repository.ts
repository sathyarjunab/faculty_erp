import { Op } from 'sequelize';
import { makeBaseRepository } from './baseRepository';
import type { DbModels } from '../models/registry';
import type { OtpCode } from '../models/otpCode.model';

type OtpPurpose = 'login' | 'signup';

export const makeOtpRepository = ({ OtpCode }: DbModels) => {
  const base = makeBaseRepository(OtpCode);

  return {
    ...base,

    /** Most recent, unconsumed, unexpired code for an email + purpose. */
    findLatestActive: (email: string, purpose: OtpPurpose): Promise<OtpCode | null> =>
      OtpCode.findOne({
        where: {
          email: email.toLowerCase(),
          purpose,
          consumedAt: null,
          expiresAt: { [Op.gt]: new Date() },
        },
        order: [['createdAt', 'DESC']],
      }),

    markConsumed: (id: number): Promise<[number]> =>
      OtpCode.update({ consumedAt: new Date() }, { where: { id } }),

    incrementAttempts: (id: number): Promise<unknown> => OtpCode.increment('attempts', { where: { id } }),

    /** Invalidate any outstanding codes before issuing a new one. */
    invalidateAll: (email: string, purpose: OtpPurpose): Promise<[number]> =>
      OtpCode.update(
        { consumedAt: new Date() },
        { where: { email: email.toLowerCase(), purpose, consumedAt: null } }
      ),
  };
};

export type OtpRepository = ReturnType<typeof makeOtpRepository>;
