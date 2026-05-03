import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/theme';

export default function PrimaryButton({ children, onPress, variant = 'primary' }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, variant === 'secondary' && styles.secondary]}>
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8
  },
  secondary: { backgroundColor: colors.secondary },
  text: { color: 'white', fontWeight: '900' }
});
