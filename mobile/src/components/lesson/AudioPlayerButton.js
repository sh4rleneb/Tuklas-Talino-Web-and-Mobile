import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function AudioPlayerButton({
  icon = '🔊',
  label = '',
  onPress,
  disabled = false,
  danger = false,
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        width: 84,
        minHeight: 92,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: danger ? '#FEE2E2' : '#ECFDF5',
        borderWidth: 2,
        borderColor: danger ? '#EF4444' : '#86EFAC',
        margin: 6,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text
        style={{
          fontSize: 34,
        }}
      >
        {icon}
      </Text>

      <Text
        style={{
          marginTop: 8,
          fontSize: 15,
          fontWeight: '900',
          color: danger ? '#B91C1C' : '#166534',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
