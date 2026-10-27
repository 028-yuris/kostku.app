const express = require('express');
const { users } = require('../data/mock');
const authenticate = require('../middleware/auth');
const router = express.Router();

router.post('/register', (req, res) => {
  const { role, nama, email, noHp, password } = req.body;

  // 1. Validasi input dasar
  if (!nama || !email || !password) {
    return res.status(400).json({ 
      status: false, 
      message: 'Nama, email, dan password wajib diisi' 
    });
  }

  // 2. Cek apakah email sudah terdaftar
  const isEmailExist = users.find((u) => u.email === email);
  if (isEmailExist) {
    return res.status(400).json({ 
      status: false, 
      message: 'Email sudah terdaftar' 
    });
  }

  // 3. Buat user baru (mock ID auto-increment sederhana)
  const newUser = {
    id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
    role: role || 'penghuni', // Jika tidak dikirim, default penghuni
    nama,
    email,
    noHp: noHp || '',
    password,
  };

  // 4. Simpan ke array (di memori)
  users.push(newUser);

  // 5. Hilangkan password sebelum dikembalikan sebagai respons
  const { password: _, ...userData } = newUser;

  res.status(201).json({
    status: true,
    message: 'Registrasi berhasil',
    data: userData,
  });
});

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      status: false, 
      message: 'Email dan password wajib diisi' 
    });
  }

  // Cari kombinasi email dan password yang cocok
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ 
      status: false, 
      message: 'Email atau password salah' 
    });
  }

  // Hilangkan password dari data respons
  const { password: _, ...userData } = user;

  res.status(200).json({
    status: true,
    message: 'Login berhasil',
    data: {
      user: userData,
      token: `mock-jwt-token-${user.id}` // Token palsu untuk dipakai frontend
    },
  });
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