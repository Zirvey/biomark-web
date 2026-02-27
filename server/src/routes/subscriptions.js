/**
 * Subscriptions Routes
 * MVP: Create and get subscriptions
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { createSubscriptionSchema } = require('../utils/validators');

const prisma = new PrismaClient();

/**
 * GET /api/subscriptions
 * Get current user's subscription
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(subscription || null);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/subscriptions
 * Create new subscription (MVP: mock activation)
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    // 🔍 DEBUG: Логируем что пришло
    console.log('🔍 POST /api/subscriptions - req.body:', req.body);
    
    const { plan } = createSubscriptionSchema.parse(req.body);

    // 🔍 DEBUG: Логируем после валидации
    console.log('✅ Validated plan:', plan, typeof plan);

    // Calculate end date based on plan
    const endDate = new Date();
    if (plan === '1month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === '3months') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (plan === '1year') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription (MVP: auto-activate)
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user.userId,
        plan,
        status: 'active',
        startDate: new Date(),
        endDate
      }
    });

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('❌ Subscription creation error:', error);
    next(error);
  }
});

module.exports = router;
