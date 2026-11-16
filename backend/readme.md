# Kostku Backend API

Backend API untuk aplikasi **Kostku**, dibangun dengan **Node.js** dan **Express.js**.
Dokumen ini merangkum seluruh endpoint, middleware, helper, dan status progres implementasi API.

---

## Ringkasan Progres

| Item | Status |
| :--- | :--- |
| Total endpoint | **32** endpoint REST API (di luar cek kesehatan & file statis) |
| Middleware siap | `authenticate`, `authorize`, `uploadGambar` (Multer), `CORS` |
| Helper siap | `buatNotifikasi` |
| Job latar belakang | Pengingat jatuh tempo harian (`pengingatTagihan.js`) |
| Base URL | `/api/v1` |

### Fitur yang sudah selesai

| Fitur | Nama | Endpoint |
| :--- | :--- | :--- |
| 1 | Registrasi & Login | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| 2 & 11 | Tagihan Bulanan | `POST /tagihan/generate`, `GET /tagihan`, `GET /tagihan/saya`, `GET /tagihan/:id`, `POST /tagihan/:id/pembayaran` |
| 3 | Pengingat & Notifikasi | `GET /notifikasi/saya`, `GET /notifikasi/belum-dibaca`, `PATCH /notifikasi/:id/baca`, `PATCH /notifikasi/baca-semua`, Job scheduler pengingat H-3, H, & terlambat |
| 4 | Unggah Bukti Transfer | `POST /tagihan/:id/pembayaran` |
| 5 | Riwayat Pembayaran | `GET /pembayaran/saya` |
| 6 & 7 | Tiket Laporan Kerusakan | `POST /tiket`, `GET /tiket/saya`, `GET /tiket/:id` |
| 8 | Dasbor Ringkasan | `GET /dasbor` |
| 9 | Kelola Data Kamar | `POST /kamar`, `GET /kamar`, `GET /kamar/:id`, `PUT /kamar/:id`, `DELETE /kamar/:id`, `POST /kamar/:id/foto` |
| 10 | Kelola Penghuni & Sewa | `GET /penghuni`, `POST /sewa`, `GET /sewa`, `PATCH /sewa/:id/akhiri` |
| 12 | Verifikasi Pembayaran | `GET /pembayaran`, `PATCH /pembayaran/:id/verifikasi` |
| 13 | Daftar Penunggak | `GET /tagihan/penunggak` |
| 14 | Kelola Tiket Pengelola | `GET /tiket`, `PATCH /tiket/:id/status` |
| 15 & 16 | Katalog & Detail Kos | `GET /kamar`, `GET /kamar/:id`, `GET /kos`, `PUT /kos` |

> Semua path di atas diawali `/api/v1`.

---

## Hak Akses

| Label | Artinya |
| :--- | :--- |
| **Publik** | Bisa diakses siapa saja, tanpa login |
| **Login** | Harus login (semua role) |
| **Pengelola** | Hanya akun dengan role `pengelola` |
| **Penghuni** | Hanya akun dengan role `penghuni` |

Endpoint yang butuh login wajib menyertakan header:

```
Authorization: Bearer <token>
```

---

## Middleware

| Middleware | Fungsi | Detail |
| :--- | :--- | :--- |
| `authenticate` | Cek login | Membaca token dari header `Authorization: Bearer <token>` dan mengisi `req.user`. Jika token tidak valid, balas `401`. |
| `authorize(...roles)` | Batasi peran | Hanya mengizinkan role tertentu, jika tidak balas `403`. Contoh: `authorize('pengelola')`. |
| `uploadGambar` (`upload`) | Unggah foto | Menerima foto bukti, tiket, dan kamar. Hanya tipe gambar, maksimal **2 MB**. File disimpan di folder `uploads/` dan yang dihasilkan adalah **path relatif**, bukan URL penuh. |
| `CORS` | Izin lintas origin | Mengizinkan request dari web (misal `http://localhost:5173`), emulator, dan mobile. |

## Helper

| Helper | Parameter | Fungsi |
| :--- | :--- | :--- |
| `buatNotifikasi` | `(userId, tipe, judul, isi, ref)` | Satu fungsi untuk membuat notifikasi. Dipanggil oleh endpoint yang memicu notifikasi. |

---

## Daftar Endpoint

### Umum

