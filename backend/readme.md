# Kostku Backend API

<<<<<<< HEAD
Backend API untuk aplikasi **Kostku**, dibangun dengan **Node.js** dan **Express.js**.
Dokumen ini diperbarui setiap kali ada endpoint, middleware, atau helper baru.
=======
Backend API untuk aplikasi Kostku menggunakan Node.js & Express.js. Dokumen ini diperbarui secara berkelanjutan di setiap penambahan fitur endpoint, middleware, dan helper.

### Ringkasan Progres Backend:
- **Total Endpoint:** 18 Endpoint REST API
- **Middleware Siap:** `authenticate`, `authorize`, `uploadGambar` (Multer), `CORS`
- **Helper Siap:** `buatNotifikasi`
- **Fitur yang Telah Diimplementasikan di Backend:**
  - [x] **Fitur 1 (Registrasi & Login):** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
  - [x] **Fitur 2 & 11 (Tagihan Bulanan):** `POST /api/v1/tagihan/generate`, `GET /api/v1/tagihan`, `GET /api/v1/tagihan/saya`, `GET /api/v1/tagihan/:id`
  - [x] **Fitur 9 (Kelola Data Kamar):** `POST /api/v1/kamar`, `GET /api/v1/kamar`, `GET /api/v1/kamar/:id`, `PUT /api/v1/kamar/:id`, `DELETE /api/v1/kamar/:id`, `POST /api/v1/kamar/:id/foto`
  - [x] **Fitur 10 (Kelola Penghuni & Sewa):** `GET /api/v1/penghuni`, `GET /api/v1/sewa`, `PATCH /api/v1/sewa/:id/akhiri`
  - [x] **Fitur 15 & 16 (Katalog & Detail Kos):** `GET /api/v1/kamar`, `GET /api/v1/kamar/:id`, `GET /api/v1/kos`, `PUT /api/v1/kos`
>>>>>>> f2fd704 (feat(backend): tambah endpoint detail tagihan)

---

## Ringkasan Progres

| Item | Status |
| :--- | :--- |
| Total endpoint | **17** endpoint REST API (di luar cek kesehatan & file statis) |
| Middleware siap | `authenticate`, `authorize`, `uploadGambar` (Multer), `CORS` |
| Helper siap | `buatNotifikasi` |
| Base URL | `/api/v1` |

### Fitur yang sudah selesai

| Fitur | Nama | Endpoint |
| :--- | :--- | :--- |
| 1 | Registrasi & Login | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| 2 & 11 | Tagihan Bulanan | `POST /tagihan/generate`, `GET /tagihan`, `GET /tagihan/saya` |
| 9 | Kelola Data Kamar | `POST /kamar`, `GET /kamar`, `GET /kamar/:id`, `PUT /kamar/:id`, `DELETE /kamar/:id`, `POST /kamar/:id/foto` |
| 10 | Kelola Penghuni & Sewa | `GET /penghuni`, `GET /sewa`, `PATCH /sewa/:id/akhiri` |
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

<<<<<<< HEAD
| Helper | Parameter | Fungsi |
| :--- | :--- | :--- |
| `buatNotifikasi` | `(userId, tipe, judul, isi, ref)` | Satu fungsi untuk membuat notifikasi. Dipanggil oleh endpoint yang memicu notifikasi. Endpoint untuk membaca notifikasi akan dibuat di tahap 5. |

---

## Daftar Endpoint

### Umum

| Method | Endpoint | Akses | Keterangan |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1` | Publik | **Cek kesehatan.** Membalas `200` dengan `{ success: true, message: "Kostku API v1" }`. Dipakai untuk memastikan server hidup dari Postman, emulator, dan web. |
| `GET` | `/uploads/:filename` | Publik | **File statis.** Menyajikan foto bukti, tiket, dan kamar agar bisa dibuka oleh web dan mobile. |

### Autentikasi (Fitur 1)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Publik | Body: `nama`, `email`, `password`, `noHp` (opsional), `role` (opsional) | Mendaftarkan akun baru. Untuk sementara disimpan di *mock data*. |
| `POST` | `/api/v1/auth/login` | Publik | Body: `email`, `password` | Memeriksa kredensial. Jika berhasil, mengembalikan profil pengguna beserta *mock token*. |
| `GET` | `/api/v1/auth/me` | Login | Header: `Authorization` | Mengembalikan profil user dari token (`req.user`). Dipakai app Flutter setelah login untuk menentukan menu sesuai role. |

### Kamar (Fitur 9, 15, 16)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/kamar` | Pengelola | Header: `Authorization`<br>Body: `kode`, `lantai`, `luas`, `harga`, `fasilitas[]`, `status` | Menambah kamar baru. Validasi: `kode` harus unik. |
| `GET` | `/api/v1/kamar` | Publik | Query: `?status=kosong` (opsional) | Daftar kamar. Filter `?status=kosong` dipakai untuk katalog calon penghuni, jadi satu endpoint melayani dua layar. |
| `GET` | `/api/v1/kamar/:id` | Publik | - | Detail satu kamar: foto, fasilitas, harga, status, aturan kos, dan kontak pengelola. |
| `PUT` | `/api/v1/kamar/:id` | Pengelola | Header: `Authorization`<br>Body/Form: `harga`, `fasilitas`, `status`, dll. | Mengubah data kamar: harga, fasilitas, status perawatan, dan lainnya. |
| `DELETE` | `/api/v1/kamar/:id` | Pengelola | Header: `Authorization` | Menghapus kamar. Ditolak dengan `409` jika kamar masih punya sewa aktif. |
| `POST` | `/api/v1/kamar/:id/foto` | Pengelola | Header: `Authorization`<br>Multipart: file foto (`foto` / `gambar`) | Mengunggah foto kamar (maks. 2 MB) dan menyimpan path relatifnya ke `foto[]`. |

