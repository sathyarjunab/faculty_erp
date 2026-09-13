import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Alert,
} from '@mui/material';
import ClassIcon from '@mui/icons-material/ClassOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import PercentIcon from '@mui/icons-material/Percent';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardApi } from '../api/dashboard.api';
import { getErrorMessage } from '../api/client';
import type { DashboardSummary, DashboardAnalytics, ScoreChangeLogEntry, PaginationMeta } from '../types';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import Loading from '../components/Loading';
import HomeroomPanel from '../components/HomeroomPanel';

const PIE_COLORS = { pass: '#1f9254', fail: '#d64545', absent: '#9aa7b8' };
const GRADE_COLORS = ['#1f9254', '#3fa66a', '#8bc34a', '#e0b21e', '#e08a1e', '#d64545'];
const BAR_COLOR = '#1e3a5f';
const LINE_COLOR = '#e08a1e';

const fmtPct = (n: number | null) => (n === null ? '—' : `${n}%`);

const scoreLabel = (score: number | null, absent: boolean | null) =>
  absent ? 'Absent' : score === null ? '—' : String(score);

const DashboardPage = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [logs, setLogs] = useState<ScoreChangeLogEntry[]>([]);
  const [logMeta, setLogMeta] = useState<PaginationMeta | null>(null);
  const [logPage, setLogPage] = useState(1);

  const LIMIT = 10;

  const loadLogs = useCallback(async (page: number) => {
    const res = await dashboardApi.logs(page, LIMIT);
    setLogs(res.logs);
    setLogMeta(res.meta);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([dashboardApi.summary(), dashboardApi.analytics()]);
        setSummary(s);
        setAnalytics(a);
        await loadLogs(1);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load dashboard.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [loadLogs]);

  useEffect(() => {
    if (!loading) loadLogs(logPage).catch(() => undefined);
  }, [logPage, loading, loadLogs]);

  if (loading) return <Loading label="Loading dashboard…" />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const kpis = summary?.kpis;
  const passFailData = analytics
    ? [
        { name: 'Pass', value: analytics.passFail.pass, key: 'pass' as const },
        { name: 'Fail', value: analytics.passFail.fail, key: 'fail' as const },
        { name: 'Absent', value: analytics.passFail.absent, key: 'absent' as const },
      ].filter((d) => d.value > 0)
    : [];

  const sectionData = (analytics?.sectionPerformance ?? []).map((s) => ({
    label: s.label ?? '—',
    value: s.averagePercentage ?? 0,
  }));
  const trendData = (analytics?.examTrend ?? []).map((e) => ({
    examName: e.examName,
    value: e.averagePercentage,
  }));
  const gradeData = analytics?.gradeDistribution ?? [];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        {summary && <Chip label={`Academic Year ${summary.academicYear.label}`} color="primary" variant="outlined" />}
      </Box>

      {/* KPI cards */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
          mb: 3,
        }}
      >
        <StatCard label="Classrooms" value={kpis?.classrooms ?? 0} icon={<ClassIcon />} color="#1e3a5f" />
        <StatCard label="Subjects" value={kpis?.subjects ?? 0} icon={<MenuBookIcon />} color="#3b5bdb" />
        <StatCard label="Students" value={kpis?.students ?? 0} icon={<GroupsIcon />} color="#7048b6" />
        <StatCard label="Avg. score" value={fmtPct(kpis?.averagePercentage ?? null)} icon={<PercentIcon />} color="#e08a1e" />
        <StatCard label="Pass rate" value={fmtPct(kpis?.passPercentage ?? null)} icon={<CheckCircleIcon />} color="#1f9254" />
        <StatCard
          label="Pending entries"
          value={kpis?.pendingEntries ?? 0}
          icon={<PendingActionsIcon />}
          color="#d64545"
          hint={kpis ? `of ${kpis.totalExamSlots} slots` : undefined}
        />
      </Box>

      {/* My teaching analytics */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        My teaching
      </Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 3 }}>
        <ChartCard title="Section performance (avg %)" empty={sectionData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectionData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" name="Avg %" fill={BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Exam trend (avg %)" empty={trendData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="examName" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                name="Avg %"
                stroke={LINE_COLOR}
                strokeWidth={3}
                dot={{ r: 4, fill: LINE_COLOR }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pass / Fail / Absent" empty={passFailData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={passFailData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {passFailData.map((d) => (
                  <Cell key={d.key} fill={PIE_COLORS[d.key]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Grade distribution" empty={gradeData.every((g) => g.count === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gradeData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="grade" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                {gradeData.map((_, i) => (
                  <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Box>

      {/* Homeroom (class teacher) whole-class analytics — renders only for class teachers */}
      <HomeroomPanel />

      {/* Score change log */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Score change log
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Changes to your classes' marks only.
          </Typography>
          <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table
              size="small"
              sx={{
                '& tbody tr:nth-of-type(even)': { backgroundColor: '#f8fafc' },
                '& tbody tr:hover': { backgroundColor: 'rgba(30,58,95,0.06)' },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Exam</TableCell>
                  <TableCell>Change</TableCell>
                  <TableCell>Changed by</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No changes recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{log.studentName ?? '—'}</TableCell>
                    <TableCell>{log.subjectName ?? '—'}</TableCell>
                    <TableCell>{log.examName ?? '—'}</TableCell>
                    <TableCell>
                      {log.action === 'create'
                        ? `Set to ${scoreLabel(log.newScore, log.newIsAbsent)}`
                        : `${scoreLabel(log.oldScore, log.oldIsAbsent)} → ${scoreLabel(log.newScore, log.newIsAbsent)}`}
                    </TableCell>
                    <TableCell>
                      {log.changedBy ?? '—'}
                      {!log.isOwnEdit && (
                        <Chip size="small" label="other teacher" color="info" variant="outlined" sx={{ ml: 0.75 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={log.action}
                        color={log.action === 'create' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          {logMeta && logMeta.total > 0 && (
            <TablePagination
              component="div"
              count={logMeta.total}
              page={logPage - 1}
              onPageChange={(_, p) => setLogPage(p + 1)}
              rowsPerPage={LIMIT}
              rowsPerPageOptions={[LIMIT]}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
