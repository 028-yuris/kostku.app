*Tabel Endpoint*


| Fitur | Method | Endpoint | Payload (Request Body JSON) | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Cek Kesehatan** | `GET` | `/api/v1` | `-` | Membalas 200 dengan `{ success: true, message: "Kostku API v1" }`. Dipakai untuk memastikan server hidup dari Postman, emulator, dan web. |
| **Registrasi** | `POST` | `/api/v1/auth/register` | `nama`, `email`, `password`, `noHp` (opsional), `role` (opsional) | Mendaftarkan akun baru dan menyimpannya sementara ke *mock data*. |
| **Login** | `POST` | `/api/v1/auth/login` | `email`, `password` | Memvalidasi kredensial. Jika sukses, mengembalikan data profil pengguna beserta *mock token*. |