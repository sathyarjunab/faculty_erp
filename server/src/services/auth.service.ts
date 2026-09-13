import crypto from 'crypto';
import type bcryptjs from 'bcryptjs';
import type { OAuth2Client } from 'google-auth-library';
import ApiError from '../utils/ApiError';
import type { AppConfig } from '../config/env';
import type { Logger } from '../utils/logger';
import type { TeacherRepository } from '../repositories/teacher.repository';
import type { OtpRepository } from '../repositories/otp.repository';
import type { TokenService } from './token.service';
import type { MailService } from './mail.service';
import type { Teacher } from '../models/teacher.model';

export interface SanitizedTeacher {
  id: number;
  name: string;
  email: string;
  dept: string | null;
  photoUrl: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  teacher: SanitizedTeacher;
}

interface AuthServiceDeps {
  teacherRepository: TeacherRepository;
  otpRepository: OtpRepository;
  tokenService: TokenService;
  mailService: MailService;
  googleClient: OAuth2Client | null;
  bcrypt: typeof bcryptjs;
  config: AppConfig;
  logger: Logger;
}

/**
 * Authentication service.
 * Supports three login methods (password, email OTP, Google) that all resolve
 * to the same teacher account, matched by email. Self sign-up is allowed and
 * "claims" a pre-seeded account that shares the email.
 */
export const makeAuthService = ({
  teacherRepository,
  otpRepository,
  tokenService,
  mailService,
  googleClient,
  bcrypt,
  config,
  logger,
}: AuthServiceDeps) => {
  const normalizeEmail = (email: string): string => String(email || '').trim().toLowerCase();

  const sanitizeTeacher = (teacher: Teacher): SanitizedTeacher => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    dept: teacher.dept ?? null,
    photoUrl: teacher.photoUrl ?? null,
    emailVerified: !!teacher.emailVerified,
    hasPassword: teacher.passwordHash != null,
    hasGoogle: teacher.googleId != null,
  });

  const issueTokens = (teacher: Teacher) => {
    const payload = { sub: teacher.id, email: teacher.email };
    return {
      accessToken: tokenService.signAccessToken(payload),
      refreshToken: tokenService.signRefreshToken(payload),
    };
  };

  const buildAuthResponse = (teacher: Teacher): AuthResult => ({
    ...issueTokens(teacher),
    teacher: sanitizeTeacher(teacher),
  });

  const generateOtp = (): string => {
    const max = 10 ** config.otp.length;
    const num = crypto.randomInt(0, max);
    return String(num).padStart(config.otp.length, '0');
  };

  // ── Email + password ──────────────────────────────────────────────
  const signup = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResult> => {
    const normalized = normalizeEmail(email);
    const existing = await teacherRepository.findByEmailWithSecret(normalized);
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      if (existing.passwordHash) {
        throw ApiError.conflict('This email is already registered. Please log in instead.');
      }
      existing.passwordHash = passwordHash;
      if (name) existing.name = name;
      await existing.save();
      return buildAuthResponse(existing);
    }

    const teacher = await teacherRepository.create({ name, email: normalized, passwordHash });
    return buildAuthResponse(teacher);
  };

  const loginWithPassword = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthResult> => {
    const teacher = await teacherRepository.findByEmailWithSecret(normalizeEmail(email));
    if (!teacher) throw ApiError.unauthorized('Invalid email or password.');
    if (!teacher.passwordHash) {
      throw ApiError.unauthorized('No password set for this account. Use OTP or Google, or sign up to set one.');
    }
    const ok = await bcrypt.compare(password, teacher.passwordHash);
    if (!ok) throw ApiError.unauthorized('Invalid email or password.');
    return buildAuthResponse(teacher);
  };

  // ── Email OTP ─────────────────────────────────────────────────────
  const requestOtp = async ({ email }: { email: string }): Promise<{ emailSent: boolean; devCode?: string }> => {
    const normalized = normalizeEmail(email);
    const teacher = await teacherRepository.findByEmail(normalized);

    if (!teacher) {
      logger.info(`OTP requested for unregistered email ${normalized} (no code sent).`);
      return { emailSent: false };
    }

    await otpRepository.invalidateAll(normalized, 'login');
    const code = generateOtp();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + config.otp.expiresMinutes * 60 * 1000);
    await otpRepository.create({ email: normalized, codeHash, purpose: 'login', expiresAt });

    const result = await mailService.sendOtpEmail(normalized, code);
    const devCode = !config.isProduction && !result.delivered ? code : undefined;
    return { emailSent: true, devCode };
  };

  const verifyOtp = async ({ email, code }: { email: string; code: string }): Promise<AuthResult> => {
    const normalized = normalizeEmail(email);
    const record = await otpRepository.findLatestActive(normalized, 'login');
    if (!record) throw ApiError.unauthorized('Invalid or expired code. Please request a new one.');

    if (record.attempts >= config.otp.maxAttempts) {
      await otpRepository.markConsumed(record.id);
      throw ApiError.unauthorized('Too many attempts. Please request a new code.');
    }

    const ok = await bcrypt.compare(String(code), record.codeHash);
    if (!ok) {
      await otpRepository.incrementAttempts(record.id);
      throw ApiError.unauthorized('Invalid or expired code. Please request a new one.');
    }

    await otpRepository.markConsumed(record.id);

    const teacher = await teacherRepository.findByEmailWithSecret(normalized);
    if (!teacher) throw ApiError.unauthorized('Account no longer exists.');
    if (!teacher.emailVerified) {
      teacher.emailVerified = true;
      await teacher.save();
    }
    return buildAuthResponse(teacher);
  };

  // ── Google ────────────────────────────────────────────────────────
  const loginWithGoogle = async ({ idToken }: { idToken: string }): Promise<AuthResult> => {
    if (!config.google.clientId || !googleClient) {
      throw ApiError.badRequest('Google login is not configured on the server.');
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: config.google.clientId });
      payload = ticket.getPayload();
    } catch {
      throw ApiError.unauthorized('Invalid Google token.');
    }
    if (!payload || !payload.email) throw ApiError.unauthorized('Invalid Google token.');

    const googleId = payload.sub;
    const email = normalizeEmail(payload.email);
    const name = payload.name || email;
    const picture = payload.picture || null;

    let teacher = await teacherRepository.findByGoogleId(googleId);
    if (teacher) return buildAuthResponse(teacher);

    teacher = await teacherRepository.findByEmailWithSecret(email);
    if (teacher) {
      teacher.googleId = googleId;
      teacher.emailVerified = true;
      if (!teacher.photoUrl && picture) teacher.photoUrl = picture;
      await teacher.save();
      return buildAuthResponse(teacher);
    }

    teacher = await teacherRepository.create({ name, email, googleId, emailVerified: true, photoUrl: picture });
    return buildAuthResponse(teacher);
  };

  // ── Token refresh ─────────────────────────────────────────────────
  const refresh = async (refreshToken: string | undefined): Promise<AuthResult> => {
    if (!refreshToken) throw ApiError.unauthorized('Refresh token is required.');
    let decoded;
    try {
      decoded = tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }
    const teacher = await teacherRepository.findByPkWithSecret(decoded.sub);
    if (!teacher) throw ApiError.unauthorized('Account no longer exists.');
    return buildAuthResponse(teacher);
  };

  return { sanitizeTeacher, signup, loginWithPassword, requestOtp, verifyOtp, loginWithGoogle, refresh };
};

export type AuthService = ReturnType<typeof makeAuthService>;
