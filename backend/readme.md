# Kostku Backend API

Backend API untuk aplikasi **Kostku**, dibangun dengan **Node.js** dan **Express.js**.
Dokumen ini diperbarui setiap kali ada endpoint, middleware, atau helper baru.

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

## Skrip Seeding

| Perintah | Keterangan |
| :--- | :--- |
| `npm run seed` atau `node src/data/seed.js` | Mengisi database dengan data contoh dari `src/data/mock.js`, supaya endpoint bisa dites dengan data nyata. |