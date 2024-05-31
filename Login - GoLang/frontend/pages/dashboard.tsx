import React from 'react';
import { Typography, Box } from '@mui/material';

const Dashboard = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        margin: '0 auto',
        padding: '200px',
        textAlign: 'center',
      }}
    >
      <Typography variant="h4">Dashboard</Typography>
      <Typography variant="h6">HI</Typography>
    </Box>
  );
};

export default Dashboard;
