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
    void 0;

    const response = await api('/tts/speak', {
      method: 'POST',
      body: {
        text: cleanText,
      },
    });

    void 0;

    const base64Audio =
      response?.audioContent || '';

    void 0;

    if (!base64Audio) {
      isRequestInProgress = false;
      return;
    }

    const audioFile = new File(Paths.cache, `tts-${Date.now()}.mp3`);
    const fileUri = audioFile.uri;

    void 0;

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

    void 0;

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

    void 0;
  } catch (err) {
    isRequestInProgress = false;

    void 0;
    void 0;
    void 0;

    if (err?.response) {
      void 0;
    }

    if (err?.details) {
      void 0;
    }

    void 0;
    void 0;

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
