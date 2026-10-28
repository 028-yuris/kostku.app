const express = require('express');
const { kamar, penghuni, aturanKost, kontakPengelola } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');
const uploadGambar = require('../middleware/upload');

const router = express.Router();

/**
 * GET /api/v1/kamar
 * Fitur 9, 15: Daftar kamar
 * Akses: Publik
 * Query params: ?status=kosong (untuk katalog calon penghuni)
 * Keterangan: Satu endpoint dipakai dua layar (Pengelola & Calon Penghuni)
 */
router.get('/', (req, res) => {
  const { status } = req.query;

  let hasil = [...kamar];

  if (status) {
    const statusQuery = status.toString().trim().toLowerCase();

    // Dukung filter ?status=kosong atau ?status=tersedia
    if (statusQuery === 'kosong' || statusQuery === 'tersedia') {
      hasil = hasil.filter(
        (k) => k.status.toLowerCase() === 'tersedia' || k.status.toLowerCase() === 'kosong'
      );
    } else {
      hasil = hasil.filter((k) => k.status.toLowerCase() === statusQuery);
    }
  }

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data kamar berhasil diambil',
    data: hasil,
  });
});

/**
 * GET /api/v1/kamar/:id
 * Fitur 16: Detail satu kamar (foto, fasilitas, harga, status, aturan kos, kontak pengelola)
 * Akses: Publik
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = kamar.find((k) => k.id === id);

  if (!item) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Kamar tidak ditemukan',
    });
  }

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Detail kamar berhasil diambil',
    data: {
      ...item,
      aturanKost,
      kontakPengelola,
    },
  });
});

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
    foto: req.file ? [req.file.relativePath] : (Array.isArray(foto) ? foto : (foto ? [foto] : [])),
  };

  kamar.push(newKamar);

  return res.status(201).json({
    status: true,
    success: true,
    message: 'Kamar berhasil ditambahkan',
    data: newKamar,
  });
});

/**
 * PUT /api/v1/kamar/:id
 * Fitur 9: Mengubah data kamar (harga, fasilitas, status perawatan, dll)
 * Akses: Pengelola
 */
router.put('/:id', authenticate, authorize('pengelola'), uploadGambar(['foto', 'gambar']), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = kamar.findIndex((k) => k.id === id);

  if (index === -1) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Kamar tidak ditemukan',
    });
  }

  const { kode, nomor, lantai, luas, harga, fasilitas, status, tipe, deskripsi, foto } = req.body;
  const newKode = kode || nomor;

  // Jika kode diubah, pastikan tidak duplikat dengan kamar lain
  if (newKode) {
    const formattedKode = String(newKode).trim();
    const isDuplicate = kamar.some(
      (k) => k.id !== id && (
        (k.kode && k.kode.toLowerCase() === formattedKode.toLowerCase()) ||
        (k.nomor && k.nomor.toLowerCase() === formattedKode.toLowerCase())
      )
    );

    if (isDuplicate) {
      return res.status(400).json({
        status: false,
        success: false,
        message: `Kode kamar '${formattedKode}' sudah digunakan kamar lain`,
      });
    }
  }

  // Format fasilitas jika dikirim
  let fasilitasArray = kamar[index].fasilitas;
  if (fasilitas !== undefined) {
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
  }

  const current = kamar[index];
  const updatedKamar = {
    ...current,
    kode: newKode ? String(newKode).trim() : current.kode,
    nomor: newKode ? String(newKode).trim() : current.nomor,
    lantai: lantai !== undefined ? Number(lantai) : current.lantai,
    luas: luas !== undefined ? String(luas).trim() : current.luas,
    harga: harga !== undefined ? Number(harga) : current.harga,
    fasilitas: fasilitasArray,
    status: status !== undefined ? String(status).trim() : current.status,
    tipe: tipe !== undefined ? String(tipe).trim() : current.tipe,
    deskripsi: deskripsi !== undefined ? String(deskripsi).trim() : current.deskripsi,
    foto: req.file
      ? (Array.isArray(current.foto) ? [...current.foto, req.file.relativePath] : [req.file.relativePath])
      : (foto !== undefined ? (Array.isArray(foto) ? foto : [foto]) : current.foto),
  };

  kamar[index] = updatedKamar;

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data kamar berhasil diperbarui',
    data: updatedKamar,
  });
});

/**
 * POST /api/v1/kamar/:id/foto
 * Fitur 9, 16: Mengunggah foto kamar
 * Akses: Pengelola
 * Multipart: Menerima file foto dan menyimpan path relatif ke foto[]
 */
router.post('/:id/foto', authenticate, authorize('pengelola'), uploadGambar(['foto', 'gambar']), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = kamar.find((k) => k.id === id);

  if (!item) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Kamar tidak ditemukan',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      status: false,
      success: false,
      message: 'File foto wajib diunggah',
    });
  }

  // Pastikan properti foto berbentuk array
  if (!Array.isArray(item.foto)) {
    item.foto = item.foto ? [item.foto] : [];
  }

  // Simpan path relatif ke foto[]
  item.foto.push(req.file.relativePath);

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Foto kamar berhasil diunggah',
    data: {
      id: item.id,
      kode: item.kode,
      foto: item.foto,
      uploaded: req.file.relativePath,
    },
  });
});

/**
 * DELETE /api/v1/kamar/:id
 * Fitur 9: Menghapus kamar
 * Akses: Pengelola
 * Validasi: Tolak dengan 409 jika masih ada sewa aktif
 */
router.delete('/:id', authenticate, authorize('pengelola'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = kamar.findIndex((k) => k.id === id);

  if (index === -1) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Kamar tidak ditemukan',
    });
  }

  // Cek apakah ada sewa/penghuni aktif pada kamar ini
  const hasActiveRental = penghuni.some((p) => p.kamarId === id && p.status === 'aktif') || kamar[index].status === 'terisi';

  if (hasActiveRental) {
    return res.status(409).json({
      status: false,
      success: false,
      message: 'Tidak dapat menghapus kamar: masih ada sewa aktif atau penghuni di kamar ini',
    });
  }

  const deletedKamar = kamar.splice(index, 1)[0];

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Kamar berhasil dihapus',
    data: deletedKamar,
  });
});

module.exports = router;