### Info Kos (Fitur 16)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/kos` | Publik | - | Info kos: nama, alamat, kontak WhatsApp, jam kunjung, dan aturan. Ditampilkan di detail kamar. |
| `PUT` | `/api/v1/kos` | Pengelola | Header: `Authorization`<br>Body: info kos, rekening, tanggal jatuh tempo | Mengubah info kos, rekening pembayaran, dan tanggal jatuh tempo bulanan. |

### Penghuni & Sewa (Fitur 10)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/penghuni` | Pengelola | Header: `Authorization`<br>Query: `?tanpaSewa=true` (opsional) | Daftar penghuni beserta kamar dan sewa aktifnya. Filter `?tanpaSewa=true` menampilkan penghuni yang belum punya kamar. |
| `GET` | `/api/v1/sewa` | Pengelola | Header: `Authorization`<br>Query: `?status=aktif` (opsional) | Daftar sewa/kontrak kamar. Bisa difilter dengan `?status=aktif`. |
| `PATCH` | `/api/v1/sewa/:id/akhiri` | Pengelola | Header: `Authorization`<br>Body: `tanggalSelesai` (opsional) | Mengakhiri sewa. Efeknya: sewa berstatus selesai dan status kamar kembali **kosong** (tersedia). |

### Tagihan (Fitur 2 & 11)

