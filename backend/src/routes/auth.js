const express = require('express');
const { users } = require('../data/mock');
const { getPool } = require('../data/db');
const authenticate = require('../middleware/auth');
const router = express.Router();

const ROLES = ['pengelola', 'penghuni', 'calon_penghuni'];

// Pastikan user dari database tersedia di cache memori (dipakai middleware authenticate)
const cacheUser = (row) => {
  const user = {
    id: row.id,
    role: row.role,
    nama: row.nama,
    email: row.email,
    noHp: row.no_hp || '',
    password: row.password,
  };
  const i = users.findIndex((u) => u.id === user.id);
  if (i >= 0) users[i] = user;
  else users.push(user);
  return user;
};

const dbDown = (res, err) => {
  console.error('[auth] Database error:', err.message);
  return res.status(503).json({
    status: false,
    message: 'Database tidak dapat diakses. Pastikan MySQL menyala dan jalankan "npm run db:setup" di folder backend.',
  });
};

router.post('/register', async (req, res) => {
  const { role, nama, email, noHp, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ status: false, message: 'Nama, email, dan password wajib diisi' });
  }

  const roleFinal = role || 'penghuni';
  if (!ROLES.includes(roleFinal)) {
    return res.status(400).json({ status: false, message: 'Role tidak valid' });
  }

  try {
    const db = getPool();
    const [exist] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length > 0) {
      return res.status(400).json({ status: false, message: 'Email sudah terdaftar' });
    }

    const [result] = await db.query(
      'INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)',
      [nama, email, password, noHp || null, roleFinal]
    );

    const saved = cacheUser({
      id: result.insertId,
      role: roleFinal,
      nama,
      email,
      no_hp: noHp || '',
      password,
    });
    const { password: _, ...userData } = saved;

    return res.status(201).json({ status: true, message: 'Registrasi berhasil', data: userData });
  } catch (err) {
    return dbDown(res, err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: false, message: 'Email dan password wajib diisi' });
  }

  try {
    const [rows] = await getPool().query(
      'SELECT id, nama, email, password, no_hp, role FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ status: false, message: 'Email atau password salah' });
    }

    const user = cacheUser(rows[0]);
    const { password: _, ...userData } = user;

    return res.status(200).json({
      status: true,
      message: 'Login berhasil',
      data: { user: userData, token: `mock-jwt-token-${user.id}` },
    });
  } catch (err) {
    return dbDown(res, err);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, (req, res) => {
  res.status(200).json({
    status: true,
    success: true,
    message: 'Profil user berhasil diambil',
    data: req.user,
  });
});

module.exports = router;