| Method | Endpoint | Akses | Keterangan |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1` | Publik | **Cek kesehatan.** Membalas `200` dengan `{ success: true, message: "Kostku API v1" }`. |
| `GET` | `/uploads/:filename` | Publik | **File statis.** Menyajikan foto bukti, tiket, dan kamar agar bisa dibuka oleh web dan mobile. |
| `POST` | `/api/v1/seed` | Publik / Dev | **Reset database.** Mengembalikan in-memory mock data ke kondisi awal. |

### Autentikasi (Fitur 1)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Publik | Body: `nama`, `email`, `password`, `noHp` (opsional), `role` (opsional) | Mendaftarkan akun baru. |
| `POST` | `/api/v1/auth/login` | Publik | Body: `email`, `password` | Memeriksa kredensial, mengembalikan profil user & mock token. |
| `GET` | `/api/v1/auth/me` | Login | Header: `Authorization` | Mengembalikan profil user dari token (`req.user`). |

### Kamar & Kos (Fitur 9, 15, 16)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/kamar` | Pengelola | Header: `Authorization`<br>Body: `kode`, `lantai`, `luas`, `harga`, `fasilitas[]`, `status` | Menambah kamar baru. Validasi: `kode` harus unik. |
| `GET` | `/api/v1/kamar` | Publik | Query: `?status=kosong` (opsional) | Daftar kamar. Filter `?status=kosong` dipakai untuk katalog calon penghuni. |
| `GET` | `/api/v1/kamar/:id` | Publik | - | Detail satu kamar: foto, fasilitas, harga, status, aturan kos, dan kontak pengelola. |
| `PUT` | `/api/v1/kamar/:id` | Pengelola | Header: `Authorization`<br>Body/Form: `harga`, `fasilitas`, `status`, dll. | Mengubah data kamar. |
| `DELETE` | `/api/v1/kamar/:id` | Pengelola | Header: `Authorization` | Menghapus kamar. Tolak `409` jika masih ada sewa aktif. |
| `POST` | `/api/v1/kamar/:id/foto` | Pengelola | Header: `Authorization`<br>Multipart: file foto (`foto`/`gambar`) | Mengunggah foto kamar (maks. 2 MB) dan menyimpan path ke `foto[]`. |
| `GET` | `/api/v1/kos` | Publik | - | Info kos: nama, alamat, kontak WhatsApp, jam kunjung, dan aturan kos. |
| `PUT` | `/api/v1/kos` | Pengelola | Header: `Authorization`<br>Body: info kos, rekening, tanggal jatuh tempo | Mengubah info kos, rekening pembayaran, dan tanggal jatuh tempo. |

### Penghuni & Sewa (Fitur 10)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/penghuni` | Pengelola | Header: `Authorization`<br>Query: `?tanpaSewa=true` (opsional) | Daftar penghuni beserta kamar dan sewa aktifnya. Filter `?tanpaSewa=true` untuk memilih calon penghuni yang belum punya kamar. |
| `POST` | `/api/v1/sewa` | Pengelola | Header: `Authorization`<br>Body: `userId`, `kamarId`, `tanggalMasuk`, `hargaDisepakati`, `deposit`, `tanggalSelesai` | Menempatkan penghuni ke kamar. Validasi: kamar tidak terisi/perawatan, user belum ada sewa aktif. Efek: status kamar jadi `terisi`. |
| `GET` | `/api/v1/sewa` | Pengelola | Header: `Authorization`<br>Query: `?status=aktif` (opsional) | Daftar sewa/kontrak kamar. |
| `PATCH` | `/api/v1/sewa/:id/akhiri` | Pengelola | Header: `Authorization`<br>Body: `tanggalSelesai` (opsional) | Mengakhiri sewa. Efek: sewa berstatus `selesai` dan kamar kembali `tersedia`. |

### Tagihan & Penunggak (Fitur 2, 11, 13)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/tagihan/generate` | Pengelola | Header: `Authorization`<br>Body: `{ "periode": "2026-11" }` | Membuat tagihan satu periode untuk semua sewa aktif. Lewati duplikat dan panggil `buatNotifikasi`. |
| `GET` | `/api/v1/tagihan` | Pengelola | Header: `Authorization`<br>Query: `?periode=2026-10&status=belum_bayar` (opsional) | Semua tagihan, dukung filter periode dan status. |
| `GET` | `/api/v1/tagihan/penunggak` | Pengelola | Header: `Authorization` | Tagihan belum_bayar yang jatuhTempo sudah lewat, lengkap dengan nama penghuni, kamar, jumlah, dan lama keterlambatan (hari). |
| `GET` | `/api/v1/tagihan/saya` | Penghuni | Header: `Authorization` | Tagihan milik penghuni login, terbaru dulu, menyertakan status `terlambat` dan `hariTerlambat`. |
| `GET` | `/api/v1/tagihan/:id` | Penghuni (miliknya) / Pengelola | Header: `Authorization` | Detail tagihan beserta riwayat percobaan pembayarannya. Cek kepemilikan untuk penghuni. |