| Method | Endpoint | Akses | Input | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/tagihan/generate` | Pengelola | Header: `Authorization`<br>Body: `{ "periode": "2026-11" }` | Membuat tagihan satu periode untuk **semua sewa aktif**. Jumlah diambil dari `hargaDisepakati`, jatuh tempo dari `kos.tanggalJatuhTempo`. Tagihan yang sudah ada dilewati, lalu `buatNotifikasi` dipanggil ke tiap penghuni. |
| `GET` | `/api/v1/tagihan` | Pengelola | Header: `Authorization`<br>Query: `?periode=2026-10&status=belum_bayar` (opsional) | Semua tagihan. Bisa difilter dengan `?periode=` dan `?status=`. |
| `GET` | `/api/v1/tagihan/saya` | Penghuni | Header: `Authorization` | Tagihan milik penghuni yang sedang login, diurutkan dari yang terbaru. Menyertakan field keterlambatan: `terlambat` dan `hariTerlambat`. |

---
=======
| Fitur | Method | Endpoint | Akses | Header / Payload | Keterangan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cek Kesehatan** | `GET` | `/api/v1` | Publik | `-` | Membalas 200 dengan `{ success: true, message: "Kostku API v1" }`. Dipakai untuk memastikan server hidup dari Postman, emulator, dan web. |
| **File Statis** | `GET` | `/uploads/:filename` | Publik | `-` | Menyajikan foto bukti, tiket, dan kamar secara statis agar bisa dibuka oleh web dan mobile. |
| **Registrasi** | `POST` | `/api/v1/auth/register` | Publik | Body: `nama`, `email`, `password`, `noHp` (opsional), `role` (opsional) | Mendaftarkan akun baru dan menyimpannya sementara ke *mock data*. |
| **Login** | `POST` | `/api/v1/auth/login` | Publik | Body: `email`, `password` | Memvalidasi kredensial. Jika sukses, mengembalikan data profil pengguna beserta *mock token*. |
| **Profil User** | `GET` | `/api/v1/auth/me` | Login | Header: `Authorization: Bearer <token>` | Mengembalikan profil user dari token (`req.user`). Dipakai app Flutter setelah login untuk menentukan menu berdasarkan role. |
| **Tambah Kamar** | `POST` | `/api/v1/kamar` | Pengelola | Header: `Authorization: Bearer <token>`<br>Body: `kode`, `lantai`, `luas`, `harga`, `fasilitas[]`, `status` | Menambah kamar baru (Fitur 9). Validasi: kode unik. |
| **Daftar Kamar** | `GET` | `/api/v1/kamar` | Publik | Query: `?status=kosong` (opsional) | Daftar kamar (Fitur 9, 15). Dukung filter `?status=kosong` untuk katalog calon penghuni. Satu endpoint dipakai dua layar. |
| **Detail Kamar** | `GET` | `/api/v1/kamar/:id` | Publik | `-` | Detail satu kamar (Fitur 16): foto, fasilitas, harga, status, aturan kos, kontak pengelola. |
| **Ubah Kamar** | `PUT` | `/api/v1/kamar/:id` | Pengelola | Header: `Authorization: Bearer <token>`<br>Body/Form: `harga`, `fasilitas`, `status`, dll | Mengubah data kamar (Fitur 9): harga, fasilitas, status perawatan, dll. |
| **Hapus Kamar** | `DELETE` | `/api/v1/kamar/:id` | Pengelola | Header: `Authorization: Bearer <token>` | Menghapus kamar (Fitur 9). Tolak dengan 409 jika masih ada sewa aktif. |
| **Unggah Foto Kamar** | `POST` | `/api/v1/kamar/:id/foto` | Pengelola | Header: `Authorization: Bearer <token>`<br>Multipart: file foto (`foto`/`gambar`) | Mengunggah foto kamar (Fitur 9, 16). Menggunakan middleware upload (maks 2 MB), simpan path relatif ke `foto[]`. |
| **Info Kos** | `GET` | `/api/v1/kos` | Publik | `-` | Info kos (Fitur 16): nama, alamat, kontak WhatsApp, jam kunjung, aturan. Ditampilkan di detail kamar. |
| **Ubah Info Kos** | `PUT` | `/api/v1/kos` | Pengelola | Header: `Authorization: Bearer <token>`<br>Body: info kos, rekening, tanggal jatuh tempo | Mengubah info kos, rekening pembayaran, dan tanggal jatuh tempo bulanan (Fitur 16). |
| **Daftar Penghuni** | `GET` | `/api/v1/penghuni` | Pengelola | Header: `Authorization: Bearer <token>`<br>Query: `?tanpaSewa=true` (opsional) | Daftar penghuni beserta kamar dan sewa aktifnya (Fitur 10). Filter `?tanpaSewa=true` untuk memilih penghuni yang belum punya kamar. |
| **Daftar Sewa** | `GET` | `/api/v1/sewa` | Pengelola | Header: `Authorization: Bearer <token>`<br>Query: `?status=aktif` (opsional) | Daftar sewa/kontrak kamar, filter `?status=aktif`. |
| **Akhiri Sewa** | `PATCH` | `/api/v1/sewa/:id/akhiri` | Pengelola | Header: `Authorization: Bearer <token>`<br>Body: `tanggalSelesai` (opsional) | Mengakhiri sewa. Efek: sewa menjadi selesai, status kamar kembali kosong (tersedia). |
| **Generate Tagihan** | `POST` | `/api/v1/tagihan/generate` | Pengelola | Header: `Authorization: Bearer <token>`<br>Body: `{ "periode": "2026-11" }` | Membuat tagihan satu periode untuk semua sewa aktif (Fitur 11). Jumlah dari hargaDisepakati, jatuh tempo dari kos.tanggalJatuhTempo, lewati yang sudah ada, dan panggil `buatNotifikasi` ke tiap penghuni. |
| **Daftar Tagihan** | `GET` | `/api/v1/tagihan` | Pengelola | Header: `Authorization: Bearer <token>`<br>Query: `?periode=2026-10&status=belum_bayar` (opsional) | Semua tagihan, filter `?periode=2026-10` dan `?status=belum_bayar`. |
| **Tagihan Saya** | `GET` | `/api/v1/tagihan/saya` | Penghuni | Header: `Authorization: Bearer <token>` | Tagihan milik penghuni yang login, diurutkan terbaru dulu. Menyertakan field hitungan terlambat (`terlambat`, `hariTerlambat`). |
| **Detail Tagihan** | `GET` | `/api/v1/tagihan/:id` | Penghuni (miliknya) / Pengelola | Header: `Authorization: Bearer <token>` | Detail tagihan beserta daftar percobaan pembayarannya. Cek kepemilikan untuk penghuni (Fitur 11). |
>>>>>>> f2fd704 (feat(backend): tambah endpoint detail tagihan)

## Skrip Seeding

| Perintah | Keterangan |
| :--- | :--- |
| `npm run seed` atau `node src/data/seed.js` | Mengisi database dengan data contoh dari `src/data/mock.js`, supaya endpoint bisa dites dengan data nyata. |