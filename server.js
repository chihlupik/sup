const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
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

// ============= АВТОРИЗАЦИЯ =============
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await promisePool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =============
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (role === 'admin') {
      return res.status(403).json({ error: 'Нельзя создать еще одного администратора' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await promisePool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    res.json({ 
      success: true, 
      id: result.insertId,
      message: 'Пользователь успешно создан'
    });
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await promisePool.query(
      'DELETE FROM users WHERE id = ? AND role != "admin"',
      [id]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Пользователь удален' });
    } else {
      res.status(404).json({ error: 'Пользователь не найден или это администратор' });
    }
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= УПРАВЛЕНИЕ ГРУППАМИ =============
app.get('/api/groups', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT name as group_name FROM groups ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Ошибка загрузки групп:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const { group_name } = req.body;
    
    if (!group_name) {
      return res.status(400).json({ error: 'Название группы обязательно' });
    }

    const [result] = await promisePool.query(
      'INSERT INTO groups (name) VALUES (?)',
      [group_name]
    );

    res.json({ 
      success: true, 
      id: result.insertId,
      message: 'Группа успешно создана'
    });
  } catch (error) {
    console.error('Ошибка создания группы:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Такая группа уже существует' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.delete('/api/groups/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);
    
    const [students] = await promisePool.query(
      'SELECT COUNT(*) as count FROM students WHERE group_name = ?',
      [decodedName]
    );

    if (students[0].count > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить группу, в которой есть студенты. Сначала удалите всех студентов из группы.' 
      });
    }

    const [result] = await promisePool.query(
      'DELETE FROM groups WHERE name = ?',
      [decodedName]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Группа удалена' });
    } else {
      res.status(404).json({ error: 'Группа не найдена' });
    }
  } catch (error) {
    console.error('Ошибка удаления группы:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= УПРАВЛЕНИЕ ПРЕДМЕТАМИ =============
app.get('/api/subjects', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT * FROM subjects ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Ошибка загрузки предметов:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subjects', async (req, res) => {
  try {
    const { name } = req.body;
    
    const [result] = await promisePool.query(
      'INSERT INTO subjects (name) VALUES (?)',
      [name]
    );

    res.json({ 
      success: true, 
      id: result.insertId,
      message: 'Предмет успешно создан'
    });
  } catch (error) {
    console.error('Ошибка создания предмета:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Такой предмет уже существует' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.delete('/api/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await promisePool.query('DELETE FROM grades WHERE subject_id = ?', [id]);
    
    const [result] = await promisePool.query(
      'DELETE FROM subjects WHERE id = ?',
      [id]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Предмет удален вместе со всеми оценками' });
    } else {
      res.status(404).json({ error: 'Предмет не найден' });
    }
  } catch (error) {
    console.error('Ошибка удаления предмета:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= УПРАВЛЕНИЕ СТУДЕНТАМИ =============
app.get('/api/students', async (req, res) => {
  try {
    const { group } = req.query;
    let query = 'SELECT id, name, group_name FROM students';
    let params = [];
    
    if (group) {
      query += ' WHERE group_name = ? ORDER BY name';
      params.push(group);
    } else {
      query += ' ORDER BY group_name, name';
    }
    
    const [rows] = await promisePool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Ошибка загрузки студентов:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, group_name } = req.body;
    
    const [groupCheck] = await promisePool.query(
      'SELECT COUNT(*) as count FROM groups WHERE name = ?',
      [group_name]
    );

    if (groupCheck[0].count === 0) {
      return res.status(400).json({ error: 'Такая группа не существует' });
    }
    
    const [result] = await promisePool.query(
      'INSERT INTO students (name, group_name) VALUES (?, ?)',
      [name, group_name]
    );

    res.json({ 
      success: true, 
      id: result.insertId,
      message: 'Студент успешно добавлен'
    });
  } catch (error) {
    console.error('Ошибка добавления студента:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await promisePool.query('DELETE FROM grades WHERE student_id = ?', [id]);
    
    const [result] = await promisePool.query('DELETE FROM students WHERE id = ?', [id]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Студент удален' });
    } else {
      res.status(404).json({ error: 'Студент не найден' });
    }
  } catch (error) {
    console.error('Ошибка удаления студента:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= УПРАВЛЕНИЕ ОЦЕНКАМИ =============
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
      grades: gradesWithDates
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

app.delete('/api/grade', async (req, res) => {
  try {
    const { studentId, subjectId, date } = req.body;
    
    const [result] = await promisePool.query(
      'DELETE FROM grades WHERE student_id = ? AND subject_id = ? AND date = ?',
      [studentId, subjectId, date]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Запись удалена' });
    } else {
      res.status(404).json({ error: 'Запись не найдена' });
    }
  } catch (error) {
    console.error('Ошибка удаления:', error);
    res.status(500).json({ error: error.message });
  }
});

// Статические файлы Vue приложения
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
});