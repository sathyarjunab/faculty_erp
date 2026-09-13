import ApiError from '../utils/ApiError';
import type { AppConfig } from '../config/env';
import type { AcademicYearRepository } from '../repositories/academicYear.repository';
import type { ClassroomRepository } from '../repositories/classroom.repository';
import type { EnrollmentRepository } from '../repositories/enrollment.repository';
import type { ExamRepository } from '../repositories/exam.repository';
import type { MarkRepository } from '../repositories/mark.repository';
import type { ScoreChangeLogRepository } from '../repositories/scoreChangeLog.repository';
import type { GradeService, GradeResult } from './grade.service';
import type { AcademicYear } from '../models/academicYear.model';
import type { StudentEnrollment } from '../models/studentEnrollment.model';
import type { Exam } from '../models/exam.model';
import type { Subject } from '../models/subject.model';

interface SubjectRepositoryLike {
  findAll: (options?: object) => Promise<Subject[]>;
}

interface DashboardServiceDeps {
  academicYearRepository: AcademicYearRepository;
  classroomRepository: ClassroomRepository;
  enrollmentRepository: EnrollmentRepository;
  examRepository: ExamRepository;
  markRepository: MarkRepository;
  scoreChangeLogRepository: ScoreChangeLogRepository;
  subjectRepository: SubjectRepositoryLike;
  gradeService: GradeService;
  config: AppConfig;
}

interface EvaluatedMark {
  sectionId: number;
  classId: number | undefined;
  className: string | null;
  sectionName: string | null;
  subjectId: number;
  subjectName: string | null;
  examName: string;
  sequence: number;
  percentage: number | null;
  grade: string | null;
  status: GradeResult['status'];
}

