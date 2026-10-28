const express = require('express');
const { tagihan, penghuni, kamar, infoKos, buatNotifikasi } = require('../data/mock');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

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
