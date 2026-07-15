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
  tone = 'green',
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
        tone === 'blue' && styles.blueButton,
        tone === 'violet' && styles.violetButton,
        style,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, tone === 'blue' && styles.blueText, tone === 'violet' && styles.violetText, textStyle]}>
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
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 18,
    flexShrink: 1,
  },

  text: {
    color: '#16A34A',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },

  disabled: {
    opacity: 0.6,
  },
  blueButton: {
    borderColor: '#60A5FA',
    shadowColor: '#2563EB',
  },
  blueText: {
    color: '#2563EB',
  },


  violetButton: {
    borderColor: '#C4B5FD',
    shadowColor: '#7C3AED',
  },

  violetText: {
    color: '#7C3AED',
  },

});
