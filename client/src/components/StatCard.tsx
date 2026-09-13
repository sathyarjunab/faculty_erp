import { ReactNode } from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  color?: string;
  hint?: string;
}

const StatCard = ({ label, value, icon, color = '#1e3a5f', hint }: StatCardProps) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, bgcolor: color }} />
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.75, py: 2.25 }}>
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2.5,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(color, 0.13),
          color,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ lineHeight: 1.1, fontWeight: 800 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

export default StatCard;
