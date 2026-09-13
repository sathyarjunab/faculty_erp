import type { AppConfig } from '../config/env';

export interface GradeResult {
  percentage: number | null;
  grade: string | null;
  status: 'Pass' | 'Fail' | 'Absent' | null;
}

interface EvaluateInput {
  score: number | null | undefined;
  maxMarks: number | null | undefined;
  isAbsent: boolean;
}

/**
 * Pure grading logic derived from config bands + pass percentage.
 * evaluate() turns a raw score into { percentage, grade, status }.
 */
export const makeGradeService = ({ config }: { config: AppConfig }) => {
  const { passPercentage, bands } = config.grading;

  const gradeFor = (percentage: number): string => {
    const band = bands.find((b) => percentage >= b.min);
    return band ? band.grade : 'F';
  };

  const round2 = (n: number): number => Math.round(n * 100) / 100;

  const evaluate = ({ score, maxMarks, isAbsent }: EvaluateInput): GradeResult => {
    if (isAbsent) return { percentage: null, grade: null, status: 'Absent' };
    if (score === null || score === undefined || !maxMarks) {
      return { percentage: null, grade: null, status: null };
    }
    const percentage = round2((Number(score) / Number(maxMarks)) * 100);
    return {
      percentage,
      grade: gradeFor(percentage),
      status: percentage >= passPercentage ? 'Pass' : 'Fail',
    };
  };

  return { evaluate, gradeFor, passPercentage };
};

export type GradeService = ReturnType<typeof makeGradeService>;
