import React from 'react';
import Link from 'next/link';
import { Typography, Button, List, ListItem, Box } from '@mui/material';

const IndexPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
      }}
    >
      <Typography variant="h1">Welcome to the Index Page</Typography>
      <Typography variant="body1">Please select an option:</Typography>
      <List>
        <ListItem>
          <Link href="/login" passHref>
            <Button variant="contained" color="primary">
              Login
            </Button>
          </Link>
        </ListItem>
        <ListItem>
          <Link href="/signup" passHref>
            <Button variant="contained" color="primary">
              Signup
            </Button>
          </Link>
        </ListItem>
      </List>
    </Box>
  );
};

export default IndexPage;
