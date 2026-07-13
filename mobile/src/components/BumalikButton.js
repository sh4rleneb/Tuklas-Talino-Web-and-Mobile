import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

export default function BumalikButton({
  onPress,
  disabled = false,
  style,
  textStyle,
  label = '← Bumalik',
  accessibilityLabel = 'Bumalik',
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        style,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 999,
    backgroundColor: '#F0FDF4',
    marginBottom: 18,
  },

  text: {
    color: '#16A34A',
    fontSize: 18,
    fontWeight: '900',
  },

  disabled: {
    opacity: 0.6,
  },
});
