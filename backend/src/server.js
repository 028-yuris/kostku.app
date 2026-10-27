const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
const authRouter = require('./routes/auth');
app.use('/api/v1/auth', authRouter);

app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kostku API v1',
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});