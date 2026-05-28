import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

export default function StudentJuniorHome() {

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.logo}>
          🏡 Tuklas Talino
        </Text>

        <TouchableOpacity
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* HERO */}

      <View style={styles.hero}>
        <Image
          source={require('../../../assets/characters/student.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />

        <View style={styles.heroCard}>
          <Text style={styles.greeting}>
            Kamusta, Lia! 👋
          </Text>

          <Text style={styles.subtitle}>
            Ready ka na ba sa
            learning adventure?
          </Text>

          <View style={styles.xpContainer}>
            <Text style={styles.xpText}>
              ⭐ 15 XP
            </Text>

            <Text style={styles.level}>
              Level 1
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      {/* NAVIGATION */}

      <View style={styles.navCard}>
        {[
          '🏠 Home',
          '📘 Lessons',
          '🧠 Quizzes',
          '🎮 Missions',
          '👥 Groups',
          '🐰 Profile',
        ].map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.navButton}
          >
            <Text style={styles.navText}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LESSONS */}

      <Text style={styles.sectionTitle}>
        Mga Aralin
      </Text>

      <TouchableOpacity
        style={styles.lessonCard}
      >
        <Text style={styles.lessonEmoji}>
          📖
        </Text>

        <View>
          <Text style={styles.lessonTitle}>
            Pagbasa
          </Text>

          <Text style={styles.lessonSub}>
            Learn reading basics
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.lessonCard}
      >
        <Text style={styles.lessonEmoji}>
          🔤
        </Text>

        <View>
          <Text style={styles.lessonTitle}>
            Bokabularyo
          </Text>

          <Text style={styles.lessonSub}>
            Learn new words
          </Text>
        </View>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F4FFF4',
    paddingHorizontal: 18,
  },

  header: {
    marginTop: 55,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logo: {
    fontSize: 26,
    fontWeight: '900',
    color: '#16A34A',
  },

  logoutButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
  },

  logoutText: {
    color: '#DC2626',
    fontWeight: '800',
  },

  hero: {
    marginTop: 24,

    backgroundColor: '#22C55E',
    borderRadius: 36,

    padding: 20,
  },

  heroImage: {
    width: '100%',
    height: 250,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    marginTop: 18,
  },

  greeting: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0F172A',
  },

  subtitle: {
    marginTop: 10,
    fontSize: 20,
    color: '#475569',
    lineHeight: 30,
  },

  xpContainer: {
    marginTop: 20,

    flexDirection: 'row',
    alignItems: 'center',
  },

  xpText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
  },

  level: {
    marginLeft: 15,

    backgroundColor: '#FEF3C7',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,

    fontWeight: '800',
    color: '#92400E',
  },

  progressBar: {
    marginTop: 24,
    height: 12,
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
  },

  progressFill: {
    width: '22%',
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 999,
  },

  navCard: {
    marginTop: 24,

    backgroundColor: '#FFFFFF',
    borderRadius: 28,

    padding: 18,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  navButton: {
    backgroundColor: '#FEF3C7',

    width: '48%',

    borderRadius: 22,

    paddingVertical: 18,

    alignItems: 'center',

    marginBottom: 12,
  },

  navText: {
    fontWeight: '800',
    color: '#0F172A',
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 18,

    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
  },

  lessonCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 30,

    padding: 22,

    marginBottom: 16,

    flexDirection: 'row',
    alignItems: 'center',
  },

  lessonEmoji: {
    fontSize: 50,
    marginRight: 18,
  },

  lessonTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },

  lessonSub: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 15,
  },
});