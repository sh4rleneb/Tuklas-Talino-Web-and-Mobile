import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, shadow } from '../styles/theme';

export default function Card({ children, style }) {
  return (
    <View
      style={[styles.card, style]}
      pointerEvents="box-none"
      collapsable={false}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadow
  }
});
