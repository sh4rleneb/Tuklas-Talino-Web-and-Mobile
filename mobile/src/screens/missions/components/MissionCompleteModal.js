import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet,
  StatusBar,} from 'react-native';

function cleanMissionTitle(title) {
  return String(title || 'Natapos ang Gawain!')
    .replace(/^[🏆🎉⭐\s]+/u, '')
    .trim() || 'Natapos ang Gawain!';
}

export default function MissionCompleteModal({
  title,
  xp,
  stars,
  attempts,
  achievement,
  badge,
  onReplay,
  onBack,
  primaryLabel,
  primaryAction,
}) {
  const starText = String(stars || '').trim();
  const displayTitle = cleanMissionTitle(title);
  const handlePrimaryPress =
    primaryAction === 'back'
      ? onBack
      : onReplay;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <View style={styles.trophyRing}>
          <Text style={styles.trophy}>🏆</Text>
        </View>

        <Text style={styles.title}>{displayTitle}</Text>
        <Text style={styles.subtitle}>
          Mahusay! Nakumpleto mo ang gawain at nakakuha ka ng bagong XP.
        </Text>

        <View style={styles.rewardPanel}>
          <View style={styles.rewardMain}>
            <Text style={styles.rewardLabel}>Gantimpala</Text>
            <Text style={styles.xp}>+{xp || 0} XP</Text>
          </View>

          <View style={styles.rewardSide}>
            <Text style={styles.rewardSmallLabel}>Pagsubok</Text>
            <Text style={styles.rewardSmallValue}>
              {typeof attempts === 'number' ? attempts : '—'}
            </Text>
          </View>
        </View>

        {starText ? (
          <View style={styles.starsCard}>
            <Text style={styles.stars}>{starText}</Text>
            <Text style={styles.starsLabel}>
              {attempts <= 1
                ? 'Perfect start!'
                : attempts === 2
                  ? 'Magandang pagbawi!'
                  : 'Natapos sa tiyaga!'}
            </Text>
          </View>
        ) : null}

        {badge ? (
          <View style={styles.badgeCard}>
            <View style={styles.badgeIconWrap}>
              <Text style={styles.badgeIcon}>{badge.icon || '🏅'}</Text>
            </View>
            <View style={styles.badgeTextWrap}>
              <Text style={styles.badgeLabel}>Bagong Badge</Text>
              <Text style={styles.badgeName}>
                {badge.name || 'Bagong Tagumpay'}
              </Text>
            </View>
          </View>
        ) : null}

        {achievement ? (
          <View style={styles.achievementCard}>
            <Text style={styles.achievementTitle}>{achievement.title}</Text>
            <Text style={styles.achievementMessage}>{achievement.message}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handlePrimaryPress}
          activeOpacity={0.86}
        >
          <Text style={styles.buttonText}>{primaryLabel || '↻ Maglaro Muli'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          onPress={onBack}
          activeOpacity={0.86}
        >
          <Text style={styles.secondaryText}>← Bumalik sa mga Misyon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: 4,
    paddingTop: 0,
    paddingBottom: 10,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    marginTop: 54,
    marginBottom: 72,
    alignSelf: 'stretch',


  },

  glowOne: {
    position: 'absolute',
    top: -56,
    right: -42,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },

  glowTwo: {
    position: 'absolute',
    bottom: -72,
    left: -50,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
  },

  trophyRing: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#D97706',
    shadowOpacity: 0.20,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  trophy: {
    fontSize: 42,
  },

  eyebrow: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  title: {
    color: '#0F172A',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },

  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 14,
  },

  rewardPanel: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 14,
  },

  rewardMain: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginRight: 10,
  },

  rewardLabel: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },

  xp: {
    color: '#16A34A',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    marginTop: 4,
  },

  rewardSide: {
    width: 84,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  rewardSmallLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  rewardSmallValue: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 3,
  },

  starsCard: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 14,
  },

  stars: {
    fontSize: 29,
    letterSpacing: 2,
  },

  starsLabel: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },

  badgeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
  },

  badgeIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  badgeIcon: {
    fontSize: 33,
  },

  badgeTextWrap: {
    flex: 1,
  },

  badgeLabel: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  badgeName: {
    color: '#92400E',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 2,
  },

  achievementCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  achievementTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 7,
  },

  achievementMessage: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '800',
  },

  button: {
    width: '100%',
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#14532D',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },

  secondary: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#22C55E',
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  secondaryText: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 16,
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 86,
    paddingBottom: 118,
    paddingHorizontal: 18,

  },

});
