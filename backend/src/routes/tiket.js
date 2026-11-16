const express = require('express');
const { tiket, kamar, users, buatNotifikasi } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');
const uploadGambar = require('../middleware/upload');

const router = express.Router();

/**
 * POST /api/v1/tiket
 * Fitur 6: Membuat tiket laporan kerusakan
 * Akses: Penghuni
 * Payload multipart: kategori, judul, deskripsi, foto (opsional), kamarId (opsional untuk area umum)
 * Efek:
 *  - Status awal 'pending'
 *  - Isi riwayat pertama
 *  - Kirim notifikasi ke pengelola
 */
router.post('/', authenticate, authorize('penghuni'), uploadGambar(['foto', 'gambar']), (req, res) => {
  const { kategori, judul, deskripsi, kamarId } = req.body;

  if (!judul || !deskripsi) {
    return res.status(400).json({
      status: false,
      success: false,
      message: 'Judul dan deskripsi laporan wajib diisi',
    });
  }

  const newId = tiket.length > 0 ? Math.max(...tiket.map((t) => t.id)) + 1 : 1;
  const nowIso = new Date().toISOString();

  // Simpan foto path jika diunggah
  const fotoPath = req.file ? req.file.relativePath : null;

  const kId = kamarId ? parseInt(kamarId, 10) : null;
  const room = kId ? kamar.find((k) => k.id === kId) : null;
  const kodeKamar = room ? (room.kode || room.nomor) : (kId || 'Area Umum');

  const newTiket = {
    id: newId,
    userId: req.user.id,
    kamarId: kId,
    kategori: kategori ? String(kategori).trim().toLowerCase() : 'lainnya',
    judul: String(judul).trim(),
    deskripsi: String(deskripsi).trim(),
    foto: fotoPath,
    status: 'pending',
    penanganan: null,
    riwayat: [
      {
        status: 'pending',
        catatan: 'Laporan kerusakan dibuat',
        tanggal: nowIso,
      },
    ],
    tanggalLapor: nowIso,
  };

  tiket.push(newTiket);

  // Kirim notifikasi ke pengelola
  const pengelolaUsers = users.filter((u) => u.role === 'pengelola');
  pengelolaUsers.forEach((p) => {
    buatNotifikasi(
      p.id,
      'tiket',
      'Laporan Kerusakan Baru',
      `Penghuni ${req.user.nama} (Kamar/Area: ${kodeKamar}) membuat laporan baru: ${newTiket.judul}.`,
      { tiketId: newId, userId: req.user.id }
    );
  });

  return res.status(201).json({
    status: true,
    success: true,
    message: 'Laporan kerusakan berhasil dibuat',
    data: newTiket,
  });
});

/**
 * GET /api/v1/tiket/saya
 * Fitur 7: Daftar tiket milik sendiri
 * Akses: Penghuni
 * Query params: ?status=
 */
router.get('/saya', authenticate, authorize('penghuni'), (req, res) => {
  const { status } = req.query;

  let myTickets = tiket
    .filter((t) => t.userId === req.user.id)
    .map((t) => {
      const room = t.kamarId ? kamar.find((k) => k.id === t.kamarId) : null;
      return {
        ...t,
        kamar: room ? (room.kode || room.nomor) : (t.kamarId || 'Area Umum'),
      };
    });

  if (status) {
    const sTrim = status.trim().toLowerCase();
    myTickets = myTickets.filter((t) => t.status.toLowerCase() === sTrim);
  }

  // Urutkan dari yang terbaru (tanggalLapor descending)
  myTickets.sort((a, b) => new Date(b.tanggalLapor) - new Date(a.tanggalLapor));

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data tiket saya berhasil diambil',
    data: myTickets,
  });
});

/**
 * GET /api/v1/tiket
 * Fitur 14: Semua tiket
 * Akses: Pengelola
 * Query params: ?status=pending&kategori=air
 */
router.get('/', authenticate, authorize('pengelola'), (req, res) => {
  const { status, kategori } = req.query;

  let hasil = tiket.map((t) => {
    const user = users.find((u) => u.id === t.userId);
    const room = t.kamarId ? kamar.find((k) => k.id === t.kamarId) : null;

    return {
      ...t,
      pelapor: user ? user.nama : null,
      kamar: room ? (room.kode || room.nomor) : (t.kamarId || 'Area Umum'),
      user: user
        ? {
            id: user.id,
            nama: user.nama,
            email: user.email,
            noHp: user.noHp,
          }
        : null,
    };
  });

  if (status) {
    const sTrim = status.trim().toLowerCase();
    hasil = hasil.filter((t) => t.status.toLowerCase() === sTrim);
  }

  if (kategori) {
    const kTrim = kategori.trim().toLowerCase();
    hasil = hasil.filter((t) => (t.kategori || '').toLowerCase() === kTrim);
  }

  // Urutkan dari yang terbaru
  hasil.sort((a, b) => new Date(b.tanggalLapor) - new Date(a.tanggalLapor));

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data seluruh tiket berhasil diambil',
    data: hasil,
  });
});

