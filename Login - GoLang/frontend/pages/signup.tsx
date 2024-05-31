import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Typography, TextField, Button, Box } from '@mui/material';

const Signup = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/signup', { username, password });
      if (response.status === 200) {
        router.push('/login');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.message || 'An error occurred');
      } else {
        setError('An error occurred');
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Signup
      </Typography>
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" onClick={handleSignup} color="secondary">
        Signup
      </Button>
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default Signup;
