/**
 * JWT Authentication Middleware
 * Protects routes that require authentication
 */
const jwt = require('jsonwebtoken');

// ⚠️ WARNING: Убедитесь что JWT_SECRET установлен в Railway!
// Если не установлен — сервер использует dev-secret (НЕБЕЗОПАСНО!)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// Проверка в production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: JWT_SECRET not set! Using default (INSECURE for production)');
  console.warn('🔐 Set JWT_SECRET in Railway Environment Variables');
}

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'Please include Authorization header with Bearer token'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      error: 'Invalid token',
      message: error.message 
    });
  }
};
