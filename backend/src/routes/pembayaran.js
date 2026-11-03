const express = require('express');
const { pembayaran, tagihan, users, kamar } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/pembayaran
 * Fitur 12: Antrean verifikasi pembayaran
 * Akses: Pengelola
 * Query params: ?status=menunggu (opsional)
 * Keterangan: Sertakan nama penghuni, kamar, dan periode tagihan
 */
router.get('/', authenticate, authorize('pengelola'), (req, res) => {
  const { status } = req.query;

  let hasil = pembayaran.map((p) => {
    const user = users.find((u) => u.id === p.userId);
    const bill = tagihan.find((t) => t.id === p.tagihanId);
    const room = bill ? kamar.find((k) => k.id === bill.kamarId) : null;

    const kodeKamar = room ? (room.kode || room.nomor) : (bill ? bill.kamarId : null);

    return {
      id: p.id,
      tagihanId: p.tagihanId,
      userId: p.userId,
      nominal: p.nominal,
      metode: p.metode,
      buktiFoto: p.buktiFoto,
      tanggalBayar: p.tanggalBayar,
      status: p.status,
      catatan: p.catatan,
      // Informasi gabungan yang diminta spesifikasi: nama penghuni, kamar, dan periode
      namaPenghuni: user ? user.nama : null,
      kamar: kodeKamar,
      periode: bill ? (bill.periode || bill.bulan) : null,
      // Detail tambahan objek pendukung
      penghuni: user
        ? {
            id: user.id,
            nama: user.nama,
            email: user.email,
            noHp: user.noHp,
          }
        : null,
      detailKamar: room
        ? {
            id: room.id,
            kode: room.kode || room.nomor,
            nomor: room.nomor || room.kode,
            lantai: room.lantai,
            tipe: room.tipe,
          }
        : null,
      detailTagihan: bill
        ? {
            id: bill.id,
            periode: bill.periode,
            bulan: bill.bulan,
            nominal: bill.nominal,
            jatuhTempo: bill.jatuhTempo,
            status: bill.status,
          }
        : null,
    };
  });

  // Filter status jika ada parameter query
  if (status) {
    const sTrim = status.trim().toLowerCase();
    if (sTrim === 'menunggu' || sTrim === 'pending') {
      hasil = hasil.filter(
        (p) => p.status.toLowerCase() === 'menunggu' || p.status.toLowerCase() === 'pending'
      );
    } else {
      hasil = hasil.filter((p) => p.status.toLowerCase() === sTrim);
    }
  }

  // Urutkan dari yang terbaru
  hasil.sort((a, b) => new Date(b.tanggalBayar) - new Date(a.tanggalBayar));

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data antrean pembayaran berhasil diambil',
    data: hasil,
  });
});

module.exports = router;
