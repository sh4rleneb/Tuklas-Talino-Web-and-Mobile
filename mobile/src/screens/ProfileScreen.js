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
    Alert.alert('Avatar', 'Updated!');
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
              ⏳ Loading...
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

      <Text style={styles.brand}>
        🏡 Tuklas Talino
      </Text>

      <View style={styles.pillsRow}>

        <View style={styles.infoPill}>
          <Text style={styles.infoText}>
            🌸 Grade {dashboard.student.gradeLevel} • {dashboard.student.section}
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
          🏠 Home
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
          🌟 Masipag na Grade {dashboard.student.gradeLevel} Learner
        </Text>
      </View>

      <Text style={styles.profileSubtitle}>
        Piliin ang avatar mo at tingnan
        ang learning summary.
      </Text>

      <View style={styles.levelCard}>
        <Text style={styles.levelText}>
          🪙 {dashboard.student.xp || 0} XP • Level {Math.floor((dashboard.student.xp || 0) / 100) + 1}
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
        📊 Summary
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
            Grade {dashboard.student.gradeLevel}
          </Text>

          <Text style={styles.summaryLabel}>
            Grade
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
            Section
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

      </View>

    </View>

    <View style={styles.sectionCard}>

      <Text style={styles.sectionTitle}>
        ⭐ XP History
      </Text>

      <Text style={styles.sectionSubtitle}>
        See where your XP comes from.
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
                      {log.note || 'XP earned'}
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
          No XP activity yet.
        </Text>
      )}

    </View>

    <View style={[styles.sectionCard, styles.accountCard]}>

      <Text style={styles.sectionTitle}>
        🚪 Account
      </Text>

      <Text style={styles.sectionSubtitle}>
        Ready to leave? Tap Logout below.
      </Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={confirmLogout}
      >
        <Text style={styles.logoutButtonText}>
          Logout
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

          <Text style={styles.logoutModalTitle}>Logout?</Text>
          <Text style={styles.logoutModalBody}>
            Naka-save ang iyong progreso. Maaari kang bumalik anumang oras para magpatuloy.
          </Text>

          <View style={styles.logoutModalActions}>
            <TouchableOpacity
              style={styles.logoutCancelButton}
              onPress={() => setLogoutVisible(false)}
            >
              <Text style={styles.logoutCancelText}>Kanselahin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutConfirmButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutConfirmText}>Mag-logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    </ScrollView>
);
}

const styles = StyleSheet.create({
  moreButton: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  moreButtonText: {
    color: '#15803D',
    fontWeight: '900',
    fontSize: 15,
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
  logoutCancelButton: {
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
  logoutCancelText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '900',
  },
  logoutConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
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

  xpDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '700',
  },


  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    alignSelf: 'center',
    width: '70%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },

  accountCard: {
    paddingTop: 20,
    paddingBottom: 20,
  },

  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '800',
  },

  screen: {
    flex: 1,
    backgroundColor: '#F4FBF5',

    paddingHorizontal: 16,

    paddingTop: 50,
  },

  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,

    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,

    marginTop: 12,
    marginBottom: 16,

    elevation: 4,
  },

  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16A34A',

    marginBottom: 12,
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
    backgroundColor: '#FEF3C7',

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 20,

    marginLeft: 8,
  },

  infoText: {
    fontWeight: '700',
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
    fontWeight: '700',
  },

  profileCard: {
    backgroundColor: '#22C55E',
    borderWidth: 1,
    borderColor: '#4ADE80',
    shadowColor: '#16A34A',

      shadowOffset: {
        width: 0,
        height: 8,
      },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 8,

    borderRadius: 24,

    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,

    marginBottom: 16,
  },

  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 25,
    backgroundColor: '#FFF4CC',

    alignSelf: 'center',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 14,
  },

  bigAvatar: {
    fontSize: 72,
  },

    selectedChoice: {
    borderWidth: 3,
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },

  profileTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',

    textAlign: 'center',
  },

  profileSubtitle: {
    color: '#475569',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 14,
  },

    profileLevel: {
    fontSize: 16,
    color: '#EFFFF4',
    fontWeight: '600',
    marginBottom: 12,
  },

  levelCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
  },

  levelText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
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
    height: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
  },

  progressFill: {
    height: 10,
    backgroundColor: '#4ADE80',
    borderRadius: 10,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 28,

    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,

    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#16A34A',
  },

  sectionSubtitle: {
    color: '#475569',
    marginTop: 6,
    marginBottom: 16,
  },

  studentBadge: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF30',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },

  studentBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  avatars: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    justifyContent: 'space-between',

    marginTop: 6,
  },

  choice: {
    width: '23%',

    aspectRatio: 1,

    backgroundColor: '#F8FAFC',

    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 10,
  },

  choiceText: {
    fontSize: 28,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  summaryItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },

  summaryLabel: {
    marginTop: 4,
    color: '#64748B',
  },


  xpLogItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  xpLogPoints: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },

  xpLogNote: {
    marginTop: 4,
    color: '#475569',
  },

  xpLogEmpty: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },

});