/**
 * GET /api/v1/tiket/:id
 * Fitur 7, 14: Detail tiket beserta riwayat status
 * Akses: Penghuni (miliknya) / Pengelola
 */
router.get('/:id', authenticate, authorize('penghuni', 'pengelola'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = tiket.find((t) => t.id === id);

  if (!item) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Tiket tidak ditemukan',
    });
  }

  // Cek kepemilikan jika user adalah penghuni
  if (req.user.role === 'penghuni' && item.userId !== req.user.id) {
    return res.status(403).json({
      status: false,
      success: false,
      message: 'Akses ditolak: Anda hanya dapat melihat tiket milik sendiri',
    });
  }

  const user = users.find((u) => u.id === item.userId);
  const room = item.kamarId ? kamar.find((k) => k.id === item.kamarId) : null;

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Detail tiket berhasil diambil',
    data: {
      ...item,
      pelapor: user ? user.nama : null,
      kamar: room ? (room.kode || room.nomor) : (item.kamarId || 'Area Umum'),
      user: user
        ? {
            id: user.id,
            nama: user.nama,
            email: user.email,
            noHp: user.noHp,
          }
        : null,
      detailKamar: room || null,
    },
  });
});

/**
 * PATCH /api/v1/tiket/:id/status
 * Fitur 14: Mengubah status tiket
 * Akses: Pengelola
 * Payload: { "status": "diproses" | "selesai", "catatan": "..." }
 * Aturan:
 *  - Urutan hanya maju: pending -> diproses -> selesai (selain itu balas 400)
 *  - Tambahkan entri ke riwayat
 *  - Kirim notifikasi ke pelapor
 */
router.patch('/:id/status', authenticate, authorize('pengelola'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = tiket.find((t) => t.id === id);

  if (!item) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Tiket tidak ditemukan',
    });
  }

  const { status, catatan } = req.body;

  if (!status) {
    return res.status(400).json({
      status: false,
      success: false,
      message: 'Status baru wajib diisi',
    });
  }

  const currentStatus = item.status.toLowerCase();
  const nextStatus = String(status).trim().toLowerCase();

  // Validasi urutan status: pending -> diproses -> selesai
  const isValidTransition =
    (currentStatus === 'pending' && nextStatus === 'diproses') ||
    (currentStatus === 'diproses' && nextStatus === 'selesai');

  if (!isValidTransition) {
    return res.status(400).json({
      status: false,
      success: false,
      message: `Transisi status tidak valid. Status saat ini '${currentStatus}' hanya dapat diubah ke '${
        currentStatus === 'pending' ? 'diproses' : currentStatus === 'diproses' ? 'selesai' : 'tidak ada (sudah selesai)'
      }'`,
    });
  }

  const nowIso = new Date().toISOString();
  item.status = nextStatus;
  if (catatan) {
    item.penanganan = String(catatan).trim();
  }

  if (!Array.isArray(item.riwayat)) {
    item.riwayat = [];
  }

  item.riwayat.push({
    status: nextStatus,
    catatan: catatan ? String(catatan).trim() : `Status diubah menjadi ${nextStatus}`,
    tanggal: nowIso,
  });

  // Kirim notifikasi ke pelapor (penghuni)
  const room = item.kamarId ? kamar.find((k) => k.id === item.kamarId) : null;
  const kodeKamar = room ? (room.kode || room.nomor) : (item.kamarId || 'Area Umum');

  buatNotifikasi(
    item.userId,
    'tiket',
    `Tiket ${nextStatus === 'diproses' ? 'Diproses' : 'Selesai'}`,
    `Laporan kerusakan '${item.judul}' (${kodeKamar}) kini berstatus '${nextStatus}'${
      item.penanganan ? `. Catatan: ${item.penanganan}` : '.'
    }`,
    { tiketId: item.id, status: nextStatus }
  );

  return res.status(200).json({
    status: true,
    success: true,
    message: `Status tiket berhasil diubah menjadi '${nextStatus}'`,
    data: item,
  });
});

module.exports = router;
