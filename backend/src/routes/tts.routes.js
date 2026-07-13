import { Router } from 'express';
import { PERMISSIONS } from '../constants/permissions.js';
import {
  authenticate,
  requirePasswordChanged,
  requirePermission
} from '../middleware/auth.js';
import { synthesizeFilipinoSpeech } from '../services/googleTts.service.js';

const router = Router();

router.use(
  authenticate,
  requirePasswordChanged,
  requirePermission(PERMISSIONS.TTS_USE)
);

router.post('/speak', async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();

    if (!text) {
      return res.status(422).json({
        message: 'Text is required.'
      });
    }

    if (text.length > 5000) {
      return res.status(422).json({
        message:
          'Text must not exceed 5,000 characters.'
      });
    }

    const audioContent =
      await synthesizeFilipinoSpeech(text);

    res.json({
      audioContent: audioContent.toString('base64')
    });
  } catch (err) {
    next(err);
  }
});

export default router;
