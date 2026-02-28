const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '3125',
  database: process.env.DB_NAME || 'sup',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0
});

const promisePool = pool.promise();

app.get('/api/groups', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT DISTINCT group_name FROM students ORDER BY group_name');
    res.json(rows);
  } catch (error) {
    console.error('Ошибка загрузки групп:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subjects', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT * FROM subjects ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Ошибка загрузки предметов:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const { group, subjectId } = req.query;
    
    if (!group || !subjectId) {
      return res.status(400).json({ error: 'Group and subjectId are required' });
    }

    const [groupCheck] = await promisePool.query(
      'SELECT COUNT(*) as count FROM students WHERE group_name = ?',
      [group]
    );
    
    if (groupCheck[0].count === 0) {
      return res.json({ 
        grades: [],
        message: `Группа "${group}" не найдена`
      });
    }

    const [subjectCheck] = await promisePool.query(
      'SELECT * FROM subjects WHERE id = ?',
      [subjectId]
    );
    
    if (subjectCheck.length === 0) {
      return res.json({ 
        grades: [],
        message: `Предмет с ID ${subjectId} не найден`
      });
    }

    const [grades] = await promisePool.query(
      `SELECT 
        s.id as student_id,
        s.name as student_name,
        COALESCE(g.grade, '') as grade,
        COALESCE(g.attendance, 0) as attendance,
        DATE_FORMAT(g.date, '%Y-%m-%d') as date
      FROM students s
      LEFT JOIN grades g ON s.id = g.student_id AND g.subject_id = ?
      WHERE s.group_name = ?
      ORDER BY s.name, g.date DESC`,
      [subjectId, group]
    );

    const gradesWithDates = grades.filter(g => g.date);

    res.json({ 
      grades: gradesWithDates,
      debug: {
        totalRecords: grades.length,
        withDates: gradesWithDates.length,
        group: group,
        subjectId: subjectId,
        subjectName: subjectCheck[0]?.name
      }
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ error: error.message, grades: [] });
  }
});

app.post('/api/grade', async (req, res) => {
  try {
    const { studentId, subjectId, grade, attendance, date } = req.body;
    
    const [result] = await promisePool.query(
      `INSERT INTO grades (student_id, subject_id, grade, attendance, date) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       grade = VALUES(grade), 
       attendance = VALUES(attendance)`,
      [studentId, subjectId, grade, attendance, date]
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    res.status(500).json({ error: error.message });
  }
});

const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  app.get('/*path', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});