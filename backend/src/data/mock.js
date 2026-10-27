/**
 * Data Mock Kostku
 * Digunakan sebagai sumber data (in-memory database) untuk testing Postman, Emulator, dan Web.
 */

const initialUsers = [
  { id: 1, role: 'pengelola', nama: 'Hendra Wijaya', email: 'hendra@kostku.test', noHp: '081234567890', password: 'password123' },
  { id: 2, role: 'penghuni', nama: 'Alya Putri', email: 'alya@kostku.test', noHp: '081211110001', password: 'password123' },
  { id: 3, role: 'penghuni', nama: 'Bima Saputra', email: 'bima@kostku.test', noHp: '081211110002', password: 'password123' },
  { id: 4, role: 'penghuni', nama: 'Citra Dewi', email: 'citra@kostku.test', noHp: '081211110003', password: 'password123' },
  { id: 5, role: 'calon_penghuni', nama: 'Doni Pratama', email: 'doni@kostku.test', noHp: '081211110004', password: 'password123' },
];

const initialKamar = [
  {
    id: 1,
    nomor: '101',
    lantai: 1,
    tipe: 'Standard',
    harga: 1200000,
    fasilitas: ['Kasur Single', 'Lemari Pakaian', 'Wi-Fi', 'Kamar Mandi Luar'],
    status: 'terisi',
    deskripsi: 'Kamar lantai 1 dengan sirkulasi udara baik dan dekat dengan dapur bersama.',
    foto: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'
  },
  {
    id: 2,
    nomor: '102',
    lantai: 1,
    tipe: 'Deluxe',
    harga: 1600000,
    fasilitas: ['AC', 'Kasur Springbed', 'Lemari Pakaian', 'Meja Belajar', 'Wi-Fi', 'Kamar Mandi Dalam'],
    status: 'terisi',
    deskripsi: 'Kamar deluxe dengan kamar mandi dalam dan pendingin ruangan AC.',
    foto: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600'
  },
  {
    id: 3,
    nomor: '201',
    lantai: 2,
    tipe: 'Deluxe',
    harga: 1600000,
    fasilitas: ['AC', 'Kasur Springbed', 'Lemari Pakaian', 'Meja Belajar', 'Wi-Fi', 'Kamar Mandi Dalam'],
    status: 'terisi',
    deskripsi: 'Kamar deluxe lantai 2 dengan pencahayaan alami yang luas.',
    foto: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600'
  },
  {
    id: 4,
    nomor: '202',
    lantai: 2,
    tipe: 'VIP',
    harga: 2000000,
    fasilitas: ['AC', 'Water Heater', 'Smart TV', 'Kasur Queen', 'Kamar Mandi Dalam', 'Balkon Pribadi', 'Wi-Fi'],
    status: 'tersedia',
    deskripsi: 'Kamar VIP paling luas dengan balkon pribadi dan fasilitas lengkap.',
    foto: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600'
  },
  {
    id: 5,
    nomor: '203',
    lantai: 2,
    tipe: 'Standard',
    harga: 1200000,
    fasilitas: ['Kasur Single', 'Lemari Pakaian', 'Wi-Fi', 'Kamar Mandi Luar'],
    status: 'tersedia',
    deskripsi: 'Kamar standard nyaman dan tenang di lantai 2.',
    foto: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'
  },
];

const initialPenghuni = [
  {
    id: 1,
    userId: 2,
    kamarId: 1,
    nama: 'Alya Putri',
    noHp: '081211110001',
    tanggalMulai: '2026-01-01',
    tanggalSelesai: '2026-12-31',
    status: 'aktif'
  },
  {
    id: 2,
    userId: 3,
    kamarId: 2,
    nama: 'Bima Saputra',
    noHp: '081211110002',
    tanggalMulai: '2026-02-01',
    tanggalSelesai: '2026-12-31',
    status: 'aktif'
  },
  {
    id: 3,
    userId: 4,
    kamarId: 3,
    nama: 'Citra Dewi',
    noHp: '081211110003',
    tanggalMulai: '2026-03-01',
    tanggalSelesai: '2026-12-31',
    status: 'aktif'
  },
];

const initialTagihan = [
  {
    id: 1,
    userId: 2,
    kamarId: 1,
    bulan: 'Oktober 2026',
    nominal: 1200000,
    jatuhTempo: '2026-10-10',
    status: 'lunas',
    catatan: 'Tagihan sewa kamar 101 Oktober 2026'
  },
  {
    id: 2,
    userId: 3,
    kamarId: 2,
    bulan: 'Oktober 2026',
    nominal: 1600000,
    jatuhTempo: '2026-10-10',
    status: 'menunggu_verifikasi',
    catatan: 'Tagihan sewa kamar 102 Oktober 2026'
  },
  {
    id: 3,
    userId: 4,
    kamarId: 3,
    bulan: 'Oktober 2026',
    nominal: 1600000,
    jatuhTempo: '2026-10-05',
    status: 'belum_lunas',
    catatan: 'Tagihan sewa kamar 201 Oktober 2026 (Menunggak)'
  },
  {
    id: 4,
    userId: 2,
    kamarId: 1,
    bulan: 'November 2026',
    nominal: 1200000,
    jatuhTempo: '2026-11-10',
    status: 'belum_lunas',
    catatan: 'Tagihan sewa kamar 101 November 2026'
  },
];

