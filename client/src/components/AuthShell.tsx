import { ReactNode } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

const AuthShell = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1f4e78 0%, #12314d 100%)',
      p: 2,
    }}
  >
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" align="center">
            Faculty Academic Management
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  </Box>
);

export default AuthShell;
