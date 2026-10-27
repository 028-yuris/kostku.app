const express = require('express');
const { kamar } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');
const uploadGambar = require('../middleware/upload');

const router = express.Router();

/**
 * POST /api/v1/kamar
 * Fitur 9: Menambah kamar
 * Akses: Pengelola
 * Payload: kode, lantai, luas, harga, fasilitas[], status (dan foto opsional)
 * Validasi: kode kamar unik
 */
router.post('/', authenticate, authorize('pengelola'), uploadGambar(['foto', 'gambar']), (req, res) => {
  const { kode, nomor, lantai, luas, harga, fasilitas, status, tipe, deskripsi, foto } = req.body;

  const kodeKamar = kode || nomor;

  // 1. Validasi input wajib
  if (!kodeKamar || lantai === undefined || harga === undefined) {
    return res.status(400).json({
      status: false,
      success: false,
      message: 'Kode kamar, lantai, dan harga wajib diisi',
    });
  }

  // 2. Validasi kode unik (case-insensitive)
  const formattedKode = String(kodeKamar).trim();
  const isDuplicate = kamar.some(
    (k) => (k.kode && k.kode.toLowerCase() === formattedKode.toLowerCase()) ||
           (k.nomor && k.nomor.toLowerCase() === formattedKode.toLowerCase())
  );

  if (isDuplicate) {
    return res.status(400).json({
      status: false,
      success: false,
      message: `Kode kamar '${formattedKode}' sudah terdaftar`,
    });
  }

  // 3. Format fasilitas (array)
  let fasilitasArray = [];
  if (Array.isArray(fasilitas)) {
    fasilitasArray = fasilitas;
  } else if (typeof fasilitas === 'string') {
    try {
      const parsed = JSON.parse(fasilitas);
      fasilitasArray = Array.isArray(parsed) ? parsed : [fasilitas];
    } catch {
      fasilitasArray = fasilitas.split(',').map((f) => f.trim()).filter(Boolean);
    }
  }

  // 4. Buat data kamar baru
  const newKamar = {
    id: kamar.length > 0 ? Math.max(...kamar.map((k) => k.id)) + 1 : 1,
    kode: formattedKode,
    nomor: formattedKode,
    lantai: Number(lantai),
    luas: luas ? String(luas).trim() : '',
    tipe: tipe ? String(tipe).trim() : 'Standard',
    harga: Number(harga),
    fasilitas: fasilitasArray,
    status: status ? String(status).trim() : 'tersedia',
    deskripsi: deskripsi ? String(deskripsi).trim() : '',
    foto: req.file ? req.file.relativePath : (foto || ''),
  };

  kamar.push(newKamar);

  return res.status(201).json({
    status: true,
    success: true,
    message: 'Kamar berhasil ditambahkan',
    data: newKamar,
  });
});

module.exports = router;
