const express = require('express');
const { pembayaran, tagihan, users, kamar, buatNotifikasi } = require('../data/mock');
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

/**
 * PATCH /api/v1/pembayaran/:id/verifikasi
 * Fitur 12: Verifikasi bukti pembayaran
 * Akses: Pengelola
 * Body: { "keputusan": "diterima" | "ditolak", "catatan": "..." }
 * Aturan:
 *  - Hanya untuk pembayaran berstatus 'menunggu' (atau 'pending')
 *  - Jika diterima:
 *      * Status pembayaran menjadi 'diterima'
 *      * Status tagihan menjadi 'lunas'
 *  - Jika ditolak:
 *      * Catatan wajib diisi
 *      * Status pembayaran menjadi 'ditolak'
 *      * Status tagihan kembali 'belum_bayar'
 *  - Kirim notifikasi ke penghuni terkait
 */
router.patch('/:id/verifikasi', authenticate, authorize('pengelola'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const payment = pembayaran.find((p) => p.id === id);

  if (!payment) {
    return res.status(404).json({
      status: false,
      success: false,
      message: 'Data pembayaran tidak ditemukan',
    });
  }

  // 1. Validasi: Hanya untuk pembayaran yang berstatus menunggu
  if (payment.status !== 'menunggu' && payment.status !== 'pending') {
    return res.status(400).json({
      status: false,
      success: false,
      message: `Pembayaran sudah diproses sebelumnya dengan status '${payment.status}'`,
    });
  }

  const { keputusan, catatan } = req.body;

  // 2. Validasi input keputusan
  if (!keputusan || (keputusan !== 'diterima' && keputusan !== 'ditolak')) {
    return res.status(400).json({
      status: false,
      success: false,
      message: "Keputusan tidak valid. Nilai yang diperbolehkan adalah 'diterima' atau 'ditolak'",
    });
  }

  // 3. Validasi penolakan: catatan wajib
  if (keputusan === 'ditolak' && (!catatan || !String(catatan).trim())) {
    return res.status(400).json({
      status: false,
      success: false,
      message: 'Catatan wajib diisi saat menolak pembayaran',
    });
  }

  const bill = tagihan.find((t) => t.id === payment.tagihanId);
  const room = bill ? kamar.find((k) => k.id === bill.kamarId) : null;
  const kodeKamar = room ? (room.kode || room.nomor) : (bill ? bill.kamarId : '');
  const periodeStr = bill ? (bill.periode || bill.bulan) : '';

  // 4. Proses perubahan status
  payment.status = keputusan;
  if (catatan) {
    payment.catatan = String(catatan).trim();
  }

  if (keputusan === 'diterima') {
    if (bill) {
      bill.status = 'lunas';
    }

    // Kirim notifikasi ke penghuni: pembayaran diterima
    buatNotifikasi(
      payment.userId,
      'pembayaran',
      'Pembayaran Diterima',
      `Pembayaran Anda untuk tagihan sewa kamar ${kodeKamar} periode ${periodeStr} telah diverifikasi dan diterima. Terima kasih!`,
      { tagihanId: payment.tagihanId, pembayaranId: payment.id, status: 'diterima' }
    );
  } else {
    // Ditolak: tagihan kembali menjadi belum_bayar
    if (bill) {
      bill.status = 'belum_bayar';
    }

    // Kirim notifikasi ke penghuni: pembayaran ditolak beserta alasannya
    buatNotifikasi(
      payment.userId,
      'pembayaran',
      'Pembayaran Ditolak',
      `Pembayaran Anda untuk tagihan sewa kamar ${kodeKamar} periode ${periodeStr} ditolak oleh pengelola. Alasan: ${payment.catatan}. Silakan lakukan pembayaran ulang.`,
      { tagihanId: payment.tagihanId, pembayaranId: payment.id, status: 'ditolak' }
    );
  }

  return res.status(200).json({
    status: true,
    success: true,
    message: `Pembayaran berhasil ${keputusan === 'diterima' ? 'diverifikasi dan diterima' : 'ditolak'}`,
    data: {
      pembayaran: payment,
      tagihan: bill || null,
    },
  });
});

module.exports = router;
