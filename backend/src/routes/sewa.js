const express = require('express');
const { penghuni, kamar, users } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/sewa
 * Fitur: Daftar sewa
 * Akses: Pengelola
 * Query params: ?status=aktif (opsional)
 */
router.get('/', authenticate, authorize('pengelola'), (req, res) => {
  const { status } = req.query;

  let hasil = penghuni.map((s) => {
    const user = users.find((u) => u.id === s.userId);
    const room = kamar.find((k) => k.id === s.kamarId);

    return {
      ...s,
      user: user
        ? {
            id: user.id,
            nama: user.nama,
            email: user.email,
            noHp: user.noHp,
            role: user.role,
          }
        : null,
      kamar: room
        ? {
            id: room.id,
            kode: room.kode || room.nomor,
            nomor: room.nomor || room.kode,
            lantai: room.lantai,
            tipe: room.tipe,
            harga: room.harga,
            status: room.status,
          }
        : null,
    };
  });

  if (status) {
    hasil = hasil.filter((s) => s.status.toLowerCase() === status.trim().toLowerCase());
  }

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data sewa berhasil diambil',
    data: hasil,
  });
});

/**
 * PATCH /api/v1/sewa/:id/akhiri
 * Fitur: Mengakhiri sewa
 * Akses: Pengelola
 * Efek: Mengisi tanggalSelesai, status sewa menjadi 'selesai', kamar kembali kosong ('tersedia')
 */
router.patch('/:id/akhiri', authenticate, authorize('pengelola'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sewaItem = penghuni.find((s) => s.id === id);

  if (!sewaItem) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Data sewa tidak ditemukan',
    });
  }

  const { tanggalSelesai } = req.body;
  const nowStr = new Date().toISOString().split('T')[0];

  // 1. Perbarui data sewa
  sewaItem.tanggalSelesai = tanggalSelesai ? String(tanggalSelesai).trim() : nowStr;
  sewaItem.status = 'selesai';

  // 2. Efek: Kamar kembali kosong ('tersedia')
  const room = kamar.find((k) => k.id === sewaItem.kamarId);
  if (room) {
    room.status = 'tersedia';
  }

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Sewa berhasil diakhiri, kamar kembali berstatus tersedia',
    data: {
      sewa: sewaItem,
      kamar: room || null,
    },
  });
});

module.exports = router;
