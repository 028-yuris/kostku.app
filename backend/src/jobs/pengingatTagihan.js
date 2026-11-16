const { tagihan, notifikasi, kamar, users, buatNotifikasi } = require('../data/mock');

/**
 * Menjalankan pemeriksaan dan pembuatan notifikasi pengingat jatuh tempo
 * Sesuai aturan:
 *  - H-3 sebelum jatuh tempo
 *  - Hari H jatuh tempo
 *  - Terlambat (lewat jatuh tempo)
 *  - Mencegah duplikasi notifikasi per tagihan per hari
 */
function jalankanPengingatJatuhTempo() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let totalPengingat = 0;

  tagihan.forEach((t) => {
    // Hanya tagihan yang belum dibayar / belum lunas
    const isUnpaid = t.status === 'belum_bayar' || t.status === 'belum_lunas';
    if (!isUnpaid || !t.jatuhTempo) return;

    const dueDate = new Date(t.jatuhTempo);
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffMs = todayOnly - dueDateOnly;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let jenisPengingat = null;
    let judul = '';
    let isi = '';

    const room = kamar.find((k) => k.id === t.kamarId);
    const kodeKamar = room ? (room.kode || room.nomor) : (t.kamarId || '');
    const nominalRp = Number(t.nominal).toLocaleString('id-ID');

    if (diffDays === -3) {
      // H-3
      jenisPengingat = 'h-3';
      judul = 'Pengingat Tagihan (H-3)';
      isi = `Tagihan sewa kamar ${kodeKamar} periode ${t.periode || t.bulan} sebesar Rp ${nominalRp} akan jatuh tempo dalam 3 hari (${t.jatuhTempo}).`;
    } else if (diffDays === 0) {
      // Hari H
      jenisPengingat = 'hari-h';
      judul = 'Tagihan Jatuh Tempo Hari Ini';
      isi = `Hari ini adalah tanggal jatuh tempo pembayaran sewa kamar ${kodeKamar} periode ${t.periode || t.bulan} sebesar Rp ${nominalRp}.`;
    } else if (diffDays > 0) {
      // Terlambat
      jenisPengingat = 'terlambat';
      judul = 'Tagihan Melewati Jatuh Tempo';
      isi = `Tagihan sewa kamar ${kodeKamar} periode ${t.periode || t.bulan} telah melewati tanggal jatuh tempo (${diffDays} hari terlambat). Segera lakukan pembayaran.`;
    }

    if (!jenisPengingat) return;

    // Cek duplikasi: jangan kirim notifikasi tipe 'pengingat_tagihan' untuk tagihanId dan jenis yang sama pada hari ini
    const isAlreadySentToday = notifikasi.some((n) => {
      if (n.userId !== t.userId || n.tipe !== 'pengingat_tagihan') return false;
      if (!n.ref || n.ref.tagihanId !== t.id || n.ref.jenis !== jenisPengingat) return false;
      const notifDate = n.createdAt ? n.createdAt.split('T')[0] : '';
      return notifDate === todayStr;
    });

    if (!isAlreadySentToday) {
      buatNotifikasi(t.userId, 'pengingat_tagihan', judul, isi, {
        tagihanId: t.id,
        jenis: jenisPengingat,
        tanggalKirim: todayStr,
      });
      totalPengingat++;
    }
  });

  return totalPengingat;
}

/**
 * Menjadwalkan cron / interval harian
 */
function mulaiSchedulerPengingat() {
  // Jalankan sekali saat server booting
  jalankanPengingatJatuhTempo();

  // Jadwalkan pemeriksaan berkala (setiap 24 jam)
  const SATU_HARI_MS = 24 * 60 * 60 * 1000;
  const timer = setInterval(() => {
    jalankanPengingatJatuhTempo();
  }, SATU_HARI_MS);
  if (timer.unref) {
    timer.unref();
  }
}

module.exports = {
  jalankanPengingatJatuhTempo,
  mulaiSchedulerPengingat,
};
