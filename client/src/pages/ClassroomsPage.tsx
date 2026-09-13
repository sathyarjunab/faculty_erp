import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardActionArea,
  CardContent,
  TextField,
  Alert,
  Stack,
  Avatar,
} from '@mui/material';
import ClassIcon from '@mui/icons-material/ClassOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import { classroomsApi } from '../api/classrooms.api';
import { getErrorMessage } from '../api/client';
import type { ClassroomsResponse } from '../types';
import Loading from '../components/Loading';

const ClassroomsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ClassroomsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setData(await classroomsApi.list());
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load classrooms.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const list = data?.classrooms ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => `${c.className} ${c.sectionName}`.toLowerCase().includes(q));
  }, [data, query]);

  if (loading) return <Loading label="Loading classrooms…" />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h4">My Classrooms</Typography>
        {data && <Chip label={`Academic Year ${data.academicYear.label}`} color="primary" variant="outlined" />}
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          size="small"
          placeholder="Search class or section…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Box>

      {filtered.length === 0 ? (
        <Alert severity="info">No classrooms assigned to you for this year.</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
          }}
        >
          {filtered.map((c) => (
            <Card key={c.sectionId}>
              <CardActionArea onClick={() => navigate(`/classrooms/${c.sectionId}`)} sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <ClassIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{c.className}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Section {c.sectionName}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" icon={<MenuBookIcon />} label={`${c.subjectCount} subject${c.subjectCount === 1 ? '' : 's'}`} />
                    <Chip size="small" icon={<GroupsIcon />} label={`${c.studentCount} students`} variant="outlined" />
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ClassroomsPage;
