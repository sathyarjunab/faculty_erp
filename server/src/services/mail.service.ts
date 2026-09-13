import type nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { AppConfig } from '../config/env';
import type { Logger } from '../utils/logger';

interface MailServiceDeps {
  config: AppConfig;
  nodemailer: typeof nodemailer;
  logger: Logger;
}

/**
 * Email sender. If no SMTP host is configured (typical in local dev),
 * OTP codes are logged to the console instead of being emailed, so the
 * app is fully usable without any mail provider.
 */
export const makeMailService = ({ config, nodemailer: mailer, logger }: MailServiceDeps) => {
  let transporter: Transporter | null = null;

  if (config.smtp.host) {
    transporter = mailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.password } : undefined,
    });
  }

  const sendOtpEmail = async (to: string, code: string): Promise<{ delivered: boolean }> => {
    const minutes = config.otp.expiresMinutes;
    const subject = 'Your Faculty AMS login code';
    const text = `Your one-time login code is ${code}. It expires in ${minutes} minutes.`;
    const html = `<p>Your one-time login code is <strong style="font-size:20px">${code}</strong>.</p>
                  <p>It expires in ${minutes} minutes. If you didn't request this, you can ignore this email.</p>`;

    if (!transporter) {
      logger.warn(`[MAIL:DEV] OTP for ${to} => ${code} (no SMTP configured; not emailed)`);
      return { delivered: false };
    }

    await transporter.sendMail({ from: config.smtp.from, to, subject, text, html });
    logger.info(`OTP email sent to ${to}`);
    return { delivered: true };
  };

  return { sendOtpEmail };
};

export type MailService = ReturnType<typeof makeMailService>;
