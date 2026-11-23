const { users } = require('../data/mock');
const { getPool } = require('../data/db');
const { verifyToken } = require('../utils/jwt');

const syncMockUser = (row) => {
  const user = {
    id: row.id,
    role: row.role,
    nama: row.nama,
    email: row.email,
    noHp: row.no_hp || row.noHp || '',
  };
  const i = users.findIndex((u) => u.id === user.id);
  if (i >= 0) users[i] = { ...users[i], ...user };
  else users.push(user);
  return user;
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      status: false,
      message: 'Token autentikasi tidak ditemukan',
    });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      status: false,
      message: 'Format token tidak valid',
    });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    const expired = err && err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      status: false,
      message: expired
        ? 'Sesi login telah berakhir, silakan login ulang'
        : 'Token autentikasi tidak valid',
    });
  }

  const userId = Number(payload.id || payload.sub);
  if (!userId) {
    return res.status(401).json({
      success: false,
      status: false,
      message: 'Payload token tidak valid',
    });
  }

  try {
    const [rows] = await getPool().query(
      'SELECT id, nama, email, no_hp, role FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        status: false,
        message: 'Pengguna tidak ditemukan',
      });
    }

    req.user = syncMockUser(rows[0]);
    return next();
  } catch (err) {
    console.error('[auth] Gagal verifikasi user di database:', err.message);
    return res.status(503).json({
      success: false,
      status: false,
      message: 'Database tidak dapat diakses saat memverifikasi sesi',
    });
  }
};

const authorize = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user || (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role))) {
      return res.status(403).json({
        success: false,
        status: false,
        message: 'Akses terlarang: peran Anda tidak memiliki izin untuk mengakses resource ini',
      });
    }

    next();
  };
};

authenticate.authenticate = authenticate;
authenticate.authorize = authorize;

module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.authorize = authorize;
