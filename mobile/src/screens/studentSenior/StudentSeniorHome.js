// StudentSeniorHome.js

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentSeniorHome({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 110,
          }}
        >

          {/* HEADER */}

          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>
                🏡 Tuklas Talino
              </Text>

              <Text style={styles.studentInfo}>
                Maya • Grade 4 • Matalino
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => navigation.replace('Landing')}
            >
              <Text style={styles.logoutText}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>

          {/* HERO */}

          <View style={styles.heroCard}>

            <View style={styles.heroTop}>
              <Text style={styles.avatar}>
                🦄
              </Text>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>
                  Hi Maya!
                </Text>

                <Text style={styles.heroSubtitle}>
                  Ready ka na ba sa learning adventure today?
                </Text>
              </View>
            </View>

            <View style={styles.xpCard}>
              <Text style={styles.xpLabel}>
                XP Points
              </Text>

              <Text style={styles.xpValue}>
                38 XP
              </Text>

              <View style={styles.progressBg}>
                <View style={styles.progressFill} />
              </View>

              <Text style={styles.xpSub}>
                62 XP pa bago ang next level.
              </Text>
            </View>

          </View>

          {/* LESSONS */}

          <View style={styles.section}>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Your Lessons
              </Text>

              <Text style={styles.allLessons}>
                All Lessons →
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.lessonCard, {
                backgroundColor: '#EEF4FF',
              }]}
            >
              <Text style={styles.lessonEmoji}>
                🎧
              </Text>

              <Text style={styles.lessonTag}>
                Bokabularyo
              </Text>

              <Text style={styles.lessonTitle}>
                Bahagi ng Pananalita
              </Text>

              <TouchableOpacity style={styles.startBtn}>
                <Text style={styles.startText}>
                  Start
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.lessonCard, {
                backgroundColor: '#FFF0F7',
              }]}
            >
              <Text style={styles.lessonEmoji}>
                📖
              </Text>

              <Text style={styles.lessonTag}>
                Reading
              </Text>

              <Text style={styles.lessonTitle}>
                Reading Comprehension
              </Text>

              <TouchableOpacity style={styles.startBtn}>
                <Text style={styles.startText}>
                  Start
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

          </View>

          {/* BADGES */}

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Badges
            </Text>

            <View style={styles.badgeRow}>

              <View style={styles.badgeUnlocked}>
                <Text style={styles.badgeEmoji}>
                  🌱
                </Text>

                <Text style={styles.badgeText}>
                  Unang Hakbang
                </Text>
              </View>

              <View style={styles.badgeLocked}>
                <Text style={styles.badgeEmoji}>
                  🔒
                </Text>

                <Text style={styles.badgeLockedText}>
                  Reader
                </Text>
              </View>

              <View style={styles.badgeLocked}>
                <Text style={styles.badgeEmoji}>
                  🔒
                </Text>

                <Text style={styles.badgeLockedText}>
                  Speaker
                </Text>
              </View>

            </View>

          </View>

          {/* STATS */}

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Statistics
            </Text>

            <View style={styles.statsRow}>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  12
                </Text>

                <Text style={styles.statLabel}>
                  Lessons
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  38
                </Text>

                <Text style={styles.statLabel}>
                  XP
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  4
                </Text>

                <Text style={styles.statLabel}>
                  Badges
                </Text>
              </View>

            </View>

          </View>

        </ScrollView>

        {/* BOTTOM NAV */}

        <View style={styles.bottomNav}>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.activeNav}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📚</Text>
            <Text style={styles.navText}>Lessons</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🧠</Text>
            <Text style={styles.navText}>Quizzes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },

  container: {
    flex: 1,
  },

  header: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 24,
    padding: 20,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#22C55E',
  },

  studentInfo: {
    marginTop: 6,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },

  logoutBtn: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
  },

  logoutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 20,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    fontSize: 54,
    marginRight: 14,
  },

  heroTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#22C55E',
  },

  heroSubtitle: {
    fontSize: 18,
    color: '#334155',
    marginTop: 6,
    lineHeight: 28,
  },

  xpCard: {
    backgroundColor: '#F8FAFC',
    marginTop: 22,
    borderRadius: 24,
    padding: 18,
  },

  xpLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  xpValue: {
    fontSize: 46,
    fontWeight: '900',
    color: '#22C55E',
    marginTop: 10,
  },

  progressBg: {
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 30,
    marginTop: 18,
    overflow: 'hidden',
  },

  progressFill: {
    width: '42%',
    height: '100%',
    backgroundColor: '#22C55E',
  },

  xpSub: {
    marginTop: 14,
    fontSize: 16,
    color: '#64748B',
  },

  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 28,
    padding: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },

  allLessons: {
    color: '#22C55E',
    fontWeight: '700',
    fontSize: 15,
  },

  lessonCard: {
    marginTop: 18,
    borderRadius: 24,
    padding: 20,
  },

  lessonEmoji: {
    fontSize: 42,
  },

  lessonTag: {
    color: '#22C55E',
    fontWeight: '700',
    marginTop: 10,
    fontSize: 15,
  },

  lessonTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10,
    lineHeight: 34,
  },

  startBtn: {
    marginTop: 18,
    backgroundColor: '#16A34A',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 18,
  },

  startText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  badgeUnlocked: {
    width: '31%',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: 'center',
  },

  badgeLocked: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: 'center',
  },

  badgeEmoji: {
    fontSize: 34,
  },

  badgeText: {
    marginTop: 10,
    fontWeight: '800',
    color: '#166534',
    textAlign: 'center',
    fontSize: 16,
  },

  badgeLockedText: {
    marginTop: 10,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  statCard: {
    width: '31%',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#22C55E',
  },

  statLabel: {
    marginTop: 8,
    fontSize: 15,
    color: '#334155',
    fontWeight: '700',
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor: '#FFFFFF',

    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    paddingVertical: 14,

    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },

  navItem: {
    alignItems: 'center',
  },

  navIcon: {
    fontSize: 24,
  },

  activeNav: {
    marginTop: 4,
    color: '#16A34A',
    fontWeight: '800',
    fontSize: 13,
  },

  navText: {
    marginTop: 4,
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },

});