import { Router } from 'express';
import { createNewsletterSubscription } from '../services/newsletter.service.js';

export const newsletterRouter = Router();

newsletterRouter.post('/', async (req, res, next) => {
  try {
    const subscription = await createNewsletterSubscription(req.body || {});
    res.status(201).json({ subscription });
  } catch (error) {
    next(error);
  }
});
