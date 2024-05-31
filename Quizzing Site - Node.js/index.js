const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { Pool } = require('pg');
const cron = require('node-cron');

// PostgreSQL configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'users',
    password: 'pass',
    port: 5432, // Default PostgreSQL port
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// View engine setup
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Create a new quiz
app.post('/quizzes', async(req, res) => {
    try {
        const { question, options, rightAnswer, startDate, endDate } = req.body;

        const client = await pool.connect();
        const result = await client.query(
            'INSERT INTO quizzes (question, options, right_answer, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [question, options, rightAnswer, startDate, endDate, 'inactive']
        );
        const createdQuiz = result.rows[0];
        client.release();

        res.status(201).json(createdQuiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Retrieve the active quizzes
app.get('/quizzes/active', async(req, res) => {
    try {
        const currentDateTime = new Date().toISOString();
        const client = await pool.connect();
        const result = await client.query(
            'SELECT id, question, options, start_date, end_date FROM quizzes WHERE start_date <= $1 AND end_date >= $2', [currentDateTime, currentDateTime]
        );
        const activeQuizzes = result.rows;
        client.release();

        res.status(200).json(activeQuizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Retrieve the result of a quiz by its ID
app.get('/quizzes/:id/result', async(req, res) => {
    try {
        const quizId = req.params.id;
        const client = await pool.connect();
        const result = await client.query('SELECT right_answer FROM quizzes WHERE id = $1', [quizId]);
        const quizResult = result.rows[0];
        client.release();

        if (quizResult) {
            res.status(200).json({ result: quizResult.right_answer });
        } else {
            res.status(404).json({ error: 'Quiz not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Retrieve all quizzes
app.get('/quizzes/all', async(req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM quizzes');
        const quizzes = result.rows;
        client.release();

        res.status(200).json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cron job to update quiz status
cron.schedule('* * * * *', async() => {
    try {
        const currentDateTime = new Date().toISOString();
        const client = await pool.connect();
        await client.query(
            'UPDATE quizzes SET status = CASE WHEN start_date <= $1 THEN CASE WHEN end_date >= $1 THEN \'active\' ELSE \'finished\' END ELSE \'inactive\' END', [currentDateTime]
        );
        client.release();
    } catch (error) {
        console.error(error);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});