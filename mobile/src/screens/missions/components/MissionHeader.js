import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

// WEB-PARITY: shared mission header styled after the active web mission player.
export default function MissionHeader({
  title,
  subtitle,
  icon = '🎮',
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>
          {icon}
        </Text>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>
          {title}
        </Text>

        {!!subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      <Text
        style={styles.star}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        ⭐
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderWidth: 2,
    borderColor: '#D7EAFE',
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    shadowColor: '#7693B8',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },

  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE7A7',
    marginRight: 13,
  },

  icon: {
    fontSize: 31,
  },

  copy: {
    flex: 1,
    paddingRight: 8,
  },

  title: {
    color: '#159A62',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 4,
    color: '#536B8D',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },

  star: {
    alignSelf: 'flex-start',
    marginTop: 1,
    color: '#F6D968',
    fontSize: 22,
  },
});
