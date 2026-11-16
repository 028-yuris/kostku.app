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
 * POST /api/v1/sewa
 * Fitur 10: Menempatkan penghuni ke kamar
 * Akses: Pengelola
 * Payload: { userId, kamarId, tanggalMasuk, hargaDisepakati, deposit, tanggalSelesai }
 * Validasi:
 *  - userId dan kamarId wajib
 *  - User harus ada
 *  - Kamar harus ada
 *  - Kamar tidak boleh terisi atau perawatan (harus tersedia/kosong)
 *  - User belum punya sewa aktif
 * Efek:
 *  - Buat data sewa baru berstatus 'aktif'
 *  - Jika role user sebelumnya 'calon_penghuni', dapat diubah jadi 'penghuni'
 *  - Status kamar berubah menjadi 'terisi'
 */
router.post('/', authenticate, authorize('pengelola'), (req, res) => {
  const { userId, kamarId, tanggalMasuk, hargaDisepakati, deposit, tanggalSelesai } = req.body;

  if (!userId || !kamarId) {
    return res.status(400).json({
      status: false,
      success: false,
      message: 'userId dan kamarId wajib diisi',
    });
  }

  const uId = parseInt(userId, 10);
  const kId = parseInt(kamarId, 10);

  const targetUser = users.find((u) => u.id === uId);
  if (!targetUser) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Pengguna tidak ditemukan',
    });
  }

  const targetKamar = kamar.find((k) => k.id === kId);
  if (!targetKamar) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Kamar tidak ditemukan',
    });
  }

  // Validasi: kamar tidak boleh terisi atau perawatan
  const kamarStatus = (targetKamar.status || '').toLowerCase();
  if (kamarStatus === 'terisi') {
    return res.status(409).json({
      status: false,
      success: false,
      message: 'Kamar sudah terisi oleh penghuni lain',
    });
  }
  if (kamarStatus === 'perawatan') {
    return res.status(409).json({
      status: false,
      success: false,
      message: 'Kamar sedang dalam masa perawatan',
    });
  }

  // Validasi: user belum punya sewa aktif
  const existingActive = penghuni.find((s) => s.userId === uId && s.status === 'aktif');
  if (existingActive) {
    return res.status(409).json({
      status: false,
      success: false,
      message: 'Pengguna sudah memiliki sewa aktif pada kamar lain',
    });
  }

  const nowStr = new Date().toISOString().split('T')[0];
  const tglMulai = tanggalMasuk ? String(tanggalMasuk).trim() : nowStr;
  const nominalDisepakati = hargaDisepakati !== undefined ? Number(hargaDisepakati) : targetKamar.harga;

  const newId = penghuni.length > 0 ? Math.max(...penghuni.map((s) => s.id)) + 1 : 1;

  const newSewa = {
    id: newId,
    userId: uId,
    kamarId: kId,
    nama: targetUser.nama,
    noHp: targetUser.noHp,
    hargaDisepakati: nominalDisepakati,
    deposit: deposit !== undefined ? Number(deposit) : 0,
    tanggalMulai: tglMulai,
    tanggalMasuk: tglMulai,
    tanggalSelesai: tanggalSelesai ? String(tanggalSelesai).trim() : null,
    status: 'aktif',
  };

  penghuni.push(newSewa);

  // Efek: status kamar menjadi terisi
  targetKamar.status = 'terisi';

  // Efek pendukung: ubah role calon_penghuni menjadi penghuni
  if (targetUser.role === 'calon_penghuni') {
    targetUser.role = 'penghuni';
  }

  return res.status(201).json({
    status: true,
    success: true,
    message: 'Penghuni berhasil ditempatkan ke kamar',
    data: {
      sewa: newSewa,
      kamar: targetKamar,
      user: {
        id: targetUser.id,
        nama: targetUser.nama,
        email: targetUser.email,
        role: targetUser.role,
      },
    },
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
