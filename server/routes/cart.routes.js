import { Router } from 'express';
import { requireAuth } from '../auth.js';
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  syncCartItems,
  updateCartItem,
} from '../services/cart.service.js';

export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get('/', async (req, res, next) => {
  try {
    res.json(await getCart(req.user.id));
  } catch (error) {
    next(error);
  }
});

cartRouter.post('/items', async (req, res, next) => {
  try {
    res.json(await addCartItem(req.user.id, req.body));
  } catch (error) {
    next(error);
  }
});

cartRouter.patch('/items/:id', async (req, res, next) => {
  try {
    res.json(await updateCartItem(req.user.id, req.params.id, req.body?.qty));
  } catch (error) {
    next(error);
  }
});

cartRouter.delete('/items/:id', async (req, res, next) => {
  try {
    res.json(await removeCartItem(req.user.id, req.params.id));
  } catch (error) {
    next(error);
  }
});

cartRouter.delete('/', async (req, res, next) => {
  try {
    res.json(await clearCart(req.user.id));
  } catch (error) {
    next(error);
  }
});

cartRouter.post('/sync', async (req, res, next) => {
  try {
    res.json(await syncCartItems(req.user.id, req.body?.items || []));
  } catch (error) {
    next(error);
  }
});
