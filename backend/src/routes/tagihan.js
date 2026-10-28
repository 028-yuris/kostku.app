const express = require('express');
const { tagihan, penghuni, kamar, users, pembayaran, infoKos, buatNotifikasi } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/tagihan/saya
 * Fitur 11: Tagihan milik penghuni yang login, terbaru dulu
 * Akses: Penghuni
 * Fitur: Sertakan field hitungan terlambat
 */
router.get('/saya', authenticate, authorize('penghuni'), (req, res) => {
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let daftar = tagihan
    .filter((t) => t.userId === req.user.id)
    .map((t) => {
      const room = kamar.find((k) => k.id === t.kamarId);
      const payment = pembayaran ? pembayaran.find((p) => p.tagihanId === t.id) : null;

      // Hitungan terlambat: hanya berlaku jika status belum lunas
      let terlambat = false;
      let hariTerlambat = 0;

      if (t.status !== 'lunas') {
        const dueDate = new Date(t.jatuhTempo);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const diffMs = todayDateOnly - dueDateOnly;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          terlambat = true;
          hariTerlambat = diffDays;
        }
      }

      return {
        ...t,
        terlambat,
        hariTerlambat,
        kamar: room
          ? {
              id: room.id,
              kode: room.kode || room.nomor,
              nomor: room.nomor || room.kode,
              lantai: room.lantai,
              tipe: room.tipe,
              harga: room.harga,
            }
          : null,
        pembayaran: payment || null,
      };
    });

  // Urutkan terbaru dulu (berdasarkan jatuh tempo descending, lalu id descending)
  daftar.sort((a, b) => {
    if (b.jatuhTempo && a.jatuhTempo) {
      const cmp = new Date(b.jatuhTempo) - new Date(a.jatuhTempo);
      if (cmp !== 0) return cmp;
    }
    return b.id - a.id;
  });

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data tagihan saya berhasil diambil',
    data: daftar,
  });
});

/**
 * GET /api/v1/tagihan
 * Fitur: Semua tagihan
 * Akses: Pengelola
 * Query params: ?periode=2026-10&status=belum_bayar (opsional)
 */
router.get('/', authenticate, authorize('pengelola'), (req, res) => {
  const { periode, status } = req.query;

  let hasil = tagihan.map((t) => {
    const user = users.find((u) => u.id === t.userId);
    const room = kamar.find((k) => k.id === t.kamarId);

    return {
      ...t,
      user: user
        ? {
            id: user.id,
            nama: user.nama,
            email: user.email,
            noHp: user.noHp,
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
          }
        : null,
    };
  });

  // Filter periode
  if (periode) {
    const pTrim = periode.trim().toLowerCase();
    hasil = hasil.filter(
      (t) => (t.periode && t.periode.toLowerCase() === pTrim) ||
             (t.bulan && t.bulan.toLowerCase().includes(pTrim))
    );
  }

  // Filter status (mendukung belum_bayar dan belum_lunas)
  if (status) {
    const sTrim = status.trim().toLowerCase();
    if (sTrim === 'belum_bayar' || sTrim === 'belum_lunas') {
      hasil = hasil.filter(
        (t) => t.status.toLowerCase() === 'belum_bayar' || t.status.toLowerCase() === 'belum_lunas'
      );
    } else {
      hasil = hasil.filter((t) => t.status.toLowerCase() === sTrim);
    }
  }

  return res.status(200).json({
    status: true,
    success: true,
    message: 'Data tagihan berhasil diambil',
    data: hasil,
  });
});

/**
 * POST /api/v1/tagihan/generate
 * Fitur 11: Membuat tagihan satu periode untuk semua sewa aktif
 * Akses: Pengelola
 * Payload: { "periode": "2026-11" }
 * Aturan:
 *  - Jumlah dari hargaDisepakati (atau harga kamar)
 *  - Jatuh tempo dari kos.tanggalJatuhTempo (misal "2026-11-10")
 *  - Lewati yang sudah ada (unik per sewaId + periode)
 *  - Panggil buatNotifikasi ke tiap penghuni
 */
router.post('/generate', authenticate, authorize('pengelola'), (req, res) => {
  const { periode } = req.body;

  if (!periode || typeof periode !== 'string' || !periode.trim()) {
    return res.status(400).json({
      status: false,
      success: false,
      message: 'Periode tagihan wajib diisi (contoh format: "2026-11")',
    });
  }

  const periodeTrimmed = periode.trim();

  // Tanggal jatuh tempo dari kos.tanggalJatuhTempo (default 10)
  const tglJatuhTempo = infoKos.tanggalJatuhTempo || 10;
  const padTgl = String(tglJatuhTempo).padStart(2, '0');
  const jatuhTempo = `${periodeTrimmed}-${padTgl}`;

  // Ambil semua sewa aktif
  const activeLeases = penghuni.filter((s) => s.status === 'aktif');

  const createdList = [];
  let skippedCount = 0;

  activeLeases.forEach((s) => {
    // Lewati yang sudah ada (unik per sewaId + periode)
    const alreadyExists = tagihan.some(
      (t) => ((t.sewaId && t.sewaId === s.id) || (t.userId === s.userId && t.kamarId === s.kamarId)) &&
             (t.periode === periodeTrimmed || t.bulan === periodeTrimmed)
    );

    if (alreadyExists) {
      skippedCount++;
      return;
    }

    // Jumlah dari hargaDisepakati (atau harga kamar)
    const room = kamar.find((k) => k.id === s.kamarId);
    const nominal = s.hargaDisepakati !== undefined ? s.hargaDisepakati : (room ? room.harga : 0);

    const newId = tagihan.length > 0 ? Math.max(...tagihan.map((t) => t.id)) + 1 : 1;
    const kodeKamar = room ? (room.kode || room.nomor) : s.kamarId;

    const newTagihan = {
      id: newId,
      sewaId: s.id,
      userId: s.userId,
      kamarId: s.kamarId,
      periode: periodeTrimmed,
      bulan: periodeTrimmed,
      nominal: Number(nominal),
      jatuhTempo,
      status: 'belum_lunas',
      catatan: `Tagihan sewa kamar ${kodeKamar} periode ${periodeTrimmed}`,
      createdAt: new Date().toISOString(),
    };

    tagihan.push(newTagihan);
    createdList.push(newTagihan);

    // Panggil buatNotifikasi ke tiap penghuni
    buatNotifikasi(
      s.userId,
      'tagihan',
      'Tagihan Baru Diterbitkan',
      `Tagihan sewa kamar ${kodeKamar} periode ${periodeTrimmed} sebesar Rp ${Number(nominal).toLocaleString('id-ID')} telah diterbitkan. Jatuh tempo pada ${jatuhTempo}.`,
      { tagihanId: newId, sewaId: s.id, periode: periodeTrimmed }
    );
  });

  return res.status(201).json({
    status: true,
    success: true,
    message: `Berhasil membuat ${createdList.length} tagihan untuk periode ${periodeTrimmed}${skippedCount > 0 ? ` (${skippedCount} sewa dilewati karena sudah memiliki tagihan pada periode ini)` : ''}`,
    data: {
      periode: periodeTrimmed,
      totalDibuat: createdList.length,
      totalDilewati: skippedCount,
      tagihan: createdList,
    },
  });
});

module.exports = router;
