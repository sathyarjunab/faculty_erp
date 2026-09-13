import { useEffect, useState } from 'react';
import { Box, Typography, Stack, TextField, MenuItem, Chip, Alert } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PercentIcon from '@mui/icons-material/Percent';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
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
import type { HomeroomItem, HomeroomAnalytics } from '../types';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import Loading from './Loading';

const PIE_COLORS = { pass: '#1f9254', fail: '#d64545', absent: '#9aa7b8' };
const GRADE_COLORS = ['#1f9254', '#3fa66a', '#8bc34a', '#e0b21e', '#e08a1e', '#d64545'];
const fmtPct = (n: number | null) => (n === null ? '—' : `${n}%`);

const HomeroomPanel = () => {
  const [homerooms, setHomerooms] = useState<HomeroomItem[]>([]);
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [data, setData] = useState<HomeroomAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await dashboardApi.homerooms();
        setHomerooms(res.homerooms);
        if (res.homerooms.length) setSectionId(res.homerooms[0].sectionId);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load homeroom.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (sectionId === '') return;
    setAnalyticsLoading(true);
    dashboardApi
      .homeroomAnalytics(sectionId)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, 'Failed to load homeroom analytics.')))
      .finally(() => setAnalyticsLoading(false));
  }, [sectionId]);

  // Not a class teacher → render nothing.
  if (loading || homerooms.length === 0) return null;

  const passFailData = data
    ? [
        { name: 'Pass', value: data.passFail.pass, key: 'pass' as const },
        { name: 'Fail', value: data.passFail.fail, key: 'fail' as const },
        { name: 'Absent', value: data.passFail.absent, key: 'absent' as const },
      ].filter((d) => d.value > 0)
    : [];
  const subjectData = (data?.subjectPerformance ?? []).map((s) => ({ label: s.label ?? '—', value: s.averagePercentage ?? 0 }));
  const trendData = (data?.examTrend ?? []).map((e) => ({ examName: e.examName, value: e.averagePercentage }));
  const gradeData = data?.gradeDistribution ?? [];

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
        <StarIcon color="secondary" />
        <Typography variant="h5">Homeroom — Class Teacher</Typography>
        {homerooms.length > 1 ? (
          <TextField
            select
            size="small"
            label="Homeroom class"
            value={sectionId}
            onChange={(e) => setSectionId(Number(e.target.value))}
            sx={{ minWidth: 220, ml: 1 }}
          >
            {homerooms.map((h) => (
              <MenuItem key={h.sectionId} value={h.sectionId}>
                {h.className} - {h.sectionName} ({h.studentCount})
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Chip color="secondary" variant="outlined" label={`${homerooms[0].className} - ${homerooms[0].sectionName}`} />
        )}
        <Typography variant="body2" color="text.secondary">
          Whole-class view across all subjects (every teacher's marks).
        </Typography>
      </Stack>

      {analyticsLoading || !data ? (
        <Loading label="Loading homeroom analytics…" />
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              mb: 2,
            }}
          >
            <StatCard label="Students" value={data.kpis.students} icon={<GroupsIcon />} color="#7048b6" />
            <StatCard label="Subjects" value={data.kpis.subjects} icon={<MenuBookIcon />} color="#3b5bdb" />
            <StatCard label="Class avg" value={fmtPct(data.kpis.averagePercentage)} icon={<PercentIcon />} color="#e08a1e" />
            <StatCard label="Pass rate" value={fmtPct(data.kpis.passPercentage)} icon={<CheckCircleIcon />} color="#1f9254" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <ChartCard title="Subject performance (avg %)" empty={subjectData.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" name="Avg %" fill="#1e3a5f" radius={[6, 6, 0, 0]} maxBarSize={64} />
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
                  <Line type="monotone" dataKey="value" name="Avg %" stroke="#e08a1e" strokeWidth={3} dot={{ r: 4, fill: '#e08a1e' }} connectNulls />
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
                  <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                    {gradeData.map((_, i) => (
                      <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Box>
        </>
      )}

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
};

export default HomeroomPanel;
