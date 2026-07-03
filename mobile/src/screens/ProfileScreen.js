import React, { useCallback, useState } from 'react';

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

import {
    ActivityIndicator,
  } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { setToken } from '../api/client';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../styles/theme';

const avatars = [
  '🦋',
  '🐸',
  '🦊',
  '🐨',
  '🦁',
  '🐼',
  '🐯',
  '🐙',
  '🦉',
  '🐢',
  '🧒',
  '👧',
];

function formatXpLogDate(log) {
  const rawDate =
    log?.createdAt ||
    log?.created_at ||
    log?.awardedAt ||
    log?.awarded_at ||
    log?.completedAt ||
    log?.completed_at ||
    log?.updatedAt ||
    log?.updated_at ||
    log?.timestamp ||
    log?.date;

  if (!rawDate) return 'Date unavailable';

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';

  return parsedDate.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ProfileScreen({
  navigation,
}) {
  const [dashboard, setDashboard] = useState(null);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const load = useCallback(() => api('/dashboard').then(setDashboard), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));


  function confirmLogout() {
    setLogoutVisible(true);
  }

async function handleLogout() {
    setLogoutVisible(false);
    await setToken(null);
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

  async function choose(avatar) {
    await api(`/students/${dashboard.student.id}/avatar`, { method: 'PATCH', body: { avatar } });
    Alert.alert('Avatar', 'Na-update na ang iyong avatar!');
    load();
  }

    if (!dashboard) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#F3FAF5',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              marginBottom: 24,
              gap: 10,
            }}
          >
            <Text style={{fontSize: 44}}>🦊</Text>
            <Text style={{fontSize: 44}}>🐼</Text>
            <Text style={{fontSize: 44}}>🐯</Text>
            <Text style={{fontSize: 44}}>🐸</Text>
          </View>

          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              borderWidth: 2,
              borderColor: '#F2D36B',
              paddingHorizontal: 35,
              paddingVertical: 20,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: '#16213E',
              }}
            >
              ⏳ Naglo-load...
            </Text>
          </View>
        </View>
      );
    }

  return (
  <ScrollView
    style={styles.screen}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{
      paddingBottom: 140,
    }}
  >

    <View style={styles.topCard}>

      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/icons/tuklas-logo.png')}
          style={styles.brandLogoImage}
          resizeMode="contain"
        />
        <Text style={styles.brand}>
          Tuklas Talino
        </Text>
      </View>

      <View style={styles.pillsRow}>

        <View style={styles.infoPill}>
          <Text style={styles.infoText}>
            🌸 Baitang {dashboard.student.gradeLevel} • {dashboard.student.section}
          </Text>
        </View>

        <View style={styles.xpPill}>
          <Text style={styles.infoText}>
            ⚡ {dashboard.student.xp || 0} XP
          </Text>
        </View>

      </View>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.homeButtonText}>
          🏠 Tahanan
        </Text>
      </TouchableOpacity>

    </View>

    <View style={styles.profileCard}>

      <View style={styles.avatarContainer}>
        <Text style={styles.bigAvatar}>
          {dashboard.student.avatar}
        </Text>
      </View>

      <Text style={styles.profileTitle}>
        {dashboard.student.name}
      </Text>

      <View style={styles.studentBadge}>
        <Text style={styles.studentBadgeText}>
          🌟 Masipag na Baitang {dashboard.student.gradeLevel} Mag-aaral
        </Text>
      </View>

      <Text style={styles.profileSubtitle}>
        Piliin ang avatar mo at tingnan
        ang buod ng iyong pag-aaral.
      </Text>

      <View style={styles.levelCard}>
        <Text style={styles.levelText}>
          🪙 {dashboard.student.xp || 0} XP • Antas {Math.floor((dashboard.student.xp || 0) / 100) + 1}
        </Text>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(dashboard.student.xp || 0) % 100}%`,
              },
            ]}
          />
        </View>

      </View>

    </View>

    <View style={styles.sectionCard}>

      <Text style={styles.sectionTitle}>
        🐰 Avatar
      </Text>

      <Text style={styles.sectionSubtitle}>
        Piliin ang avatar na gusto mong gamitin.
      </Text>

      <View style={styles.avatars}>

        {avatars.map((a) => (
          <Pressable
            key={a}
            style={[
            styles.choice,
            dashboard.student.avatar === a &&
            styles.selectedChoice,
          ]}
            onPress={() => choose(a)}
          >
            <Text style={styles.choiceText}>
              {a}
            </Text>
          </Pressable>
        ))}

      </View>

    </View>

    <View style={styles.sectionCard}>

      <Text style={styles.sectionTitle}>
        📊 Buod
      </Text>

      <Text style={styles.sectionSubtitle}>
        Basic profile and progress information.
      </Text>

      <View style={styles.summaryGrid}>

        <View
          style={[
            styles.summaryItem,
            { backgroundColor: '#EEFDF3' }
          ]}
        >
          <Text style={styles.summaryValue}>
            {dashboard.student.name}
          </Text>

          <Text style={styles.summaryLabel}>
            Name
          </Text>
        </View>

        <View
          style={[
            styles.summaryItem,
            { backgroundColor: '#FEF3C7' }
          ]}
        >
          <Text style={styles.summaryValue}>
            Baitang {dashboard.student.gradeLevel}
          </Text>

          <Text style={styles.summaryLabel}>
            Baitang
          </Text>
        </View>

        <View
          style={[
            styles.summaryItem,
            { backgroundColor: '#DBEAFE' }
          ]}
        >
          <Text style={styles.summaryValue}>
            {dashboard.student.section}
          </Text>

          <Text style={styles.summaryLabel}>
            Seksyon
          </Text>
        </View>

        <View
          style={[
            styles.summaryItem,
            { backgroundColor: '#FCE7F3' }
          ]}
        >

          <Text style={styles.summaryValue}>
            {dashboard.student.xp || 0}
          </Text>

          <Text style={styles.summaryLabel}>
            XP
          </Text>
        </View>

        <View
          style={[
            styles.summaryItem,
            { backgroundColor: '#FFF7ED' }
          ]}
        >
          <Text style={styles.summaryValue}>
            🔥 {dashboard.student.currentStreak || 0}
          </Text>

          <Text style={styles.summaryLabel}>
            Sunod-sunod na Araw
          </Text>
        </View>

        <View
          style={[
            styles.summaryItem,
            { backgroundColor: '#F5F3FF' }
          ]}
        >
          <Text style={styles.summaryValue}>
            🏆 {dashboard.student.longestStreak || 0}
          </Text>

          <Text style={styles.summaryLabel}>
            Pinakamahabang Sunod-sunod
          </Text>
        </View>

      </View>

    </View>

      <TouchableOpacity
        style={styles.leaderboardNavCard}
        activeOpacity={0.88}
        onPress={() => {
          const parentNav = navigation.getParent?.();

          if (parentNav) {
            parentNav.navigate('Leaderboard');
          } else {
            navigation.navigate('Leaderboard');
          }
        }}
      >
        <View style={styles.leaderboardNavIcon}>
          <Text style={styles.leaderboardNavEmoji}>🏆</Text>
        </View>

        <View style={styles.leaderboardNavContent}>
          <Text style={styles.leaderboardNavTitle}>
            Talaan ng Ranggo
          </Text>

          <Text style={styles.leaderboardNavText}>
            Tingnan ang ranggo mo sa klase, XP, at sunod-sunod na araw ng pagkatuto.
          </Text>
        </View>

        <Text style={styles.leaderboardNavArrow}>→</Text>
      </TouchableOpacity>

    <View style={styles.sectionCard}>

      <Text style={styles.sectionTitle}>
        ⭐ Kasaysayan ng XP
      </Text>

      <Text style={styles.sectionSubtitle}>
        Tingnan kung saan nanggaling ang iyong XP.
      </Text>

        {(dashboard?.xpLogs || []).length ? (
          <>
            {(dashboard.xpLogs || []).slice(0, 3).map((log, index) => {
              const icon =
                log.sourceType === 'lesson' ? '📚' :
                log.sourceType === 'quiz' ? '📝' :
                log.sourceType === 'mcq' ? '🧠' :
                log.sourceType === 'writing' ? '✍️' :
                log.sourceType === 'speech' ? '🎤' :
                log.sourceType === 'mission' ? '🚀' :
                '⭐';

              return (
                <View key={log.id || index} style={styles.xpLogItem}>
                  <View style={styles.xpLogAccent} />

                  <View style={styles.xpLogIconBubble}>
                    <Text style={styles.xpLogIcon}>{icon}</Text>
                  </View>

                  <View style={styles.xpLogContent}>
                    <Text style={styles.xpLogPoints}>
                      +{log.points} XP
                    </Text>

                    <Text style={styles.xpLogNote}>
                      {log.note || 'Nakuhang XP'}
                    </Text>

                    <Text style={styles.xpDate}>
                      🕒 {formatXpLogDate(log)}
                    </Text>
                  </View>
                </View>
              );
            })}

            {(dashboard.xpLogs || []).length > 3 ? (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => navigation.navigate('XPHistory', { xpLogs: dashboard.xpLogs || [] })}
              >
                <Text style={styles.moreButtonText}>More</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
        <Text style={styles.xpLogEmpty}>
          Wala ka pang kasaysayan ng XP.
        </Text>
      )}

    </View>

    <View style={[styles.sectionCard, styles.accountCard]}>

      <Text style={styles.sectionTitle}>
        🚪 Iyong Account
      </Text>

      <Text style={styles.sectionSubtitle}>
        Kung tapos ka na, pindutin ang Mag-log Out sa ibaba.
      </Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={confirmLogout}
      >
        <Text style={styles.logoutButtonText}>
          Mag-log Out
        </Text>
      </TouchableOpacity>

    </View>


    <Modal
      visible={logoutVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setLogoutVisible(false)}
    >
      <View style={styles.logoutModalBackdrop}>
        <View style={styles.logoutModalCard}>
          <View style={styles.logoutModalIcon}>
            <Text style={styles.logoutModalIconText}>🚪</Text>
          </View>

          <Text style={styles.logoutModalTitle}>Mag-log Out?</Text>
          <Text style={styles.logoutModalBody}>
            Naka-save ang iyong progreso. Maaari kang bumalik anumang oras upang ipagpatuloy ang iyong pag-aaral.
          </Text>

          <View style={styles.logoutModalActions}>
            <TouchableOpacity
              style={styles.logoutKanselahinButton}
              onPress={() => setLogoutVisible(false)}
            >
              <Text style={styles.logoutKanselahinText}>Kanselahin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutConfirmButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutConfirmText}>Mag-log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    </ScrollView>
);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingTop: 42,
  },

  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandLogoImage: {
    width: 40,
    height: 40,
    marginRight: 10,
  },

  brand: {
    fontSize: 26,
    fontWeight: '900',
    color: '#16A34A',
    marginBottom: 10,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  infoPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },

  xpPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },

  infoText: {
    fontWeight: '800',
    color: '#334155',
  },

  homeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },

  homeButtonText: {
    color: '#16A34A',
    fontWeight: '800',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 5,
    borderRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 16,
  },

  avatarContainer: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  bigAvatar: {
    fontSize: 60,
  },

  profileTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },

  studentBadge: {
    alignSelf: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  studentBadgeText: {
    color: '#166534',
    fontWeight: '900',
  },

  profileSubtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 14,
  },

  profileAntas: {
    fontSize: 16,
    color: '#166534',
    fontWeight: '800',
    marginBottom: 12,
  },

  levelCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  levelText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16A34A',
    marginBottom: 14,
  },

  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 14,
    marginLeft: 6,
  },

  progressBar: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: 12,
    backgroundColor: '#16A34A',
    borderRadius: 999,
  },

  sectionCard: {

    backgroundColor: '#FFFFFF',

    borderRadius: 28,

    paddingTop: 22,

    paddingHorizontal: 16,

    paddingBottom: 20,

    marginBottom: 16,

    borderWidth: 1,

    borderColor: '#DCFCE7',

    shadowColor: '#14532D',

    shadowOpacity: 0.05,

    shadowRadius: 12,

    shadowOffset: { width: 0, height: 6 },

    elevation: 2,

  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },

  sectionSubtitle: {
    color: '#64748B',
    marginTop: 6,
    marginBottom: 16,
    fontWeight: '700',
    lineHeight: 20,
  },

  leaderboardNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },

  leaderboardNavIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },

  leaderboardNavEmoji: {
    fontSize: 30,
  },

  leaderboardNavContent: {
    flex: 1,
    minWidth: 0,
  },

  leaderboardNavTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },

  leaderboardNavText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#64748B',
  },

  leaderboardNavArrow: {
    fontSize: 26,
    fontWeight: '900',
    color: '#16A34A',
    marginLeft: 10,
  },

  avatars: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',

    rowGap: 12,

  },

  choice: {

    width: '23%',

    aspectRatio: 1,

    borderRadius: 22,

    backgroundColor: '#F8FAFC',

    borderWidth: 1,

    borderColor: '#E2E8F0',

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 12,

  },

  selectedChoice: {

    borderWidth: 3,

    borderColor: '#16A34A',

    backgroundColor: '#DCFCE7',

  },

  choiceText: {

    fontSize: 30,

  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  summaryItem: {
    width: '48%',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },

  summaryLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  xpLogItem: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  xpLogAccent: {
    position: 'absolute',
    left: 0,
    top: 18,
    bottom: 18,
    width: 5,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
    backgroundColor: '#22C55E',
  },

  xpLogIconBubble: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  xpLogIcon: {
    fontSize: 28,
  },

  xpLogContent: {
    flex: 1,
  },

  xpLogPoints: {
    fontSize: 16,
    fontWeight: '900',
    color: '#16A34A',
  },

  xpLogNote: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },

  xpDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '700',
  },

  xpLogEmpty: {
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 12,
  },

  moreButton: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 26,
    paddingVertical: 11,
  },

  moreButtonText: {
    color: '#15803D',
    fontWeight: '900',
    fontSize: 15,
  },

  accountCard: {
    paddingTop: 20,
    paddingBottom: 20,
  },

  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    alignSelf: 'center',
    width: '70%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },

  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '800',
  },

  logoutModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  logoutModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#991B1B',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },

  logoutModalIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  logoutModalIconText: {
    fontSize: 42,
  },

  logoutModalTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },

  logoutModalBody: {
    fontSize: 16,
    lineHeight: 23,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 22,
  },

  logoutModalActions: {
    flexDirection: 'row',
    width: '100%',
  },

  logoutKanselahinButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },

  logoutConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 10,
  },

  logoutKanselahinText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '900',
  },

  logoutConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
