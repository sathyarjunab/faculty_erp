import ApiError from '../utils/ApiError';
import type { AcademicYearRepository } from '../repositories/academicYear.repository';
import type { ClassroomRepository } from '../repositories/classroom.repository';
import type { EnrollmentRepository } from '../repositories/enrollment.repository';
import type { AcademicYear } from '../models/academicYear.model';

interface ClassroomServiceDeps {
  academicYearRepository: AcademicYearRepository;
  classroomRepository: ClassroomRepository;
  enrollmentRepository: EnrollmentRepository;
}

interface ClassroomCard {
  sectionId: number;
  sectionName: string;
  classId: number | null;
  className: string | null;
  subjectCount: number;
  studentCount: number;
  isClassTeacher: boolean;
}

/**
 * Derives the teacher's classrooms (class + section cards) and the subjects
 * he teaches within each, from his teaching assignments in the active year.
 */
export const makeClassroomService = ({
  academicYearRepository,
  classroomRepository,
  enrollmentRepository,
}: ClassroomServiceDeps) => {
  const getActiveYear = async (): Promise<AcademicYear> => {
    const year = await academicYearRepository.findActive();
    if (!year) throw ApiError.notFound('No academic year configured.');
    return year;
  };

  const listClassrooms = async (teacherId: number) => {
    const year = await getActiveYear();
    const [assignments, homerooms] = await Promise.all([
      classroomRepository.findAssignmentsForTeacher(teacherId, year.id),
      classroomRepository.findHomeroomSections(teacherId, year.id),
    ]);

    const bySection = new Map<number, ClassroomCard>();
    const ensure = (section: { id: number; name: string; klass?: { id: number; name: string } | null }): ClassroomCard => {
      if (!bySection.has(section.id)) {
        bySection.set(section.id, {
          sectionId: section.id,
          sectionName: section.name,
          classId: section.klass?.id ?? null,
          className: section.klass?.name ?? null,
          subjectCount: 0,
          studentCount: 0,
          isClassTeacher: false,
        });
      }
      return bySection.get(section.id)!;
    };

    for (const a of assignments) {
      if (a.section) ensure(a.section).subjectCount += 1;
    }
    // Homeroom sections appear even when the teacher teaches no subject there.
    for (const s of homerooms) {
      ensure(s).isClassTeacher = true;
    }

    await Promise.all(
      [...bySection.values()].map(async (c) => {
        c.studentCount = await enrollmentRepository.countBySectionAndYear(c.sectionId, year.id);
      })
    );

    // Class-teacher classrooms first, then by name.
    const classrooms = [...bySection.values()].sort((a, b) => {
      if (a.isClassTeacher !== b.isClassTeacher) return a.isClassTeacher ? -1 : 1;
      return `${a.className}${a.sectionName}`.localeCompare(`${b.className}${b.sectionName}`);
    });

    return { academicYear: { id: year.id, label: year.label }, classrooms };
  };

  const listSubjects = async (teacherId: number, sectionId: number) => {
    const year = await getActiveYear();
    const assignments = await classroomRepository.findSubjectsForTeacherSection(teacherId, sectionId, year.id);

    if (!assignments.length) {
      throw ApiError.notFound('No subjects found for you in this classroom.');
    }

    const section = assignments[0].section!;
    return {
      academicYear: { id: year.id, label: year.label },
      classroom: {
        sectionId: section.id,
        sectionName: section.name,
        classId: section.klass?.id ?? null,
        className: section.klass?.name ?? null,
      },
      subjects: assignments.map((a) => ({
        assignmentId: a.id,
        subjectId: a.subject!.id,
        subjectName: a.subject!.name,
        subjectCode: a.subject!.code,
      })),
    };
  };

  return { getActiveYear, listClassrooms, listSubjects };
};

export type ClassroomService = ReturnType<typeof makeClassroomService>;
