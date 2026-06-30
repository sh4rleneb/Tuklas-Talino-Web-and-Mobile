import { Audio } from 'expo-av';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { File, Paths } from 'expo-file-system';

import { api } from '../api/client';

let currentSound = null;
let isRequestInProgress = false;
let isSpeaking = false;

let playbackPosition = 0;
let playbackDuration = 0;

export async function speakText(text, callbacks = {}) {
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

    console.log(
      '[TTS] Base64 length:',
      base64Audio?.length || 0
    );

    if (!base64Audio) {
      isRequestInProgress = false;
      return;
    }

    const audioFile = new File(Paths.cache, `tts-${Date.now()}.mp3`);
    const fileUri = audioFile.uri;

    console.log('[TTS] Writing file:', fileUri);

    await LegacyFileSystem.writeAsStringAsync(
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

    isSpeaking = true;

    callbacks.onStart?.();

    currentSound.setOnPlaybackStatusUpdate((status) => {

      if (!status.isLoaded) {
        return;
      }

      playbackPosition = status.positionMillis || 0;
      playbackDuration = status.durationMillis || 0;
      isSpeaking = status.isPlaying || false;

      callbacks.onStatus?.({
        positionMillis: playbackPosition,
        durationMillis: playbackDuration,
        isPlaying: isSpeaking,
      });

      if (status.didJustFinish) {

        playbackPosition = playbackDuration;
        isRequestInProgress = false;
        isSpeaking = false;

        currentSound = null;

        callbacks.onFinish?.();
      }
    });

    console.log('[TTS] Playback started');
  } catch (err) {
    isRequestInProgress = false;

    console.log('========== TTS ERROR ==========');
    console.log('Message:', err?.message);
    console.log('Name:', err?.name);

    if (err?.response) {
      console.log('Response:', JSON.stringify(err.response, null, 2));
    }

    if (err?.details) {
      console.log('Details:', JSON.stringify(err.details, null, 2));
    }

    console.log('Raw Error:', err);
    console.log('===============================');

    console.error('Mobile Google TTS failed:', err);
  }
}

export async function stopSpeech() {
  if (!currentSound) {
    isRequestInProgress = false;
    return;
  }

  await currentSound.stopAsync();
  await currentSound.unloadAsync();

  currentSound = null;
  isRequestInProgress = false;
  isSpeaking = false;

  playbackPosition = 0;
  playbackDuration = 0;
}

export function getSpeechPlaybackState() {
  return {
    playing: isSpeaking,
    position: playbackPosition,
    duration: playbackDuration,
  };
}

export function isSpeechPlaying() {
  return isSpeaking;
}
