import { Includeable, Order } from 'sequelize';
import { makeBaseRepository } from './baseRepository';
import type { DbModels } from '../models/registry';
import type { TeachingAssignment } from '../models/teachingAssignment.model';
import type { Section } from '../models/section.model';

/**
 * Reads a teacher's teaching assignments and the classrooms/subjects
 * derived from them. TeachingAssignment is the linchpin table.
 */
export const makeClassroomRepository = ({ TeachingAssignment, Section, Class, Subject }: DbModels) => {
  const base = makeBaseRepository(TeachingAssignment);

  const withRefs: Includeable[] = [
    { model: Section, as: 'section', include: [{ model: Class, as: 'klass' }] },
    { model: Subject, as: 'subject' },
  ];

  const order: Order = [
    [{ model: Section, as: 'section' }, { model: Class, as: 'klass' }, 'name', 'ASC'],
    [{ model: Section, as: 'section' }, 'name', 'ASC'],
    [{ model: Subject, as: 'subject' }, 'name', 'ASC'],
  ];

  return {
    ...base,

    findAssignmentsForTeacher: (teacherId: number, academicYearId: number): Promise<TeachingAssignment[]> =>
      TeachingAssignment.findAll({ where: { teacherId, academicYearId }, include: withRefs, order }),

    findAssignmentByIdForTeacher: (id: number, teacherId: number): Promise<TeachingAssignment | null> =>
      TeachingAssignment.findOne({ where: { id, teacherId }, include: withRefs }),

    findSubjectsForTeacherSection: (
      teacherId: number,
      sectionId: number,
      academicYearId: number
    ): Promise<TeachingAssignment[]> =>
      TeachingAssignment.findAll({
        where: { teacherId, sectionId, academicYearId },
        include: withRefs,
        order: [[{ model: Subject, as: 'subject' }, 'name', 'ASC']],
      }),

    /** Sections this teacher is the class teacher (homeroom) of, in the given year. */
    findHomeroomSections: (teacherId: number, academicYearId: number): Promise<Section[]> =>
      Section.findAll({
        where: { classTeacherId: teacherId },
        include: [{ model: Class, as: 'klass', where: { academicYearId }, required: true }],
        order: [
          [{ model: Class, as: 'klass' }, 'name', 'ASC'],
          ['name', 'ASC'],
        ],
      }),

    /** A single section (with class) if this teacher is its class teacher. */
    findHomeroomSectionById: (sectionId: number, teacherId: number): Promise<Section | null> =>
      Section.findOne({
        where: { id: sectionId, classTeacherId: teacherId },
        include: [{ model: Class, as: 'klass' }],
      }),
  };
};

export type ClassroomRepository = ReturnType<typeof makeClassroomRepository>;
