import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const client = new textToSpeech.TextToSpeechClient();

const CACHE_DIR = path.resolve('tts-cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export async function synthesizeFilipinoSpeech(text) {
  const cleanText = String(text || '').trim();

  if (!cleanText) {
    throw new Error('Text is required.');
  }

  const hash = crypto
    .createHash('sha256')
    .update(cleanText)
    .digest('hex');

  const cacheFile = path.join(
    CACHE_DIR,
    `${hash}.mp3`
  );

  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile);
  }

  const [response] = await client.synthesizeSpeech({
    input: {
      text: cleanText
    },

    voice: {
      languageCode: 'fil-PH',
      name: 'fil-PH-Neural2-A'
    },

    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.9,
      pitch: 0.0
    }
  });

  fs.writeFileSync(
    cacheFile,
    response.audioContent
  );

  return response.audioContent;
}
