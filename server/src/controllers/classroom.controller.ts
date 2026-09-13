import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import type { ClassroomService } from '../services/classroom.service';

export const makeClassroomController = ({ classroomService }: { classroomService: ClassroomService }) => {
  const listClassrooms = asyncHandler(async (req, res) => {
    const data = await classroomService.listClassrooms(req.user!.id);
    sendSuccess(res, { message: 'OK', data });
  });

  const listSubjects = asyncHandler(async (req, res) => {
    const sectionId = Number(req.params.sectionId);
    const data = await classroomService.listSubjects(req.user!.id, sectionId);
    sendSuccess(res, { message: 'OK', data });
  });

  return { listClassrooms, listSubjects };
};

export type ClassroomController = ReturnType<typeof makeClassroomController>;
