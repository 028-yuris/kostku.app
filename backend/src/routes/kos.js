const express = require('express');
const { infoKos } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/kos
 * Fitur 16: Info kos
 * Akses: Publik
 * Deskripsi: nama, alamat, kontak WhatsApp, jam kunjung, aturan. Ditampilkan di detail kamar.
 */
router.get('/', (_req, res) => {
  return res.status(200).json({
    status: true,
    success: true,
    message: 'Informasi kos berhasil diambil',
    data: infoKos,
  });
});

/**
 * PUT /api/v1/kos
 * Fitur 16: Mengubah info kos, rekening, dan tanggal jatuh tempo
 * Akses: Pengelola
 */
router.put('/', authenticate, authorize('pengelola'), (req, res) => {
  const {
    nama,
    alamat,
    kontakWhatsApp,
    whatsapp,
    telepon,
    namaPengelola,
    jamKunjung,
    aturan,
    rekening,
    tanggalJatuhTempo,
    deskripsi,
  } = req.body;

  if (nama !== undefined) infoKos.nama = String(nama).trim();
  if (alamat !== undefined) infoKos.alamat = String(alamat).trim();
  if (telepon !== undefined) infoKos.telepon = String(telepon).trim();
  if (namaPengelola !== undefined) infoKos.namaPengelola = String(namaPengelola).trim();
  if (jamKunjung !== undefined) infoKos.jamKunjung = String(jamKunjung).trim();
  if (deskripsi !== undefined) infoKos.deskripsi = String(deskripsi).trim();

  // Kontak WhatsApp
  if (kontakWhatsApp !== undefined) {
    infoKos.kontakWhatsApp = String(kontakWhatsApp).trim();
    const cleanNumber = String(kontakWhatsApp).replace(/^0/, '').replace(/\D/g, '');
    infoKos.whatsapp = `https://wa.me/62${cleanNumber}`;
  } else if (whatsapp !== undefined) {
    infoKos.whatsapp = String(whatsapp).trim();
  }

  // Aturan
  if (aturan !== undefined) {
    if (Array.isArray(aturan)) {
      infoKos.aturan = aturan;
    } else if (typeof aturan === 'string') {
      try {
        const parsed = JSON.parse(aturan);
        infoKos.aturan = Array.isArray(parsed) ? parsed : [aturan];
      } catch {
        infoKos.aturan = aturan.split('\n').map((a) => a.trim()).filter(Boolean);
      }
    }
  }

  // Rekening
  if (rekening !== undefined) {
    if (typeof rekening === 'object' && rekening !== null) {
      infoKos.rekening = {
        ...infoKos.rekening,
        ...rekening,
      };
    }
  }

  // Tanggal jatuh tempo
  if (tanggalJatuhTempo !== undefined) {
    const tgl = Number(tanggalJatuhTempo);
    if (!isNaN(tgl) && tgl >= 1 && tgl <= 31) {
      infoKos.tanggalJatuhTempo = tgl;
    }
  }

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Informasi kos berhasil diperbarui',
    data: infoKos,
  });
});

module.exports = router;
