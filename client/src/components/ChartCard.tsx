import { ReactNode } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  height?: number;
  empty?: boolean;
  emptyText?: string;
}

const ChartCard = ({ title, children, height = 280, empty = false, emptyText = 'No data yet' }: ChartCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
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
