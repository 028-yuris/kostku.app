# Kostku Backend API

## Daftar Middleware

| Middleware | Target | Keterangan |
| :--- | :--- | :--- |
| **`authenticate`** | Semua | Membaca token dari header `Authorization: Bearer <token>`, mengisi `req.user`, menolak jika tidak valid (`401`). |
| **`authorize(...roles)`** | Semua | Membatasi endpoint berdasarkan peran (`403`). Contoh: `authorize('pengelola')`. |
| **`uploadGambar`** / `upload` | Semua | Menerima foto bukti/tiket/kamar, membatasi tipe gambar dan ukuran (maks. 2 MB). Menyimpan di `uploads/` dan menghasilkan path relatif (bukan URL penuh). |
| **CORS** | Semua | Mengizinkan request cross-origin dari web (misal `http://localhost:5173`), emulator, dan mobile. |

## Daftar Helper

| Helper | Parameter | Keterangan |
| :--- | :--- | :--- |
| **`buatNotifikasi`** | `(userId, tipe, judul, isi, ref)` | Satu fungsi pembuat notifikasi. Dipanggil di endpoint-endpoint berikutnya saat memicu notifikasi. Endpoint baca notifikasi dibuat di tahap 5. |

## Tabel Endpoint

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

## Skrip Seeding

| Perintah | Target | Keterangan |
| :--- | :--- | :--- |
| `npm run seed` / `node src/data/seed.js` | - | Mengisi database dengan data contoh dari `src/data/mock.js`, supaya endpoint bisa dites dengan data nyata. |