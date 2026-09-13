import { Box, CircularProgress, Typography } from '@mui/material';

const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      minHeight: 240,
      width: '100%',
    }}
  >
    <CircularProgress />
    <Typography color="text.secondary">{label}</Typography>
  </Box>
);

export default Loading;
