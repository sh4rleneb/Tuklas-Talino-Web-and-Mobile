import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, shadow } from '../styles/theme';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    ...shadow
  }
});
