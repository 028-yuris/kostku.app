# Kostku Backend API

## Daftar Middleware

| Middleware | Target | Keterangan |
| :--- | :--- | :--- |
| **`authenticate`** | Semua | Membaca token dari header `Authorization: Bearer <token>`, mengisi `req.user`, menolak jika tidak valid (`401`). |
| **`authorize(...roles)`** | Semua | Membatasi endpoint berdasarkan peran (`403`). Contoh: `authorize('pengelola')`. |

## Tabel Endpoint

| Fitur | Method | Endpoint | Akses | Header / Payload | Keterangan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cek Kesehatan** | `GET` | `/api/v1` | Publik | `-` | Membalas 200 dengan `{ success: true, message: "Kostku API v1" }`. Dipakai untuk memastikan server hidup dari Postman, emulator, dan web. |
| **Registrasi** | `POST` | `/api/v1/auth/register` | Publik | Body: `nama`, `email`, `password`, `noHp` (opsional), `role` (opsional) | Mendaftarkan akun baru dan menyimpannya sementara ke *mock data*. |
| **Login** | `POST` | `/api/v1/auth/login` | Publik | Body: `email`, `password` | Memvalidasi kredensial. Jika sukses, mengembalikan data profil pengguna beserta *mock token*. |
| **Profil User** | `GET` | `/api/v1/auth/me` | Login | Header: `Authorization: Bearer <token>` | Mengembalikan profil user dari token (`req.user`). Dipakai app Flutter setelah login untuk menentukan menu berdasarkan role. |