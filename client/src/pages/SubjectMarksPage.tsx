import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Alert,
  Stack,
  Button,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Chip,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import { marksApi } from '../api/marks.api';
import { getErrorMessage } from '../api/client';
import type { ClassroomRef, SubjectItem, Exam, StudentMark } from '../types';
import Loading from '../components/Loading';

interface RowState {
  enrollmentId: number;
  rollNo: string;
  studentName: string | null;
  scoreInput: string;
  isAbsent: boolean;
}

const BANDS: [string, number][] = [
  ['A+', 90],
  ['A', 80],
  ['B', 70],
  ['C', 60],
  ['D', 40],
  ['F', 0],
];

type RowEval = { percentage: number | null; grade: string | null; status: string | null };

const evaluate = (scoreInput: string, isAbsent: boolean, max: number): RowEval => {
  if (isAbsent) return { percentage: null, grade: null, status: 'Absent' };
  if (scoreInput.trim() === '') return { percentage: null, grade: null, status: null };
  const score = Number(scoreInput);
  if (Number.isNaN(score) || score < 0 || score > max) return { percentage: null, grade: null, status: 'Invalid' };
  const pct = Math.round((score / max) * 10000) / 100;
  const grade = BANDS.find(([, m]) => pct >= m)?.[0] ?? 'F';
  return { percentage: pct, grade, status: pct >= 40 ? 'Pass' : 'Fail' };
};

const statusColor = (status: string | null): 'success' | 'error' | 'default' | 'warning' => {
  if (status === 'Pass') return 'success';
  if (status === 'Fail') return 'error';
  if (status === 'Invalid') return 'warning';
  return 'default';
};

const toRow = (s: StudentMark): RowState => ({
  enrollmentId: s.enrollmentId,
  rollNo: s.rollNo,
  studentName: s.studentName,
  scoreInput: s.isAbsent ? '' : s.score === null ? '' : String(s.score),
  isAbsent: s.isAbsent,
});

const SubjectMarksPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const aid = Number(assignmentId);

  const [classroom, setClassroom] = useState<ClassroomRef | null>(null);
  const [subject, setSubject] = useState<SubjectItem | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState<number | ''>('');
  const [rows, setRows] = useState<RowState[]>([]);

  const [loading, setLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const selectedExam = exams.find((e) => e.id === examId) ?? null;
  const maxMarks = selectedExam?.maxMarks ?? 0;

  // Load exams + header info
  useEffect(() => {
    (async () => {
      try {
        const res = await marksApi.exams(aid);
        setClassroom(res.classroom);
        setSubject(res.subject);
        setExams(res.exams);
        if (res.exams.length) setExamId(res.exams[0].id);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load exams.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [aid]);

  // Load sheet whenever the selected exam changes
  const loadSheet = useCallback(
    async (exam: number) => {
      setSheetLoading(true);
      setError('');
      try {
        const sheet = await marksApi.sheet(aid, exam);
        setRows(sheet.students.map(toRow));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load marks.'));
      } finally {
        setSheetLoading(false);
      }
    },
    [aid]
  );

  useEffect(() => {
    if (examId !== '') loadSheet(examId);
  }, [examId, loadSheet]);

  const updateRow = (enrollmentId: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, ...patch } : r)));
  };

  const hasInvalid = rows.some((r) => evaluate(r.scoreInput, r.isAbsent, maxMarks).status === 'Invalid');

  const handleSave = async () => {
    if (examId === '' || hasInvalid) return;
    setSaving(true);
    setError('');
    try {
      const entries = rows.map((r) => ({
        enrollmentId: r.enrollmentId,
        isAbsent: r.isAbsent,
        score: r.isAbsent || r.scoreInput.trim() === '' ? null : Number(r.scoreInput),
      }));
      const result = await marksApi.save({ assignmentId: aid, examId, entries });
      setRows(result.students.map(toRow));
      setToast(`Saved — ${result.created} created, ${result.updated} updated.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save marks.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (examId === '') return;
    setDownloading(true);
    try {
      const blob = await marksApi.exportBlob(aid, examId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marks_${classroom?.className ?? ''}_${classroom?.sectionName ?? ''}_${subject?.subjectName ?? ''}_${selectedExam?.name ?? ''}.xlsx`.replace(
        /\s+/g,
        '_'
      );
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to export.'));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Loading label="Loading…" />;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component="button" onClick={() => navigate('/classrooms')} underline="hover">
          Classrooms
        </Link>
        {classroom && (
          <Link component="button" onClick={() => navigate(`/classrooms/${classroom.sectionId}`)} underline="hover">
            {classroom.className} - {classroom.sectionName}
          </Link>
        )}
        <Typography color="text.primary">{subject?.subjectName}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => classroom && navigate(`/classrooms/${classroom.sectionId}`)}>
          Back
        </Button>
        <Typography variant="h4">
          {subject?.subjectName}{' '}
          <Typography component="span" variant="h6" color="text.secondary">
            ({classroom?.className} - {classroom?.sectionName})
          </Typography>
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            useFlexGap
            flexWrap="wrap"
            sx={{ mb: 2 }}
            alignItems={{ sm: 'center' }}
          >
            <TextField
              select
              label="Exam type"
              value={examId}
              onChange={(e) => setExamId(Number(e.target.value))}
              sx={{ minWidth: 220 }}
              disabled={exams.length === 0}
            >
              {exams.map((ex) => (
                <MenuItem key={ex.id} value={ex.id}>
                  {ex.name} (max {ex.maxMarks})
                </MenuItem>
              ))}
            </TextField>
            {selectedExam && <Chip label={`Max marks: ${selectedExam.maxMarks}`} color="primary" variant="outlined" />}
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              startIcon={downloading ? <CircularProgress size={18} /> : <DownloadIcon />}
              onClick={handleDownload}
              disabled={examId === '' || rows.length === 0 || downloading}
            >
              Export Excel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={examId === '' || rows.length === 0 || hasInvalid || saving}
            >
              Save all
            </Button>
          </Stack>

          {exams.length === 0 && <Alert severity="info">No exams are defined for this class yet.</Alert>}

          {hasInvalid && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Some scores are out of range (0–{maxMarks}). Fix them to enable saving.
            </Alert>
          )}

          {sheetLoading ? (
            <Loading label="Loading students…" />
          ) : (
            rows.length > 0 && (
              <Box
                sx={{
                  overflowX: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Table
                  size="small"
                  stickyHeader
                  sx={{
                    '& tbody tr:nth-of-type(even)': { backgroundColor: '#f8fafc' },
                    '& tbody tr:hover': { backgroundColor: 'rgba(30,58,95,0.06)' },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Roll No</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell width={140}>Marks (/{maxMarks})</TableCell>
                      <TableCell align="center">Absent</TableCell>
                      <TableCell align="right">%</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r) => {
                      const ev = evaluate(r.scoreInput, r.isAbsent, maxMarks);
                      const invalid = ev.status === 'Invalid';
                      return (
                        <TableRow key={r.enrollmentId} hover>
                          <TableCell>{r.rollNo}</TableCell>
                          <TableCell>{r.studentName ?? '—'}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={r.scoreInput}
                              disabled={r.isAbsent}
                              error={invalid}
                              onChange={(e) => updateRow(r.enrollmentId, { scoreInput: e.target.value })}
                              inputProps={{ min: 0, max: maxMarks, step: 'any', style: { width: 90 } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={r.isAbsent}
                              onChange={(e) =>
                                updateRow(r.enrollmentId, {
                                  isAbsent: e.target.checked,
                                  scoreInput: e.target.checked ? '' : r.scoreInput,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell align="right">{ev.percentage === null ? '—' : `${ev.percentage}%`}</TableCell>
                          <TableCell>{ev.grade ?? '—'}</TableCell>
                          <TableCell>
                            {ev.status ? (
                              <Chip size="small" label={ev.status} color={statusColor(ev.status)} variant="outlined" />
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default SubjectMarksPage;
