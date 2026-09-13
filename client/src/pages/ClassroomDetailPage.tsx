import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Breadcrumbs,
  Link,
  Alert,
  Stack,
  Avatar,
  Button,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { classroomsApi } from '../api/classrooms.api';
import { getErrorMessage } from '../api/client';
import type { SubjectsResponse } from '../types';
import Loading from '../components/Loading';

const ClassroomDetailPage = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SubjectsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setData(await classroomsApi.subjects(Number(sectionId)));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load subjects.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [sectionId]);

  if (loading) return <Loading label="Loading subjects…" />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const c = data?.classroom;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component="button" onClick={() => navigate('/classrooms')} underline="hover">
          Classrooms
        </Link>
        <Typography color="text.primary">
          {c?.className} - {c?.sectionName}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/classrooms')}>
          Back
        </Button>
        <Typography variant="h4">
          {c?.className} — Section {c?.sectionName}
        </Typography>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Subjects you teach here
      </Typography>

      {data && data.subjects.length === 0 ? (
        <Alert severity="info">No subjects assigned to you in this classroom.</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          {data?.subjects.map((s) => (
            <Card key={s.assignmentId}>
              <CardActionArea onClick={() => navigate(`/marks/${s.assignmentId}`)}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <MenuBookIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{s.subjectName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {s.subjectCode}
                      </Typography>
                    </Box>
                    <ChevronRightIcon color="action" />
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

export default ClassroomDetailPage;
