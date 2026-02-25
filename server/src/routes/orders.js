/**
 * Orders Routes
 * MVP: Basic CRUD for orders
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { createOrderSchema } = require('../utils/validators');

const prisma = new PrismaClient();

/**
 * GET /api/orders
 * Get all orders for current user
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Get specific order
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { 
        id: parseInt(req.params.id),
        userId: req.user.userId 
      },
      include: {
        items: true
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders
 * Create new order
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { items, deliveryDate, address } = createOrderSchema.parse(req.body);
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + item.total, 0);
    
    // Create order
    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        total,
        deliveryDate,
        address: address || req.user.address,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          }))
        }
      },
      include: {
        items: true
      }
    });
    
    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
