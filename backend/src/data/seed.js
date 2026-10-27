/**
 * Skrip Seeding Kostku
 * Menjalankan pengisian data awal dari data/mock.js ke in-memory database
 * Penggunaan: node src/data/seed.js atau npm run seed
 */

const {
  users,
  kamar,
  penghuni,
  tagihan,
  pembayaran,
  tiket,
  resetMockData,
} = require('./mock');

function seedDatabase() {
  console.log('==================================================');
  console.log('           MENJALANKAN SEEDING KOSTKU            ');
  console.log('==================================================');

  const counts = resetMockData();

  console.log(`[✓] Berhasil memuat ${counts.usersCount} data pengguna (users)`);
  console.log(`    - Pengelola: ${users.filter((u) => u.role === 'pengelola').map((u) => u.nama).join(', ')}`);
  console.log(`    - Penghuni : ${users.filter((u) => u.role === 'penghuni').map((u) => u.nama).join(', ')}`);
  console.log(`[✓] Berhasil memuat ${counts.kamarCount} data kamar (kamar/rooms)`);
  console.log(`    - Terisi: ${kamar.filter((k) => k.status === 'terisi').length} kamar`);
  console.log(`    - Tersedia: ${kamar.filter((k) => k.status === 'tersedia').length} kamar`);
  console.log(`[✓] Berhasil memuat ${counts.penghuniCount} data penempatan penghuni (penghuni/tenants)`);
  console.log(`[✓] Berhasil memuat ${counts.tagihanCount} data tagihan (tagihan/bills)`);
  console.log(`    - Lunas: ${tagihan.filter((t) => t.status === 'lunas').length}`);
  console.log(`    - Menunggu Verifikasi: ${tagihan.filter((t) => t.status === 'menunggu_verifikasi').length}`);
  console.log(`    - Belum Lunas: ${tagihan.filter((t) => t.status === 'belum_lunas').length}`);
  console.log(`[✓] Berhasil memuat ${counts.pembayaranCount} data riwayat pembayaran (pembayaran/payments)`);
  console.log(`[✓] Berhasil memuat ${counts.tiketCount} data laporan kerusakan (tiket/tickets)`);
  console.log(`[✓] Berhasil memuat ${counts.notifikasiCount} data notifikasi (notifikasi/notifications)`);
  console.log('==================================================');
  console.log(' Seeding selesai! Data siap dipakai untuk pengetesan.');
  console.log('==================================================\n');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
