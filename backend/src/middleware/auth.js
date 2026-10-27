const { users } = require('../data/mock');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      status: false,
      message: 'Token autentikasi tidak ditemukan',
    });
  }

  // Mendukung format "Bearer <token>" atau "<token>" langsung
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

  // Ekstrak ID dari mock token (misal: "mock-jwt-token-1") atau kecocokan ID
  let userId = null;
  const match = token.match(/^mock-jwt-token-(\d+)$/);
  if (match) {
    userId = parseInt(match[1], 10);
  } else if (/^\d+$/.test(token)) {
    userId = parseInt(token, 10);
  }

  const user = userId
    ? users.find((u) => u.id === userId)
    : users.find((u) => `mock-jwt-token-${u.id}` === token);

  if (!user) {
    return res.status(401).json({
      success: false,
      status: false,
      message: 'Token tidak valid atau pengguna tidak ditemukan',
    });
  }

  // Mengisi req.user tanpa menyertakan password
  const { password: _, ...userData } = user;
  req.user = userData;

  next();
};

module.exports = authenticate;
module.exports.authenticate = authenticate;
