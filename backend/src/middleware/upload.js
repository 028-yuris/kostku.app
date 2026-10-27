const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder uploads/ tersedia di root backend
const uploadDirectory = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Konfigurasi penyimpanan disk
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${baseName}-${uniqueSuffix}${ext}`;
    
    // Simpan path relatif di properti file (misal: "uploads/foto-12345.jpg")
    file.relativePath = `uploads/${filename}`;
    
    cb(null, filename);
  },
});

// Filter tipe file gambar (maksimal jenis umum: jpeg, jpg, png, webp, gif)
const fileFilter = (_req, file, cb) => {
  const allowedExtensions = /^\.(jpg|jpeg|png|webp|gif)$/i;
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeImage = file.mimetype.startsWith('image/');
  const isExtAllowed = allowedExtensions.test(ext);

  if (isMimeImage && isExtAllowed) {
    cb(null, true);
  } else {
    const error = new Error('Format file tidak didukung. Hanya file gambar (JPG, JPEG, PNG, WEBP, GIF) yang diizinkan');
    error.code = 'LIMIT_FILE_TYPES';
    cb(error, false);
  }
};

// Instance multer utama dengan batas ukuran 2 MB
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
  fileFilter,
});

/**
 * Middleware wrapper untuk upload gambar dengan penanganan error ramah respons JSON (400)
 * Mendukung pemanggilan fleksibel:
 *   - uploadGambar() -> menerima field 'foto', 'bukti', 'tiket', 'kamar', atau 'gambar'
 *   - uploadGambar('bukti') -> menerima field spesifik
 */
const uploadGambar = (fieldNames = ['foto', 'bukti', 'tiket', 'kamar', 'gambar']) => {
  return (req, res, next) => {
    const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

    upload.any()(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            status: false,
            message: 'Ukuran file terlalu besar. Maksimal 2 MB',
          });
        }
        if (err.code === 'LIMIT_FILE_TYPES') {
          return res.status(400).json({
            success: false,
            status: false,
            message: err.message,
          });
        }
        return res.status(400).json({
          success: false,
          status: false,
          message: err.message || 'Gagal mengunggah file',
        });
      }

      // Pastikan req.file terisi dengan file yang cocok dan path relatif sudah rapi
      if (req.files && req.files.length > 0) {
        const target = req.files.find((f) => fields.includes(f.fieldname)) || req.files[0];
        target.relativePath = `uploads/${target.filename}`;
        req.file = target;
      } else if (req.file) {
        req.file.relativePath = `uploads/${req.file.filename}`;
      }

      next();
    });
  };
};

module.exports = uploadGambar;
module.exports.upload = upload;
module.exports.uploadGambar = uploadGambar;
module.exports.uploadSingle = (fieldName) => uploadGambar(fieldName);
