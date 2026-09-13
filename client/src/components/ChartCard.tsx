import { ReactNode } from 'react';
import { Card, CardContent, Typography, Box, Stack, Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  height?: number;
  empty?: boolean;
  emptyText?: string;
  info?: string;
}

const ChartCard = ({ title, children, height = 280, empty = false, emptyText = 'No data yet', info }: ChartCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
        <Typography variant="h6">{title}</Typography>
        {info && (
          <Tooltip title={info} arrow enterTouchDelay={0} placement="top">
            <IconButton size="small" aria-label={`About: ${title}`} sx={{ color: 'text.secondary' }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      {empty ? (
        <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            {emptyText}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ height, width: '100%' }}>{children}</Box>
      )}
    </CardContent>
  </Card>
);

export default ChartCard;
