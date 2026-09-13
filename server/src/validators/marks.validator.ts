import { body, query, param, ValidationChain } from 'express-validator';

export const assignmentParam: ValidationChain[] = [
  param('assignmentId').isInt({ min: 1 }).withMessage('Valid assignmentId is required.'),
];

export const sheetQuery: ValidationChain[] = [
  query('assignmentId').isInt({ min: 1 }).withMessage('Valid assignmentId is required.'),
  query('examId').isInt({ min: 1 }).withMessage('Valid examId is required.'),
];

export const saveMarks: ValidationChain[] = [
  body('assignmentId').isInt({ min: 1 }).withMessage('Valid assignmentId is required.'),
  body('examId').isInt({ min: 1 }).withMessage('Valid examId is required.'),
  body('entries').isArray({ min: 1 }).withMessage('entries must be a non-empty array.'),
  body('entries.*.enrollmentId').isInt({ min: 1 }).withMessage('Each entry needs a valid enrollmentId.'),
  body('entries.*.score')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Score must be a non-negative number.'),
  body('entries.*.isAbsent').optional().isBoolean().withMessage('isAbsent must be a boolean.'),
];
