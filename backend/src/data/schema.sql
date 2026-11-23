-- ========================================================
-- DATABASE: kostku_db
-- ========================================================
CREATE DATABASE IF NOT EXISTS kostku_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kostku_db;

-- --------------------------------------------------------
-- 1. TABEL: users (Pengguna)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    no_hp VARCHAR(20) NULL,
    role ENUM('pengelola', 'penghuni', 'calon_penghuni') NOT NULL DEFAULT 'calon_penghuni',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 2. TABEL: kamar (Data Kamar Kos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS kamar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(50) NOT NULL UNIQUE,
    lantai INT NOT NULL DEFAULT 1,
    luas VARCHAR(50) NULL,
    tipe VARCHAR(50) NOT NULL DEFAULT 'Standard',
    harga INT NOT NULL,
    status ENUM('tersedia', 'terisi', 'perawatan') NOT NULL DEFAULT 'tersedia',
    deskripsi TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kamar_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 2a. TABEL: kamar_fasilitas (Relasi Fasilitas Kamar)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS kamar_fasilitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kamar_id INT NOT NULL,
    fasilitas VARCHAR(100) NOT NULL,
    CONSTRAINT fk_fasilitas_kamar FOREIGN KEY (kamar_id) 
        REFERENCES kamar(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 2b. TABEL: kamar_foto (Foto-Foto Kamar)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS kamar_foto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kamar_id INT NOT NULL,
    foto_url VARCHAR(255) NOT NULL,
    is_utama BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_foto_kamar FOREIGN KEY (kamar_id) 
        REFERENCES kamar(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 3. TABEL: sewa (Kontrak / Penempatan Penghuni di Kamar)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS sewa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    kamar_id INT NOT NULL,
    harga_disepakati INT NOT NULL,
    deposit INT NOT NULL DEFAULT 0,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NULL,
    status ENUM('aktif', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sewa_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sewa_kamar FOREIGN KEY (kamar_id) 
        REFERENCES kamar(id) ON DELETE RESTRICT,
    INDEX idx_sewa_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 4. TABEL: tagihan (Tagihan Sewa Bulanan)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tagihan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sewa_id INT NOT NULL,
    user_id INT NOT NULL,
    kamar_id INT NOT NULL,
    periode VARCHAR(7) NOT NULL,
    nominal INT NOT NULL,
    jatuh_tempo DATE NOT NULL,
    status ENUM('belum_bayar', 'menunggu_verifikasi', 'lunas') NOT NULL DEFAULT 'belum_bayar',
    catatan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tagihan_sewa FOREIGN KEY (sewa_id) 
        REFERENCES sewa(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tagihan_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tagihan_kamar FOREIGN KEY (kamar_id) 
        REFERENCES kamar(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_sewa_periode (sewa_id, periode),
    INDEX idx_tagihan_status (status),
    INDEX idx_tagihan_periode (periode)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 5. TABEL: pembayaran (Unggah Bukti & Verifikasi)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS pembayaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tagihan_id INT NOT NULL,
    user_id INT NOT NULL,
    nominal INT NOT NULL,
    metode VARCHAR(100) NOT NULL DEFAULT 'Transfer Bank',
    bukti_foto VARCHAR(255) NOT NULL,
    tanggal_bayar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('menunggu', 'diterima', 'ditolak') NOT NULL DEFAULT 'menunggu',
    catatan TEXT NULL,
    verified_at TIMESTAMP NULL,
    verified_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bayar_tagihan FOREIGN KEY (tagihan_id) 
        REFERENCES tagihan(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bayar_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bayar_verifier FOREIGN KEY (verified_by) 
        REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_pembayaran_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 6. TABEL: tiket (Laporan Kerusakan & Keluhan)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tiket (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    kamar_id INT NULL,
    kategori ENUM('air', 'listrik', 'elektronik', 'fasilitas', 'kebersihan', 'lainnya') NOT NULL DEFAULT 'fasilitas',
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT NOT NULL,
    foto VARCHAR(255) NULL,
    status ENUM('pending', 'diproses', 'selesai') NOT NULL DEFAULT 'pending',
    penanganan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tiket_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tiket_kamar FOREIGN KEY (kamar_id) 
        REFERENCES kamar(id) ON DELETE SET NULL,
    INDEX idx_tiket_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 6a. TABEL: tiket_riwayat (Riwayat Perubahan Status Tiket)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tiket_riwayat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tiket_id INT NOT NULL,
    status ENUM('pending', 'diproses', 'selesai') NOT NULL,
    catatan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_riwayat_tiket FOREIGN KEY (tiket_id) 
        REFERENCES tiket(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 7. TABEL: notifikasi (Notifikasi & Pengingat)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifikasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tipe VARCHAR(50) NOT NULL,
    judul VARCHAR(255) NOT NULL,
    isi TEXT NOT NULL,
    ref JSON NULL,
    dibaca BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_dibaca (user_id, dibaca)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 8. TABEL: info_kos (Informasi Umum Kos & Rekening)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS info_kos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    alamat TEXT NOT NULL,
    kontak_whatsapp VARCHAR(20) NOT NULL,
    telepon VARCHAR(20) NULL,
    nama_pengelola VARCHAR(255) NOT NULL,
    jam_kunjung VARCHAR(100) DEFAULT '08:00 - 21:00 WIB',
    bank VARCHAR(50) NOT NULL DEFAULT 'BCA',
    nomor_rekening VARCHAR(50) NOT NULL,
    atas_nama VARCHAR(100) NOT NULL,
    tanggal_jatuh_tempo INT NOT NULL DEFAULT 10,
    deskripsi TEXT NULL,
    aturan JSON NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================
-- DATA SEED (DATA CONTOH AWAL)
-- ========================================================

-- 1. SEED USERS (password awal semua akun seed: "password123" dalam hash bcrypt)
INSERT INTO users (id, nama, email, password, no_hp, role) VALUES
(1, 'Hendra Wijaya', 'hendra@kostku.test', '$2b$10$LZ2EcuDWagyR20pWGoK2g.S4.FFD.RZTQa.oTMj5Z7Qrg4S1cP6Fy', '081234567890', 'pengelola'),
(2, 'Alya Putri', 'alya@kostku.test', '$2b$10$LZ2EcuDWagyR20pWGoK2g.S4.FFD.RZTQa.oTMj5Z7Qrg4S1cP6Fy', '081211110001', 'penghuni'),
(3, 'Bima Saputra', 'bima@kostku.test', '$2b$10$LZ2EcuDWagyR20pWGoK2g.S4.FFD.RZTQa.oTMj5Z7Qrg4S1cP6Fy', '081211110002', 'penghuni'),
(4, 'Citra Dewi', 'citra@kostku.test', '$2b$10$LZ2EcuDWagyR20pWGoK2g.S4.FFD.RZTQa.oTMj5Z7Qrg4S1cP6Fy', '081211110003', 'penghuni'),
(5, 'Doni Pratama', 'doni@kostku.test', '$2b$10$LZ2EcuDWagyR20pWGoK2g.S4.FFD.RZTQa.oTMj5Z7Qrg4S1cP6Fy', '081211110004', 'calon_penghuni')
ON DUPLICATE KEY UPDATE
  nama = VALUES(nama),
  password = VALUES(password),
  no_hp = VALUES(no_hp),
  role = VALUES(role);

-- 2. SEED KAMAR
INSERT IGNORE INTO kamar (id, kode, lantai, luas, tipe, harga, status, deskripsi) VALUES
(1, '101', 1, '3x4 m', 'Standard', 1200000, 'terisi', 'Kamar lantai 1 dengan sirkulasi udara baik dan dekat dengan dapur bersama.'),
(2, '102', 1, '3.5x4 m', 'Deluxe', 1600000, 'terisi', 'Kamar deluxe dengan kamar mandi dalam dan pendingin ruangan AC.'),
(3, '201', 2, '3.5x4 m', 'Deluxe', 1600000, 'terisi', 'Kamar deluxe lantai 2 dengan pencahayaan alami yang luas.'),
(4, '202', 2, '4x5 m', 'VIP', 2000000, 'tersedia', 'Kamar VIP paling luas dengan balkon pribadi dan fasilitas lengkap.'),
(5, '203', 2, '3x4 m', 'Standard', 1200000, 'tersedia', 'Kamar standard nyaman dan tenang di lantai 2.');

-- 2a. SEED FASILITAS KAMAR
INSERT IGNORE INTO kamar_fasilitas (id, kamar_id, fasilitas) VALUES
(1, 1, 'Kasur Single'), (2, 1, 'Lemari Pakaian'), (3, 1, 'Wi-Fi'), (4, 1, 'Kamar Mandi Luar'),
(5, 2, 'AC'), (6, 2, 'Kasur Springbed'), (7, 2, 'Lemari Pakaian'), (8, 2, 'Meja Belajar'), (9, 2, 'Wi-Fi'), (10, 2, 'Kamar Mandi Dalam'),
(11, 3, 'AC'), (12, 3, 'Kasur Springbed'), (13, 3, 'Lemari Pakaian'), (14, 3, 'Meja Belajar'), (15, 3, 'Wi-Fi'), (16, 3, 'Kamar Mandi Dalam'),
(17, 4, 'AC'), (18, 4, 'Water Heater'), (19, 4, 'Smart TV'), (20, 4, 'Kasur Queen'), (21, 4, 'Kamar Mandi Dalam'), (22, 4, 'Balkon Pribadi'), (23, 4, 'Wi-Fi'),
(24, 5, 'Kasur Single'), (25, 5, 'Lemari Pakaian'), (26, 5, 'Wi-Fi'), (27, 5, 'Kamar Mandi Luar');

-- 2b. SEED FOTO KAMAR
INSERT IGNORE INTO kamar_foto (id, kamar_id, foto_url, is_utama) VALUES
(1, 1, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600', TRUE),
(2, 2, 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600', TRUE),
(3, 3, 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600', TRUE),
(4, 4, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600', TRUE),
(5, 5, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600', TRUE);

-- 3. SEED SEWA
INSERT IGNORE INTO sewa (id, user_id, kamar_id, harga_disepakati, deposit, tanggal_mulai, tanggal_selesai, status) VALUES
(1, 2, 1, 1200000, 500000, '2026-01-01', '2026-12-31', 'aktif'),
(2, 3, 2, 1600000, 500000, '2026-02-01', '2026-12-31', 'aktif'),
(3, 4, 3, 1600000, 500000, '2026-03-01', '2026-12-31', 'aktif');

-- 4. SEED TAGIHAN
INSERT IGNORE INTO tagihan (id, sewa_id, user_id, kamar_id, periode, nominal, jatuh_tempo, status, catatan) VALUES
(1, 1, 2, 1, '2026-10', 1200000, '2026-10-10', 'lunas', 'Tagihan sewa kamar 101 Oktober 2026'),
(2, 2, 3, 2, '2026-10', 1600000, '2026-10-10', 'menunggu_verifikasi', 'Tagihan sewa kamar 102 Oktober 2026'),
(3, 3, 4, 3, '2026-10', 1600000, '2026-10-05', 'belum_bayar', 'Tagihan sewa kamar 201 Oktober 2026 (Menunggak)'),
(4, 1, 2, 1, '2026-11', 1200000, '2026-11-10', 'belum_bayar', 'Tagihan sewa kamar 101 November 2026');

-- 5. SEED PEMBAYARAN
INSERT IGNORE INTO pembayaran (id, tagihan_id, user_id, nominal, metode, bukti_foto, tanggal_bayar, status, catatan) VALUES
(1, 1, 2, 1200000, 'Transfer Bank BCA', 'https://placehold.co/600x800/png?text=Bukti+Transfer+Alya', '2026-10-08 09:30:00', 'diterima', 'Pembayaran valid dan telah diverifikasi'),
(2, 2, 3, 1600000, 'Transfer Bank Mandiri', 'https://placehold.co/600x800/png?text=Bukti+Transfer+Bima', '2026-10-10 14:15:00', 'menunggu', 'Menunggu verifikasi pengelola');

-- 6. SEED TIKET
INSERT IGNORE INTO tiket (id, user_id, kamar_id, kategori, judul, deskripsi, foto, status, penanganan, created_at) VALUES
(1, 2, 1, 'air', 'Kran wastafel bocor', 'Kran air di wastafel menetes terus dan tidak bisa ditutup rapat.', 'https://placehold.co/600x400/png?text=Foto+Kran+Bocor', 'selesai', 'Kran diganti baru oleh teknisi pada 13 Oktober 2026', '2026-10-12 10:00:00'),
(2, 3, 2, 'elektronik', 'AC kurang dingin', 'AC sudah diatur 16 derajat tapi hembusan angin kurang dingin.', 'https://placehold.co/600x400/png?text=Foto+AC', 'diproses', 'Jadwal servis pembersihan AC diagendakan besok siang', '2026-10-25 11:20:00'),
(3, 4, 3, 'listrik', 'Lampu kamar mandi mati', 'Bohlam lampu kamar mandi padam tadi pagi.', 'https://placehold.co/600x400/png?text=Foto+Lampu+Mati', 'pending', NULL, '2026-10-27 08:00:00');

-- 6a. SEED RIWAYAT TIKET
INSERT IGNORE INTO tiket_riwayat (id, tiket_id, status, catatan, created_at) VALUES
(1, 1, 'pending', 'Laporan kerusakan dibuat', '2026-10-12 10:00:00'),
(2, 1, 'diproses', 'Teknisi dijadwalkan datang', '2026-10-12 14:00:00'),
(3, 1, 'selesai', 'Kran diganti baru oleh teknisi pada 13 Oktober 2026', '2026-10-13 11:00:00'),
(4, 2, 'pending', 'Laporan kerusakan dibuat', '2026-10-25 11:20:00'),
(5, 2, 'diproses', 'Jadwal servis pembersihan AC diagendakan besok siang', '2026-10-25 14:00:00'),
(6, 3, 'pending', 'Laporan kerusakan dibuat', '2026-10-27 08:00:00');

-- 7. SEED NOTIFIKASI
INSERT IGNORE INTO notifikasi (id, user_id, tipe, judul, isi, ref, dibaca, created_at) VALUES
(1, 2, 'tagihan', 'Tagihan Baru Diterbitkan', 'Tagihan sewa bulan Oktober 2026 sebesar Rp 1.200.000 telah terbit.', '{"tagihanId": 1}', TRUE, '2026-10-01 08:00:00'),
(2, 3, 'tiket', 'Tiket Diproses', 'Laporan kerusakan AC kurang dingin sedang dijadwalkan untuk perbaikan.', '{"tiketId": 2}', FALSE, '2026-10-25 12:00:00');

-- 8. SEED INFO KOS
INSERT IGNORE INTO info_kos (id, nama, alamat, kontak_whatsapp, telepon, nama_pengelola, jam_kunjung, bank, nomor_rekening, atas_nama, tanggal_jatuh_tempo, deskripsi, aturan) VALUES
(1, 'Kostku Babarsari', 'Jl. Babarsari No. 42, Sleman, D.I. Yogyakarta', '081234567890', '081234567890', 'Hendra Wijaya', '08:00 - 21:00 WIB', 'BCA', '1234567890', 'Hendra Wijaya', 10, 'Kos eksklusif dan nyaman di dekat kampus dengan fasilitas lengkap dan keamanan 24 jam.', 
'["Dilarang merokok di dalam kamar ber-AC.", "Tamu lawan jenis dilarang menginap.", "Jam tenang berlaku mulai pukul 22:00 WIB.", "Menjaga kebersihan area bersama (dapur & tempat jemur)."]');
