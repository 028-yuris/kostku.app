const path = require('path');
const jwt = require('jsonwebtoken');

try {
  process.loadEnvFile(path.join(__dirname, '..', '..', '.env'));
} catch {
  /* .env opsional */
}

const JWT_SECRET = process.env.JWT_SECRET || 'kostku_dev_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      id: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
