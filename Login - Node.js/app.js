// Required modules
const express = require('express');
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'users',
  password: 'pass',
  port: 5432, // Default PostgreSQL port
});

// Create Express application
const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Insert the new user into the database
  pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password], (error) => {
    if (error) {
      console.error('Error registering user:', error);
      res.send('Error registering user');
    } else {
      res.redirect('/login');
    }
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the user exists in the database
  pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password], (error, result) => {
    if (error) {
      console.error('Error logging in:', error);
      res.send('Error logging in');
    } else if (result.rows.length === 0) {
      res.send('Invalid credentials');
    } else {
        res.redirect(`/dashboard?username=${username}`);
    }
  });
});


app.get('/dashboard', (req, res) => {
  // Render the dashboard view
  const username = req.query.username;
  res.render('dashboard', { username });
});

app.get('/login', (req, res) => {
    // Render the login view
    res.render('login');
  });

// Start the server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});