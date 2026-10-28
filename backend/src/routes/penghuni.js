const express = require('express');
const { users, kamar, penghuni } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/penghuni
 * Fitur 10: Kelola data penghuni
 * Akses: Pengelola
 * Query params: ?tanpaSewa=true (untuk memilih penghuni yang belum punya kamar)
 * Deskripsi: Daftar penghuni beserta kamar dan sewa aktifnya.
 */
router.get('/', authenticate, authorize('pengelola'), (req, res) => {
  const { tanpaSewa } = req.query;

  // Ambil semua pengguna non-pengelola (penghuni dan calon penghuni)
  const nonPengelolaUsers = users.filter((u) => u.role !== 'pengelola');

  const daftar = nonPengelolaUsers.map((u) => {
    // Cari data sewa aktif untuk user ini
    const activeRental = penghuni.find((p) => p.userId === u.id && p.status === 'aktif');
    const room = activeRental ? kamar.find((k) => k.id === activeRental.kamarId) : null;

    return {
      id: u.id,
      nama: u.nama,
      email: u.email,
      noHp: u.noHp,
      role: u.role,
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
      sewa: activeRental
        ? {
            id: activeRental.id,
            kamarId: activeRental.kamarId,
            tanggalMulai: activeRental.tanggalMulai,
            tanggalSelesai: activeRental.tanggalSelesai,
            status: activeRental.status,
          }
        : null,
    };
  });

  let hasil = daftar;

  // Jika query ?tanpaSewa=true, tampilkan hanya pengguna yang belum memiliki sewa/kamar aktif
  if (String(tanpaSewa).toLowerCase() === 'true') {
    hasil = daftar.filter((p) => !p.sewa);
  }

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data penghuni berhasil diambil',
    data: hasil,
  });
});

module.exports = router;
