const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

// CORS - Mengizinkan origin web (misalnya http://localhost:5173) dan mobile/Postman
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
const authRouter = require('./routes/auth');
const kamarRouter = require('./routes/kamar');
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/kamar', kamarRouter);

app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kostku API v1',
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});