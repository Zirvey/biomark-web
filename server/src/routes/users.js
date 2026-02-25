/**
 * User Routes
 * Includes GDPR compliance endpoints
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { updateProfileSchema } = require('../utils/validators');

const prisma = new PrismaClient();

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware, async (req, res, next) => {
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
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: {
        id: true,
        email: true,
        fullname: true,
        phone: true,
        address: true,
        role: true,
        updatedAt: true,
      }
    });
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/profile
 * GDPR: Right to be forgotten
 */
router.delete('/profile', authMiddleware, async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.userId }
    });
    
    res.json({ 
      message: 'Account deleted successfully',
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/data
 * GDPR: Data export (all user data)
 */
router.get('/data', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        orders: { 
          include: { 
            items: true 
          },
          orderBy: { createdAt: 'desc' }
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
      },
      orders: user.orders,
      subscriptions: user.subscriptions,
      payments: user.payments,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
