import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient();

export async function synthesizeFilipinoSpeech(text) {
  const cleanText = String(text || '').trim();

  if (!cleanText) {
    throw new Error('Text is required.');
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

  return response.audioContent;
}
