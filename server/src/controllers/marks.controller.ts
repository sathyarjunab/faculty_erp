import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import type { MarksService } from '../services/marks.service';
import type { ExportService } from '../services/export.service';

interface MarksControllerDeps {
  marksService: MarksService;
  exportService: ExportService;
}

export const makeMarksController = ({ marksService, exportService }: MarksControllerDeps) => {
  const listExams = asyncHandler(async (req, res) => {
    const assignmentId = Number(req.params.assignmentId);
    const data = await marksService.listExams(assignmentId, req.user!.id);
    sendSuccess(res, { message: 'OK', data });
  });

  const getMarksSheet = asyncHandler(async (req, res) => {
    const assignmentId = Number(req.query.assignmentId);
    const examId = Number(req.query.examId);
    const data = await marksService.getMarksSheet(assignmentId, examId, req.user!.id);
    sendSuccess(res, { message: 'OK', data });
  });

  const saveMarks = asyncHandler(async (req, res) => {
    const { assignmentId, examId, entries } = req.body;
    const data = await marksService.saveMarks(Number(assignmentId), Number(examId), req.user!.id, entries);
    sendSuccess(res, { message: `Marks saved (${data.created} created, ${data.updated} updated).`, data });
  });

  const exportMarks = asyncHandler(async (req, res) => {
    const assignmentId = Number(req.query.assignmentId);
    const examId = Number(req.query.examId);
    const { buffer, filename } = await exportService.generateMarksExport(assignmentId, examId, req.user!.id);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  });

  return { listExams, getMarksSheet, saveMarks, exportMarks };
};

export type MarksController = ReturnType<typeof makeMarksController>;
