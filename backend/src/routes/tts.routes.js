import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { synthesizeFilipinoSpeech } from '../services/googleTts.service.js';

const router = Router();

router.use(authenticate);

router.post('/speak', async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();

    if (!text) {
      return res.status(422).json({
        message: 'Text is required.'
      });
    }

    const audioContent =
      await synthesizeFilipinoSpeech(text);

    res.json({
      audioContent
    });
  } catch (err) {
    next(err);
  }
});

export default router;
