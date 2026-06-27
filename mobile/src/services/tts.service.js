import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

import { api } from '../api/client';

let currentSound = null, isRequestInProgress = false;

export async function speakText(text) {
  const cleanText = String(text || '').trim();

  if (!cleanText) {
    return;
  }
    if (isRequestInProgress) {
      return;
    }

    

    isRequestInProgress = true;

  try {
    console.log('[TTS] Requesting audio');

    const response = await api('/tts/speak', {
      method: 'POST',
      body: {
        text: cleanText,
      },
    });

    console.log('[TTS] Response received');

    const base64Audio =
      response?.audioContent || '';

    console.log('[TTS] Base64 length:', base64Audio?.length || 0);

    if (!base64Audio) {
      return;
    }

    const fileUri =
      `${FileSystem.cacheDirectory}tts-${Date.now()}.mp3`;

    console.log('[TTS] Writing file:', fileUri);

    await FileSystem.writeAsStringAsync(
      fileUri,
      base64Audio,
      {
        encoding: 'base64',
      }
    );

    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    console.log('[TTS] Creating sound');

    const result =
      await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      );

    currentSound = result.sound;
    // FRAMEWORK TEST
    console.log('[TTS] Playback started');
  } catch (err) {
    console.error(
      'Mobile Google TTS failed:',
      err
    );
  }
}

export async function stopSpeech() {
  if (!currentSound) {
    return;
  }

  await currentSound.stopAsync();
  await currentSound.unloadAsync();

  currentSound = null;
}
