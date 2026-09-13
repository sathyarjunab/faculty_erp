export interface Teacher {
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
  teacher: Teacher;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AcademicYearRef {
  id: number;
  label: string;
}

export interface Classroom {
  sectionId: number;
  sectionName: string;
  classId: number | null;
  className: string | null;
  subjectCount: number;
  studentCount: number;
  isClassTeacher: boolean;
}

export interface ClassroomsResponse {
  academicYear: AcademicYearRef;
  classrooms: Classroom[];
}

export interface ClassroomRef {
  sectionId: number;
  sectionName: string;
  classId: number | null;
  className: string | null;
}

export interface SubjectItem {
  assignmentId: number;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
}

export interface SubjectsResponse {
  academicYear: AcademicYearRef;
  classroom: ClassroomRef;
  subjects: SubjectItem[];
}

export interface Exam {
  id: number;
  name: string;
  sequence: number;
  maxMarks: number;
}

export interface ExamsResponse {
  classroom: ClassroomRef;
  subject: SubjectItem;
  exams: Exam[];
}

export type MarkStatus = 'Pass' | 'Fail' | 'Absent' | null;

export interface StudentMark {
  enrollmentId: number;
  studentId: number | null;
  rollNo: string;
  studentName: string | null;
  markId: number | null;
  score: number | null;
  isAbsent: boolean;
  percentage: number | null;
  grade: string | null;
  status: MarkStatus;
}

export interface MarksSheet {
  academicYear: AcademicYearRef;
  classroom: ClassroomRef;
  subject: SubjectItem;
  exam: Exam;
  students: StudentMark[];
}

export interface SaveMarksResult extends MarksSheet {
  created: number;
  updated: number;
}

export interface MarkEntryInput {
  enrollmentId: number;
  score?: number | null;
  isAbsent?: boolean;
}

export interface DashboardKpis {
  classrooms: number;
  subjects: number;
  students: number;
  averagePercentage: number | null;
  passPercentage: number | null;
  pendingEntries: number;
  totalExamSlots: number;
}

export interface DashboardSummary {
  academicYear: AcademicYearRef;
  kpis: DashboardKpis;
}

export interface LabeledValue {
  label: string | null;
  averagePercentage: number | null;
}

export interface ExamTrendPoint {
  examName: string;
  averagePercentage: number | null;
}

export interface GradeBucket {
  grade: string;
  count: number;
}

export interface DashboardAnalytics {
  academicYear: AcademicYearRef;
  sectionPerformance: LabeledValue[];
  subjectPerformance: LabeledValue[];
  examTrend: ExamTrendPoint[];
  passFail: { pass: number; fail: number; absent: number };
  gradeDistribution: GradeBucket[];
}

export interface ScoreChangeLogEntry {
  id: number;
  studentName: string | null;
  rollNo: string | null;
  subjectName: string | null;
  examName: string | null;
  oldScore: number | null;
  newScore: number | null;
  oldIsAbsent: boolean | null;
  newIsAbsent: boolean | null;
  action: 'create' | 'update';
  createdAt: string;
  changedBy: string | null;
  isOwnEdit: boolean;
}

export interface HomeroomItem {
  sectionId: number;
  sectionName: string;
  classId: number | null;
  className: string | null;
  studentCount: number;
}

export interface HomeroomsResponse {
  academicYear: AcademicYearRef;
  homerooms: HomeroomItem[];
}

export interface HomeroomAnalytics {
  academicYear: AcademicYearRef;
  classroom: ClassroomRef;
  kpis: {
    students: number;
    subjects: number;
    averagePercentage: number | null;
    passPercentage: number | null;
  };
  subjectPerformance: LabeledValue[];
  examTrend: ExamTrendPoint[];
  passFail: { pass: number; fail: number; absent: number };
  gradeDistribution: GradeBucket[];
}