const initialPembayaran = [
  {
    id: 1,
    tagihanId: 1,
    userId: 2,
    nominal: 1200000,
    metode: 'Transfer Bank BCA',
    buktiFoto: 'https://placehold.co/600x800/png?text=Bukti+Transfer+Alya',
    tanggalBayar: '2026-10-08T09:30:00Z',
    status: 'diterima',
    catatan: 'Pembayaran valid dan telah diverifikasi'
  },
  {
    id: 2,
    tagihanId: 2,
    userId: 3,
    nominal: 1600000,
    metode: 'Transfer Bank Mandiri',
    buktiFoto: 'https://placehold.co/600x800/png?text=Bukti+Transfer+Bima',
    tanggalBayar: '2026-10-10T14:15:00Z',
    status: 'pending',
    catatan: 'Menunggu verifikasi pengelola'
  },
];

const initialTiket = [
  {
    id: 1,
    userId: 2,
    kamarId: 1,
    judul: 'Kran wastafel bocor',
    deskripsi: 'Kran air di wastafel menetes terus dan tidak bisa ditutup rapat.',
    foto: 'https://placehold.co/600x400/png?text=Foto+Kran+Bocor',
    status: 'selesai',
    penanganan: 'Kran diganti baru oleh teknisi pada 13 Oktober 2026',
    tanggalLapor: '2026-10-12T10:00:00Z'
  },
  {
    id: 2,
    userId: 3,
    kamarId: 2,
    judul: 'AC kurang dingin',
    deskripsi: 'AC sudah diatur 16 derajat tapi hembusan angin kurang dingin.',
    foto: 'https://placehold.co/600x400/png?text=Foto+AC',
    status: 'diproses',
    penanganan: 'Jadwal servis pembersihan AC diagendakan besok siang',
    tanggalLapor: '2026-10-25T11:20:00Z'
  },
  {
    id: 3,
    userId: 4,
    kamarId: 3,
    judul: 'Lampu kamar mandi mati',
    deskripsi: 'Bohlam lampu kamar mandi padam tadi pagi.',
    foto: 'https://placehold.co/600x400/png?text=Foto+Lampu+Mati',
    status: 'pending',
    penanganan: null,
    tanggalLapor: '2026-10-27T08:00:00Z'
  },
];

const initialNotifikasi = [
  {
    id: 1,
    userId: 2,
    tipe: 'tagihan',
    judul: 'Tagihan Baru Diterbitkan',
    isi: 'Tagihan sewa bulan Oktober 2026 sebesar Rp 1.200.000 telah terbit.',
    ref: { tagihanId: 1 },
    dibaca: true,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 2,
    userId: 3,
    tipe: 'tiket',
    judul: 'Tiket Diproses',
    isi: 'Laporan kerusakan AC kurang dingin sedang dijadwalkan untuk perbaikan.',
    ref: { tiketId: 2 },
    dibaca: false,
    createdAt: '2026-10-25T12:00:00Z',
  },
];

const aturanKost = [
  'Dilarang merokok di dalam kamar ber-AC.',
  'Tamu lawan jenis dilarang menginap.',
  'Jam tenang berlaku mulai pukul 22:00 WIB.',
  'Menjaga kebersihan area bersama (dapur & tempat jemur).',
];

const kontakPengelola = {
  nama: 'Hendra Wijaya',
  telepon: '081234567890',
  whatsapp: 'https://wa.me/6281234567890',
  alamat: 'Jl. Babarsari No. 42, Sleman, D.I. Yogyakarta'
};

// Data mutable in-memory
const users = [...initialUsers];
const kamar = [...initialKamar];
const penghuni = [...initialPenghuni];
const tagihan = [...initialTagihan];
const pembayaran = [...initialPembayaran];
const tiket = [...initialTiket];
const notifikasi = [...initialNotifikasi];

// Helper pembuat notifikasi
const buatNotifikasi = (userId, tipe, judul, isi, ref = null) => {
  const newNotifikasi = {
    id: notifikasi.length > 0 ? notifikasi[notifikasi.length - 1].id + 1 : 1,
    userId: Number(userId),
    tipe: tipe || 'info',
    judul,
    isi,
    ref: ref !== undefined ? ref : null,
    dibaca: false,
    createdAt: new Date().toISOString(),
  };

  notifikasi.push(newNotifikasi);
  return newNotifikasi;
};

// Fungsi untuk me-reset data ke kondisi awal
const resetMockData = () => {
  users.length = 0;
  users.push(...initialUsers);

  kamar.length = 0;
  kamar.push(...initialKamar);

  penghuni.length = 0;
  penghuni.push(...initialPenghuni);

  tagihan.length = 0;
  tagihan.push(...initialTagihan);

  pembayaran.length = 0;
  pembayaran.push(...initialPembayaran);

  tiket.length = 0;
  tiket.push(...initialTiket);

  notifikasi.length = 0;
  notifikasi.push(...initialNotifikasi);

  return {
    usersCount: users.length,
    kamarCount: kamar.length,
    penghuniCount: penghuni.length,
    tagihanCount: tagihan.length,
    pembayaranCount: pembayaran.length,
    tiketCount: tiket.length,
    notifikasiCount: notifikasi.length,
  };
};

module.exports = {
  // Entitas utama
  users,
  kamar,
  penghuni,
  tagihan,
  pembayaran,
  tiket,
  notifikasi,
  aturanKost,
  kontakPengelola,

  // Alias bahasa Inggris untuk fleksibilitas
  rooms: kamar,
  tenants: penghuni,
  bills: tagihan,
  payments: pembayaran,
  tickets: tiket,
  notifications: notifikasi,

  // Helper
  buatNotifikasi,
  resetMockData,
};