### Pembayaran (Fitur 4, 5, 12)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/tagihan/:id/pembayaran` | Penghuni | Header: `Authorization`<br>Multipart: file foto (`bukti`/`foto`/`gambar`), `jumlah` (opsional) | Mengunggah bukti transfer. Efek: pembayaran berstatus `menunggu`, tagihan jadi `menunggu_verifikasi`, notifikasi ke pengelola. |
| `GET` | `/api/v1/pembayaran` | Pengelola | Header: `Authorization`<br>Query: `?status=menunggu` (opsional) | Antrean verifikasi pembayaran, menyertakan nama penghuni, kamar, dan periode tagihan. |
| `PATCH` | `/api/v1/pembayaran/:id/verifikasi` | Pengelola | Header: `Authorization`<br>Body: `keputusan` (`diterima`/`ditolak`), `catatan` | Memverifikasi pembayaran. Diterima: tagihan jadi lunas. Ditolak: catatan wajib, tagihan kembali `belum_bayar`. Notifikasi ke penghuni. |
| `GET` | `/api/v1/pembayaran/saya` | Penghuni | Header: `Authorization` | Riwayat pembayaran milik sendiri, menyertakan periode dan status. |

### Tiket Laporan Kerusakan (Fitur 6, 7, 14)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/tiket` | Penghuni | Header: `Authorization`<br>Multipart: `kategori`, `judul`, `deskripsi`, `foto` (opsional), `kamarId` (opsional) | Membuat tiket laporan kerusakan. Status awal `pending`, isi riwayat awal, kirim notifikasi ke pengelola. |
| `GET` | `/api/v1/tiket/saya` | Penghuni | Header: `Authorization`<br>Query: `?status=` (opsional) | Daftar tiket milik sendiri, terbaru dulu. |
| `GET` | `/api/v1/tiket/:id` | Penghuni (miliknya) / Pengelola | Header: `Authorization` | Detail tiket beserta riwayat perubahan status. Cek kepemilikan untuk penghuni. |
| `GET` | `/api/v1/tiket` | Pengelola | Header: `Authorization`<br>Query: `?status=pending&kategori=air` (opsional) | Semua tiket kerusakan, dukung filter status dan kategori. |
| `PATCH` | `/api/v1/tiket/:id/status` | Pengelola | Header: `Authorization`<br>Body: `status` (`diproses`/`selesai`), `catatan` | Mengubah status tiket. Urutan hanya maju: `pending` → `diproses` → `selesai`. Tambahkan riwayat dan notifikasi ke pelapor. |

### Notifikasi & Pengingat (Fitur 3)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifikasi/saya` | Login | Header: `Authorization` | Daftar notifikasi milik sendiri, diurutkan terbaru dulu. |
| `GET` | `/api/v1/notifikasi/belum-dibaca` | Login | Header: `Authorization` | Jumlah notifikasi belum dibaca untuk badge notifikasi di aplikasi. |
| `PATCH` | `/api/v1/notifikasi/:id/baca` | Login | Header: `Authorization` | Menandai satu notifikasi sudah dibaca. Cek kepemilikan. |
| `PATCH` | `/api/v1/notifikasi/baca-semua` | Login | Header: `Authorization` | Menandai seluruh notifikasi pengguna sudah dibaca. |

### Dasbor Ringkasan (Fitur 8)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dasbor` | Pengelola | Header: `Authorization` | Ringkasan dasbor: kamar terisi/total, pemasukan bulan ini, jumlah penunggak, pembayaran menunggu verifikasi, tiket per status. |

---

## Skrip Seeding

| Perintah | Keterangan |
| :--- | :--- |
| `npm run seed` atau `node src/data/seed.js` | Mengisi database dengan data contoh dari `src/data/mock.js`, supaya endpoint bisa dites dengan data nyata. |
