const express = require('express');
const { notifikasi } = require('../data/mock');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/notifikasi/saya
 * Fitur 3: Daftar notifikasi milik sendiri, terbaru dulu
 * Akses: Semua yang login
 */
router.get('/saya', authenticate, (req, res) => {
  let myNotifs = notifikasi.filter((n) => n.userId === req.user.id);

  // Urutkan dari yang terbaru (createdAt descending atau id descending)
  myNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id);

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data notifikasi berhasil diambil',
    data: myNotifs,
  });
});

/**
 * GET /api/v1/notifikasi/belum-dibaca
 * Fitur 3: Jumlah notifikasi belum dibaca untuk badge di app
 * Akses: Semua yang login
 */
router.get('/belum-dibaca', authenticate, (req, res) => {
  const count = notifikasi.filter((n) => n.userId === req.user.id && !n.dibaca).length;

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Jumlah notifikasi belum dibaca berhasil diambil',
    data: {
      belumDibaca: count,
    },
  });
});

/**
 * PATCH /api/v1/notifikasi/:id/baca
 * Fitur 3: Menandai satu notifikasi sudah dibaca
 * Akses: Semua yang login
 * Validasi: Cek kepemilikan
 */
router.patch('/:id/baca', authenticate, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = notifikasi.find((n) => n.id === id);

  if (!item) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Notifikasi tidak ditemukan',
    });
  }

  // Cek kepemilikan
  if (item.userId !== req.user.id) {
    return res.status(403).json({
      status: false,
      success: false,
      message: 'Akses ditolak: Anda hanya dapat membaca notifikasi milik sendiri',
    });
  }

  item.dibaca = true;

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Notifikasi berhasil ditandai sudah dibaca',
    data: item,
  });
});

/**
 * PATCH /api/v1/notifikasi/baca-semua
 * Fitur 3: Menandai semua notifikasi sudah dibaca
 * Akses: Semua yang login
 */
router.patch('/baca-semua', authenticate, (req, res) => {
  let updatedCount = 0;

  notifikasi.forEach((n) => {
    if (n.userId === req.user.id && !n.dibaca) {
      n.dibaca = true;
      updatedCount++;
    }
  });

  return res.status(200).json({
    status: true,
    success: true,
    message: `${updatedCount} notifikasi berhasil ditandai sudah dibaca`,
    data: {
      jumlahDitandai: updatedCount,
    },
  });
});

module.exports = router;
