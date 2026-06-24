import { api } from '../api/client';

let currentAudio = null;

export async function speakText(text) {
  const cleanText = String(text || '').trim();

  if (!cleanText) {
    return;
  }

  try {
    const response = await api('/tts/speak', {
      method: 'POST',
      body: {
        text: cleanText
      }
    });

    const base64Audio =
      response?.audioContent || '';

    const binaryString =
      atob(base64Audio);

    const bytes = Uint8Array.from(
      binaryString,
      char => char.charCodeAt(0)
    );

    const blob = new Blob(
      [bytes],
      { type: 'audio/mpeg' }
    );

    const url = URL.createObjectURL(blob);

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
    };

    currentAudio = audio;

    await audio.play();
  } catch (err) {
    console.error(
      'Google TTS failed:',
      err
    );
  }
}

export function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
