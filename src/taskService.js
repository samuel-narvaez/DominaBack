const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Task = require('./model/Task');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'Domina'
});

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    
    // Verificar si el token contiene las claves esperadas
    const expectedClaims = ['userId', 'iat', 'exp'];
    const missingClaims = expectedClaims.filter(claim => !Object.keys(decoded).includes(claim));
    
    if (missingClaims.length > 0) {
      return res.sendStatus(400);
    }

    req.user = decoded;
    next();
  });
}



app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const task = new Task({ ...req.body, userId: req.user.userId });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/tasks', authenticateToken, async (req, res) => {
  const tasks = await Task.find({ userId: req.user.userId });
  res.json(tasks);
});

app.put('/tasks/:id', authenticateToken, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

app.listen(4001, () => console.log('Task service running on port 4001'));
