const express = require('express');
const { kamar, tagihan, pembayaran, tiket } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/dasbor
 * Fitur 8: Dasbor ringkasan
 * Akses: Pengelola
 * Data:
 *  - Kamar terisi dan total kamar
 *  - Pemasukan bulan ini (berdasarkan pembayaran yang diterima)
 *  - Jumlah penunggak (tagihan belum_bayar yang lewat jatuh tempo)
 *  - Pembayaran menunggu verifikasi
 *  - Tiket per status (pending, diproses, selesai)
 */
router.get('/', authenticate, authorize('pengelola'), (_req, res) => {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // 1. Kamar terisi / total
  const totalKamar = kamar.length;
  const kamarTerisi = kamar.filter((k) => (k.status || '').toLowerCase() === 'terisi').length;
  const kamarKosong = kamar.filter(
    (k) => (k.status || '').toLowerCase() === 'tersedia' || (k.status || '').toLowerCase() === 'kosong'
  ).length;

  // 2. Pemasukan bulan berjalan (misalnya Oktober 2026 atau bulan sekarang)
  // Hitung pembayaran berstatus 'diterima'
  const pembayaranDiterima = pembayaran.filter((p) => (p.status || '').toLowerCase() === 'diterima');
  const totalPemasukan = pembayaranDiterima.reduce((sum, p) => sum + (Number(p.nominal) || 0), 0);

  // 3. Jumlah penunggak (belum_bayar / belum_lunas & lewat jatuh tempo)
  const penunggak = tagihan.filter((t) => {
    const isUnpaid = t.status === 'belum_bayar' || t.status === 'belum_lunas';
    if (!isUnpaid || !t.jatuhTempo) return false;
    const dueDate = new Date(t.jatuhTempo);
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    return todayOnly > dueDateOnly;
  });

  // 4. Pembayaran menunggu verifikasi
  const menungguVerifikasi = pembayaran.filter(
    (p) => (p.status || '').toLowerCase() === 'menunggu' || (p.status || '').toLowerCase() === 'pending'
  ).length;

  // 5. Tiket per status
  const tiketPending = tiket.filter((t) => (t.status || '').toLowerCase() === 'pending').length;
  const tiketDiproses = tiket.filter((t) => (t.status || '').toLowerCase() === 'diproses').length;
  const tiketSelesai = tiket.filter((t) => (t.status || '').toLowerCase() === 'selesai').length;

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data ringkasan dasbor berhasil diambil',
    data: {
      kamar: {
        total: totalKamar,
        terisi: kamarTerisi,
        kosong: kamarKosong,
        rasio: `${kamarTerisi} dari ${totalKamar}`,
      },
      keuangan: {
        totalPemasukan,
        jumlahPenunggak: penunggak.length,
        pembayaranMenungguVerifikasi: menungguVerifikasi,
      },
      tiket: {
        total: tiket.length,
        pending: tiketPending,
        diproses: tiketDiproses,
        selesai: tiketSelesai,
      },
      ringkasan: {
        kamarTerisi: `${kamarTerisi} dari ${totalKamar}`,
        pemasukanBulanIni: totalPemasukan,
        penunggak: penunggak.length,
        menungguVerifikasi,
        tiketStatus: `${tiketPending} / ${tiketDiproses} / ${tiketSelesai}`,
      },
    },
  });
});

module.exports = router;
