import { body, ValidationChain } from 'express-validator';

export const updateProfile: ValidationChain[] = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('dept').optional({ nullable: true }).trim(),
  body('photoUrl').optional({ nullable: true }).trim(),
];

export const changePassword: ValidationChain[] = [
  body('currentPassword').optional(),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
];
