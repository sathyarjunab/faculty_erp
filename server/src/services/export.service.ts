import type { MarksService } from './marks.service';

interface ExportServiceDeps {
  ExcelJS: typeof import('exceljs');
  marksService: MarksService;
}

/**
 * Builds an .xlsx workbook of a subject/exam marks sheet using ExcelJS,
 * reusing the exact data the marks API returns.
 */
export const makeExportService = ({ ExcelJS, marksService }: ExportServiceDeps) => {
  const slug = (s: string | null | undefined): string =>
    String(s || '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');

  const generateMarksExport = async (
    assignmentId: number,
    examId: number,
    teacherId: number
  ): Promise<{ buffer: Buffer; filename: string }> => {
    const sheet = await marksService.getMarksSheet(assignmentId, examId, teacherId);
    const { classroom, subject, exam, academicYear, students } = sheet;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Faculty AMS';
    workbook.created = new Date();
    const ws = workbook.addWorksheet('Marks');

    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = 'Faculty Academic Management System — Marks Report';
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    const meta: [string, string][] = [
      ['Class', `${classroom.className || ''} - ${classroom.sectionName || ''}`],
      ['Subject', `${subject.subjectName} (${subject.subjectCode})`],
      ['Exam', `${exam.name} (Max: ${exam.maxMarks})`],
      ['Academic Year', academicYear.label],
    ];
    let row = 3;
    meta.forEach(([label, value]) => {
      ws.getCell(`A${row}`).value = label;
      ws.getCell(`A${row}`).font = { bold: true };
      ws.getCell(`B${row}`).value = value;
      row += 1;
    });

    const headerRowIndex = row + 1;
    const headers = ['Roll No', 'Student Name', 'Marks', 'Max Marks', 'Percentage', 'Grade', 'Status'];
    const headerRow = ws.getRow(headerRowIndex);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = { bottom: { style: 'thin' } };
    });

    students.forEach((s) => {
      const displayScore: string | number = s.isAbsent ? 'AB' : s.score ?? '';
      ws.addRow([
        s.rollNo,
        s.studentName,
        displayScore,
        exam.maxMarks,
        s.percentage ?? '',
        s.grade ?? '',
        s.status ?? 'Not entered',
      ]);
    });

    ws.columns = [
      { width: 14 },
      { width: 28 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
      { width: 8 },
      { width: 14 },
    ];

    const raw = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(raw as unknown as ArrayBuffer);
    const filename = `marks_${slug(classroom.className)}_${slug(classroom.sectionName)}_${slug(
      subject.subjectName
    )}_${slug(exam.name)}.xlsx`;

    return { buffer, filename };
  };

  return { generateMarksExport };
};

export type ExportService = ReturnType<typeof makeExportService>;
