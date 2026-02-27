/**
 * Authentication Controller
 * Handles register, login, logout, and user management
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { registerSchema, loginSchema } = require('../utils/validators');

const prisma = new PrismaClient();

// ⚠️ WARNING: Убедитесь что JWT_SECRET установлен в Railway!
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
const JWT_EXPIRES_IN = '24h';

// Проверка в production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: JWT_SECRET not set! Using default (INSECURE)');
}

/**
 * Register a new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    // Validate input
    const { email, password, fullname, role = 'buyer' } = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        fullname,
        role,
      },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  res.json({ message: 'Logout successful' });
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
};
