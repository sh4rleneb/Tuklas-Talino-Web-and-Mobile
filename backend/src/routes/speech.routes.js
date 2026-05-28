import express from 'express';
import multer from 'multer';
import fs from 'fs';
import OpenAI from 'openai';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post(
  '/pronunciation',
  upload.single('audio'),
  async (req, res) => {
    try {
      const { targetText } = req.body;

      if (!req.file) {
        return res.status(400).json({
          message: 'Audio file is required.',
        });
      }

      if (!targetText) {
        return res.status(400).json({
          message: 'Target text is required.',
        });
      }

      const transcription =
        await openai.audio.transcriptions.create({
          file: fs.createReadStream(req.file.path),
          model: 'gpt-4o-mini-transcribe',
          language: 'tl',
        });

      const transcript = transcription.text || '';

      const ai = await openai.responses.create({
        model: 'gpt-4.1-mini',
        input: `
You are a Filipino pronunciation checker for Grade 1 to Grade 6 students.

Target sentence:
"${targetText}"

Student transcript:
"${transcript}"

Return ONLY valid JSON:
{
  "accuracy": number from 0 to 100,
  "status": "good" | "needs_practice" | "try_again",
  "feedback": "short child-friendly Tagalog feedback with English translation"
}
        `,
      });

      let result;

      try {
        result = JSON.parse(ai.output_text);
      } catch {
        result = {
          accuracy: 70,
          status: 'needs_practice',
          feedback:
            'Magaling ang pagsubok! Practice pa nang kaunti. / Good try! Practice a little more.',
        };
      }

      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.json({
        transcript,
        accuracy: result.accuracy,
        status: result.status,
        feedback: result.feedback,
      });
    } catch (err) {
      console.error(err);

      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        message: 'Speech AI feedback failed.',
      });
    }
  }
);

export default router;