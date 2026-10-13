
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const subjects = [
  'Operating Systems',
  'Data Base and Management System',
  'Software Engineering',
  'Probability and Statistics',
  'Business Environment',
  'Operating Systems Laboratory',
  'Database and Management Systems Laboratory',
  'Design Thinking and Innovation Laboratory',
  'Full Stack Development',
  'Health and Wellness'
];

function getGrade(mark) {
  if (mark === 'Ab') return 'Ab';
  if (mark >= 90) return 'S';
  if (mark >= 80) return 'A';
  if (mark >= 70) return 'B';
  if (mark >= 60) return 'C';
  if (mark >= 50) return 'D';
  if (mark >= 40) return 'E';
  return 'F';
}

app.get('/', (req, res) => {
  res.send('SEGMP backend is running!');
});

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT 1 AS result');
    res.json({
      message: 'Database connection successful!',
      result: rows[0].result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enroll', async (req, res) => {
  const { password, name, rollNumber, marks } = req.body;

  if (password !== process.env.ENROLLMENT_PASSWORD) {
    return res.status(401).json({ message: 'Incorrect password.' });
  }

  if (!name || !/^[A-Za-z. ]+$/.test(name.trim())) {
    return res.status(400).json({
      message: 'Enter a valid name using letters, spaces, or periods.'
    });
  }

  if (!rollNumber || !/^24HC\d{3}$/i.test(rollNumber.trim())) {
    return res.status(400).json({
      message: 'Roll number must follow the format 24HC001.'
    });
  }

  if (!Array.isArray(marks) || marks.length !== subjects.length) {
    return res.status(400).json({
      message: 'Enter marks for all 10 subjects.'
    });
  }

  const records = [];

  for (let i = 0; i < subjects.length; i++) {
    const value = marks[i]?.marks;
    const isAbsent =
      typeof value === 'string' && value.trim().toLowerCase() === 'ab';

    if (
      !isAbsent &&
      (value === '' || value === null || value === undefined ||
       !Number.isFinite(Number(value)) ||
       Number(value) < 0 || Number(value) > 100)
    ) {
      return res.status(400).json({
        message: `Enter a mark from 0 to 100, or Ab, for ${subjects[i]}.`
      });
    }

    const numericMark = isAbsent ? null : Number(value);
    const grade = isAbsent ? 'Ab' : getGrade(numericMark);
    const result = isAbsent
      ? 'Absent'
      : numericMark >= 40 ? 'PASS' : 'FAIL';

    records.push([
      rollNumber.trim().toUpperCase(),
      subjects[i],
      numericMark,
      grade,
      result
    ]);
  }

  const sgpa =
    records.reduce((total, record) => total + (record[2] ?? 0), 0) / 100;

  const connection = db.promise();

  try {
    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO students (roll_number, name, branch) VALUES (?, ?, ?)',
      [
        rollNumber.trim().toUpperCase(),
        name.trim(),
        'Computer Science and Engineering'
      ]
    );

    await connection.query(
      `INSERT INTO subjects
       (roll_number, subject_name, marks, grade, result)
       VALUES ?`,
      [records]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Form Submitted Successfully',
      sgpa: Number(sgpa.toFixed(2))
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'This roll number is already enrolled.'
      });
    }

    console.error('Enrollment error:', error.message);
    res.status(500).json({
      message: 'Could not save the form. Please try again.'
    });
  }
});

app.get('/api/results/:rollNumber', async (req, res) => {
  const rollNumber = req.params.rollNumber.trim().toUpperCase();

  try {
    const [students] = await db.promise().query(
      'SELECT roll_number, name, branch FROM students WHERE roll_number = ?',
      [rollNumber]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: 'Roll number Not found'
      });
    }

    const [subjects] = await db.promise().query(
      `SELECT subject_name, marks, grade, result
       FROM subjects
       WHERE roll_number = ?
       ORDER BY id`,
      [rollNumber]
    );

    const totalMarks = subjects.reduce(
      (total, subject) => total + (subject.marks === null ? 0 : Number(subject.marks)),
      0
    );

    const sgpa = Number((totalMarks / 100).toFixed(2));

    res.json({
      student: students[0],
      subjects,
      totalMarks,
      sgpa
    });
  } catch (error) {
    console.error('Result retrieval error:', error.message);
    res.status(500).json({
      message: 'Unable to retrieve results.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`SEGMP server running at http://localhost:${PORT}`);
});
