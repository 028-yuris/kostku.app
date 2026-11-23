const express = require('express');
const bcrypt = require('bcryptjs');
const { users } = require('../data/mock');
const { getPool } = require('../data/db');
const { signToken } = require('../utils/jwt');
const authenticate = require('../middleware/auth');

const router = express.Router();
const ROLES = ['pengelola', 'penghuni', 'calon_penghuni'];
const isBcryptHash = (str) => typeof str === 'string' && /^\$2[aby]\$\d{2}\$/.test(str);

// Sinkronkan user dari database ke cache memori (agar route yang masih baca mock.users tetap mengenalinya)
const cacheUser = (row) => {
  const user = {
    id: row.id,
    role: row.role,
    nama: row.nama,
    email: row.email,
    noHp: row.no_hp || '',
  };
  const i = users.findIndex((u) => u.id === user.id);
  if (i >= 0) users[i] = { ...users[i], ...user };
  else users.push(user);
  return user;
};

const dbDown = (res, err) => {
  console.error('[auth] Database error:', err.message);
  return res.status(503).json({
    status: false,
    success: false,
    message: 'Database tidak dapat diakses. Pastikan MySQL menyala dan jalankan "npm run db:setup" di folder backend.',
  });
};

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  const { role, nama, email, noHp, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ status: false, success: false, message: 'Nama, email, dan password wajib diisi' });
  }

  const roleFinal = role || 'penghuni';
  if (!ROLES.includes(roleFinal)) {
    return res.status(400).json({ status: false, success: false, message: 'Role tidak valid' });
  }

  try {
    const db = getPool();
    const [exist] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length > 0) {
      return res.status(400).json({ status: false, success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const [result] = await db.query(
      'INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)',
      [nama, email, hashedPassword, noHp || null, roleFinal]
    );

    const userData = cacheUser({
      id: result.insertId,
      role: roleFinal,
      nama,
      email,
      no_hp: noHp || '',
    });

    return res.status(201).json({
      status: true,
      success: true,
      message: 'Registrasi berhasil',
      data: userData,
    });
  } catch (err) {
    return dbDown(res, err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: false, success: false, message: 'Email dan password wajib diisi' });
  }

  try {
    const db = getPool();
    const [rows] = await db.query(
      'SELECT id, nama, email, password, no_hp, role FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ status: false, success: false, message: 'Email atau password salah' });
    }

    const row = rows[0];
    let valid = false;

    if (isBcryptHash(row.password)) {
      valid = await bcrypt.compare(String(password), row.password);
    } else {
      // Fallback untuk data lama (plain-text) sebelum seed diperbarui, lalu otomatis di-hash
      valid = row.password === String(password);
      if (valid) {
        const upgradedHash = await bcrypt.hash(String(password), 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [upgradedHash, row.id]);
      }
    }

    if (!valid) {
      return res.status(401).json({ status: false, success: false, message: 'Email atau password salah' });
    }

    const userData = cacheUser(row);
    const token = signToken(userData);

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Login berhasil',
      data: { user: userData, token },
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
