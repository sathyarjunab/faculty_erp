import { body, ValidationChain } from 'express-validator';

export const signup: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

export const login: ValidationChain[] = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

export const requestOtp: ValidationChain[] = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
];

export const verifyOtp: ValidationChain[] = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('code').trim().notEmpty().withMessage('Code is required.'),
];

export const google: ValidationChain[] = [body('idToken').notEmpty().withMessage('Google idToken is required.')];
