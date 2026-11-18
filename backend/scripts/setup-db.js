const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function findMysqlBinary() {
  // 1. Cek dari environment variable jika ada
  if (process.env.MYSQL_PATH && fs.existsSync(process.env.MYSQL_PATH)) {
    return process.env.MYSQL_PATH;
  }

  // 2. Cek lokasi default XAMPP
  const xamppPath = 'C:\\xampp\\mysql\\bin\\mysql.exe';
  if (fs.existsSync(xamppPath)) {
    return xamppPath;
  }

  // 3. Cek lokasi default Laragon
  const laragonDir = 'C:\\laragon\\bin\\mysql';
  if (fs.existsSync(laragonDir)) {
    try {
      const versions = fs.readdirSync(laragonDir);
      for (const ver of versions) {
        const p = path.join(laragonDir, ver, 'bin', 'mysql.exe');
        if (fs.existsSync(p)) return p;
      }
    } catch (e) {}
  }

  // 4. Default panggil 'mysql' langsung dari PATH
  return 'mysql';
}

function runSetup() {
  const schemaPath = path.join(__dirname, '..', 'src', 'data', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ File schema.sql tidak ditemukan di: ${schemaPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(schemaPath, 'utf8');
  const mysqlBin = findMysqlBinary();

  // Konfigurasi koneksi (default XAMPP: user root, tanpa password, host localhost)
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const args = [`-h${host}`, `-P${port}`, `-u${user}`];
  if (password) {
    args.push(`-p${password}`);
  }

  console.log('🔄 Menghubungkan ke MySQL dan mengeksekusi schema.sql...');
  console.log(`📌 Menggunakan MySQL binary: ${mysqlBin}`);

  const result = spawnSync(mysqlBin, args, {
    input: sqlContent,
    encoding: 'utf8',
    shell: true,
  });

  if (result.error || result.status !== 0) {
    const errMsg = (result.stderr || result.error?.message || '').trim();
    console.error('\n❌ Gagal membuat database!');
    console.error('--------------------------------------------------');
    console.error(errMsg);
    console.error('--------------------------------------------------');
    console.error('\n💡 Tips Penanganan Masalah:');
    console.error(' 1. Jika menggunakan XAMPP, pastikan modul MySQL sudah di-START di XAMPP Control Panel.');
    console.error(' 2. Pastikan port 3306 tidak diblokir atau bentrok.');
    console.error(' 3. Jika MySQL Anda memakai password, atur environment variable:');
    console.error('    $env:DB_PASSWORD="password_anda" lalu jalankan ulang npm run db:setup\n');
    process.exit(1);
  }

  console.log('\n==================================================');
  console.log('🎉 Database "kostku_db" Berhasil Dibuat!');
  console.log('==================================================');
  console.log('✅ Database        : kostku_db');
  console.log('✅ Status          : 10 Tabel & Foreign Key siap');
  console.log('✅ Data Awal (Seed): Data mock pengguna, kamar, sewa, tagihan, tiket berhasil dimasukkan');
  console.log('🌐 Buka phpMyAdmin : http://localhost/phpmyadmin');
  console.log('==================================================\n');
}

runSetup();
