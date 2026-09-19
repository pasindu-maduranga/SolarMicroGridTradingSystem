import React from 'react';
import { Card, CardContent, Box, Typography } from '@material-ui/core';

const DashboardStatCard = ({ icon, iconBg = '#E8F0E6', value, label, sublabel }) => {
  return (
    <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none', height: '100%' }}>
      <CardContent style={{ padding: 24 }}>
        <Box mb={3}>
          <Box style={{ backgroundColor: iconBg, borderRadius: '50%', padding: 12, display: 'inline-flex' }}>
            <Typography style={{ fontSize: 20 }}>{icon}</Typography>
          </Box>
        </Box>
        <Typography style={{ fontFamily: '"Inter", sans-serif', fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>
          {value}
        </Typography>
        <Typography style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.85rem', color: '#4B5563', fontWeight: 500 }}>
          {label}
        </Typography>
        {sublabel ? (
          <Typography style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>
            {sublabel}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DashboardStatCard;
