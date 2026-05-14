import { Router } from 'express';
import { optionalAuth } from '../auth.js';
import { createOrder } from '../services/order.service.js';

export const ordersRouter = Router();

ordersRouter.post('/', optionalAuth, async (req, res, next) => {
  try {
    const order = await createOrder({
      userId: req.user?.id || null,
      payload: req.body || {},
    });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
});
