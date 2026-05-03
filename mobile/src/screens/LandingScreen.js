import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../styles/theme';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Card style={styles.hero}>
        <Text style={styles.mascot}>📚</Text>
        <Text style={styles.eyebrow}>Filipino Learning Companion</Text>
        <Text style={styles.title}>Tuklas Talino</Text>
        <Text style={styles.subtitle}>Makukulay na aralin, XP, badges, at pangkatang gawain para sa Filipino.</Text>
        <PrimaryButton onPress={() => navigation.navigate('Login', { role: 'student' })}>Student Login</PrimaryButton>
        <PrimaryButton variant="secondary" onPress={() => navigation.navigate('Login', { role: 'teacher' })}>Teacher Login</PrimaryButton>
        <PrimaryButton variant="secondary" onPress={() => navigation.navigate('Login', { role: 'admin' })}>Admin Login</PrimaryButton>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 18, justifyContent: 'center' },
  hero: { alignItems: 'center' },
  mascot: { fontSize: 72 },
  eyebrow: { color: colors.primary, fontWeight: '900', textTransform: 'uppercase', marginTop: 8 },
  title: { fontSize: 42, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  subtitle: { color: colors.muted, textAlign: 'center', marginBottom: 12, fontSize: 16 }
});
