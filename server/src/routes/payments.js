/**
 * Payments Routes
 * MVP: Mock payment processing
 * PROD: Integrate Stripe
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/payments
 * Get payment history for current user
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/process
 * Process payment (MVP: mock, PROD: Stripe)
 */
router.post('/process', authMiddleware, async (req, res, next) => {
  try {
    const { amount, planId, paymentMethod } = req.body;
    
    // MVP: Mock payment - always success
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.userId,
        transactionId,
        amount: amount || 0,
        currency: 'CZK',
        status: 'success' // MVP: auto-success
      }
    });
    
    res.json({
      message: 'Payment processed successfully',
      payment: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status
      },
      isMock: true // MVP indicator
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook (PROD only)
 * MVP: Returns 200 OK
 */
router.post('/webhook', (req, res) => {
  // MVP: Just acknowledge
  res.status(200).send('Webhook received');
});

module.exports = router;
