import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function AudioPlayerCard({
  title = '🎵 Lesson Audio',
  icon = '▶️',
  playing = false,
  progress = 0,
  duration = 0,
  status = '',
  onPress,
  formatTime = (ms = 0) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  },

  showStatus = true,
  showProgress = true,
}) {
  const percent =
    duration > 0
      ? Math.min(100, (progress / duration) * 100)
      : 0;

  return (
    <View
      style={{
        backgroundColor: '#ECFDF5',
        borderRadius: 24,
        padding: 20,
        marginTop: 18,
        borderWidth: 2,
        borderColor: '#BBF7D0',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: '900',
          color: '#166534',
          textAlign: 'center',
          marginBottom: 18,
        }}
      >
        {title}
      </Text>

      <TouchableOpacity
        onPress={onPress}
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          alignSelf: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: playing ? '#FEE2E2' : '#DCFCE7',
          borderWidth: 3,
          borderColor: playing ? '#EF4444' : '#22C55E',
        }}
      >
        <Text
          style={{
            fontSize: 38,
          }}
        >
          {icon}
        </Text>
      </TouchableOpacity>

      {showStatus && (
        <Text
          style={{
            textAlign: 'center',
            marginTop: 14,
            color: playing ? '#15803D' : '#64748B',
            fontWeight: '700',
          }}
        >
          {status}
        </Text>
      )}

      {showProgress && duration > 0 && (
        <View
          style={{
            marginTop: 18,
          }}
        >
          <View
            style={{
              height: 10,
              backgroundColor: '#DCFCE7',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${percent}%`,
                backgroundColor: '#22C55E',
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <Text style={{ fontWeight: '700' }}>
              {formatTime(progress)}
            </Text>

            <Text style={{ fontWeight: '700' }}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