interface CollectResult {
  evaluated: EvaluatedMark[];
  expectedSlots: number;
  enteredSlots: number;
  classroomCount: number;
  subjectCount: number;
  studentCount: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const avg = (nums: number[]): number | null => (nums.length ? round2(nums.reduce((a, b) => a + b, 0) / nums.length) : null);

/**
 * Dashboard analytics + score-change log, all scoped to the teacher's own
 * assignments in the active academic year.
 */
export const makeDashboardService = ({
  academicYearRepository,
  classroomRepository,
  enrollmentRepository,
  examRepository,
  markRepository,
  scoreChangeLogRepository,
  subjectRepository,
  gradeService,
  config,
}: DashboardServiceDeps) => {
  const getActiveYear = async (): Promise<AcademicYear> => {
    const year = await academicYearRepository.findActive();
    if (!year) throw ApiError.notFound('No academic year configured.');
    return year;
  };

  const collect = async (teacherId: number, year: AcademicYear): Promise<CollectResult> => {
    const assignments = await classroomRepository.findAssignmentsForTeacher(teacherId, year.id);
    const sectionCache = new Map<number, StudentEnrollment[]>();
    const classExamCache = new Map<number, Exam[]>();
    const evaluated: EvaluatedMark[] = [];
    let expectedSlots = 0;
    let enteredSlots = 0;

    for (const a of assignments) {
      const sectionId = a.sectionId;
      const classId = a.section?.klass?.id;

      if (!sectionCache.has(sectionId)) {
        sectionCache.set(sectionId, await enrollmentRepository.findBySectionAndYear(sectionId, year.id));
      }
      if (classId !== undefined && !classExamCache.has(classId)) {
        classExamCache.set(classId, await examRepository.findByClassAndYear(classId, year.id));
      }

      const enrollments = sectionCache.get(sectionId) || [];
      const exams = classId !== undefined ? classExamCache.get(classId) || [] : [];
      const enrollmentIds = enrollments.map((e) => e.id);
      const examIds = exams.map((e) => e.id);

      expectedSlots += enrollments.length * exams.length;
      if (!enrollmentIds.length || !examIds.length) continue;

      const marks = await markRepository.findByScope({ subjectIds: [a.subjectId], examIds, enrollmentIds });
      const examById = new Map(exams.map((e) => [e.id, e]));

      for (const m of marks) {
        const exam = examById.get(m.examId);
        if (!exam) continue;
        if (m.score !== null || m.isAbsent) enteredSlots += 1;
        const result = gradeService.evaluate({ score: m.score, maxMarks: exam.maxMarks, isAbsent: m.isAbsent });
        evaluated.push({
          sectionId,
          classId,
          className: a.section?.klass?.name ?? null,
          sectionName: a.section?.name ?? null,
          subjectId: a.subjectId,
          subjectName: a.subject?.name ?? null,
          examName: exam.name,
          sequence: exam.sequence,
          percentage: result.percentage,
          grade: result.grade,
          status: result.status,
        });
      }
    }

    const subjectIds = new Set(assignments.map((a) => a.subjectId));
    const studentCount = [...sectionCache.values()].reduce((sum, list) => sum + list.length, 0);

    return {
      evaluated,
      expectedSlots,
      enteredSlots,
      classroomCount: sectionCache.size,
      subjectCount: subjectIds.size,
      studentCount,
    };
  };

  const getSummary = async (teacherId: number) => {
    const year = await getActiveYear();
    const data = await collect(teacherId, year);

    const scored = data.evaluated.filter((e) => e.percentage !== null) as (EvaluatedMark & { percentage: number })[];
    const graded = data.evaluated.filter((e) => e.status === 'Pass' || e.status === 'Fail');
    const passCount = graded.filter((e) => e.status === 'Pass').length;

    return {
      academicYear: { id: year.id, label: year.label },
      kpis: {
        classrooms: data.classroomCount,
        subjects: data.subjectCount,
        students: data.studentCount,
        averagePercentage: avg(scored.map((e) => e.percentage)),
        passPercentage: graded.length ? round2((passCount / graded.length) * 100) : null,
        pendingEntries: Math.max(data.expectedSlots - data.enteredSlots, 0),
        totalExamSlots: data.expectedSlots,
      },
    };
  };

  const getAnalytics = async (teacherId: number) => {
    const year = await getActiveYear();
    const data = await collect(teacherId, year);
    const scored = data.evaluated.filter((e) => e.percentage !== null) as (EvaluatedMark & { percentage: number })[];

    const sectionMap = new Map<number, { label: string; values: number[] }>();
    for (const e of scored) {
      if (!sectionMap.has(e.sectionId)) sectionMap.set(e.sectionId, { label: `${e.className} - ${e.sectionName}`, values: [] });
      sectionMap.get(e.sectionId)!.values.push(e.percentage);
    }
    const sectionPerformance = [...sectionMap.values()].map((s) => ({ label: s.label, averagePercentage: avg(s.values) }));

    const subjectMap = new Map<number, { label: string | null; values: number[] }>();
    for (const e of scored) {
      if (!subjectMap.has(e.subjectId)) subjectMap.set(e.subjectId, { label: e.subjectName, values: [] });
      subjectMap.get(e.subjectId)!.values.push(e.percentage);
    }
    const subjectPerformance = [...subjectMap.values()].map((s) => ({ label: s.label, averagePercentage: avg(s.values) }));

    const examMap = new Map<string, { name: string; sequence: number; values: number[] }>();
    for (const e of scored) {
      if (!examMap.has(e.examName)) examMap.set(e.examName, { name: e.examName, sequence: e.sequence, values: [] });
      examMap.get(e.examName)!.values.push(e.percentage);
    }
    const examTrend = [...examMap.values()]
      .sort((a, b) => a.sequence - b.sequence)
      .map((e) => ({ examName: e.name, averagePercentage: avg(e.values) }));

    const passFail = {
      pass: data.evaluated.filter((e) => e.status === 'Pass').length,
      fail: data.evaluated.filter((e) => e.status === 'Fail').length,
      absent: data.evaluated.filter((e) => e.status === 'Absent').length,
    };

    const order = config.grading.bands.map((b) => b.grade);
    const gradeCounts: Record<string, number> = Object.fromEntries(order.map((g) => [g, 0]));
    for (const e of scored) if (e.grade && e.grade in gradeCounts) gradeCounts[e.grade] += 1;
    const gradeDistribution = order.map((g) => ({ grade: g, count: gradeCounts[g] }));

    return {
      academicYear: { id: year.id, label: year.label },
      sectionPerformance,
      subjectPerformance,
      examTrend,
      passFail,
      gradeDistribution,
    };
  };

  /** Enrollment ids for all of this teacher's homeroom sections (active year). */
  const homeroomEnrollmentIds = async (teacherId: number, year: AcademicYear): Promise<number[]> => {
    const homerooms = await classroomRepository.findHomeroomSections(teacherId, year.id);
    const ids: number[] = [];
    for (const s of homerooms) {
      const ens = await enrollmentRepository.findBySectionAndYear(s.id, year.id);
      for (const e of ens) ids.push(e.id);
    }
    return ids;
  };

  const getLogs = async (
    teacherId: number,
    { page = 1, limit = 20 }: { page?: number | string; limit?: number | string } = {}
  ) => {
    const year = await getActiveYear();
    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
    const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const enrollmentIds = await homeroomEnrollmentIds(teacherId, year);
    const { rows, count } = await scoreChangeLogRepository.findVisibleForTeacher(
      { teacherId, homeroomEnrollmentIds: enrollmentIds },
      { limit: safeLimit, offset }
    );

    const logs = rows.map((log) => ({
      id: Number(log.id),
      studentName: log.enrollment?.student?.name ?? null,
      rollNo: log.enrollment?.rollNo ?? null,
      subjectName: log.subject?.name ?? null,
      examName: log.exam?.name ?? null,
      oldScore: log.oldScore,
      newScore: log.newScore,
      oldIsAbsent: log.oldIsAbsent,
      newIsAbsent: log.newIsAbsent,
      action: log.action,
      createdAt: log.createdAt,
      changedBy: log.teacher?.name ?? null,
      isOwnEdit: log.teacherId === teacherId,
    }));

    return {
      logs,
      meta: { page: safePage, limit: safeLimit, total: count, totalPages: Math.ceil(count / safeLimit) || 1 },
    };
  };

  // ── Homeroom (class-teacher) whole-class analytics ──────────────────
  const getHomerooms = async (teacherId: number) => {
    const year = await getActiveYear();
    const homerooms = await classroomRepository.findHomeroomSections(teacherId, year.id);
    const list = await Promise.all(
      homerooms.map(async (s) => ({
        sectionId: s.id,
        sectionName: s.name,
        classId: s.klass?.id ?? null,
        className: s.klass?.name ?? null,
        studentCount: await enrollmentRepository.countBySectionAndYear(s.id, year.id),
      }))
    );
    return { academicYear: { id: year.id, label: year.label }, homerooms: list };
  };

  const getHomeroomAnalytics = async (teacherId: number, sectionId: number) => {
    const year = await getActiveYear();
    const section = await classroomRepository.findHomeroomSectionById(sectionId, teacherId);
    if (!section) throw ApiError.notFound('You are not the class teacher of this section.');
    const classId = section.klass?.id;
    if (!classId) throw ApiError.internal('Section is missing its class reference.');

    const [enrollments, exams, subjects] = await Promise.all([
      enrollmentRepository.findBySectionAndYear(sectionId, year.id),
      examRepository.findByClassAndYear(classId, year.id),
      subjectRepository.findAll(),
    ]);
    const enrollmentIds = enrollments.map((e) => e.id);
    const examIds = exams.map((e) => e.id);
    const examById = new Map(exams.map((e) => [e.id, e]));
    const subjectName = new Map(subjects.map((s) => [s.id, s.name]));

    const marks = enrollmentIds.length && examIds.length
      ? await markRepository.findForEnrollmentsAndExams(enrollmentIds, examIds)
      : [];

    interface Row {
      subjectId: number;
      examName: string;
      sequence: number;
      percentage: number | null;
      grade: string | null;
      status: GradeResult['status'];
    }
    const evaluated: Row[] = [];
    for (const m of marks) {
      const exam = examById.get(m.examId);
      if (!exam) continue;
      const r = gradeService.evaluate({ score: m.score, maxMarks: exam.maxMarks, isAbsent: m.isAbsent });
      evaluated.push({
        subjectId: m.subjectId,
        examName: exam.name,
        sequence: exam.sequence,
        percentage: r.percentage,
        grade: r.grade,
        status: r.status,
      });
    }
    const scored = evaluated.filter((e) => e.percentage !== null) as (Row & { percentage: number })[];
    const graded = evaluated.filter((e) => e.status === 'Pass' || e.status === 'Fail');
    const passCount = graded.filter((e) => e.status === 'Pass').length;

    // Subject performance
    const subjMap = new Map<number, number[]>();
    for (const e of scored) {
      if (!subjMap.has(e.subjectId)) subjMap.set(e.subjectId, []);
      subjMap.get(e.subjectId)!.push(e.percentage);
    }
    const subjectPerformance = [...subjMap.entries()].map(([sid, vals]) => ({
      label: subjectName.get(sid) ?? `Subject ${sid}`,
      averagePercentage: avg(vals),
    }));

    // Exam trend
    const examMap = new Map<string, { name: string; sequence: number; values: number[] }>();
    for (const e of scored) {
      if (!examMap.has(e.examName)) examMap.set(e.examName, { name: e.examName, sequence: e.sequence, values: [] });
      examMap.get(e.examName)!.values.push(e.percentage);
    }
    const examTrend = [...examMap.values()]
      .sort((a, b) => a.sequence - b.sequence)
      .map((e) => ({ examName: e.name, averagePercentage: avg(e.values) }));

    // Grade distribution
    const order = config.grading.bands.map((b) => b.grade);
    const gradeCounts: Record<string, number> = Object.fromEntries(order.map((g) => [g, 0]));
    for (const e of scored) if (e.grade && e.grade in gradeCounts) gradeCounts[e.grade] += 1;
    const gradeDistribution = order.map((g) => ({ grade: g, count: gradeCounts[g] }));

    return {
      academicYear: { id: year.id, label: year.label },
      classroom: {
        sectionId: section.id,
        sectionName: section.name,
        classId,
        className: section.klass?.name ?? null,
      },
      kpis: {
        students: enrollments.length,
        subjects: subjMap.size,
        averagePercentage: avg(scored.map((e) => e.percentage)),
        passPercentage: graded.length ? round2((passCount / graded.length) * 100) : null,
      },
      subjectPerformance,
      examTrend,
      passFail: {
        pass: evaluated.filter((e) => e.status === 'Pass').length,
        fail: evaluated.filter((e) => e.status === 'Fail').length,
        absent: evaluated.filter((e) => e.status === 'Absent').length,
      },
      gradeDistribution,
    };
  };

  return { getSummary, getAnalytics, getLogs, getHomerooms, getHomeroomAnalytics };
};

export type DashboardService = ReturnType<typeof makeDashboardService>;
