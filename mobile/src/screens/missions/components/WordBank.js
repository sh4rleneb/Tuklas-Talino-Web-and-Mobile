import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

export default function WordBank({
  words = [],
  selectedWords = [],
  disabled = false,
  onPress,
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 8,
      }}
    >
      {words.map((word) => {
        const used = selectedWords.includes(word);

        return (
          <TouchableOpacity
            key={word}
            disabled={disabled || used}
            onPress={() => onPress(word)}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderRadius: 18,
              margin: 6,

              backgroundColor: used
                ? '#E2E8F0'
                : '#FFFFFF',

              borderWidth: 2,
              borderColor: '#BFDBFE',

              opacity: used ? 0.45 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '900',
                color: '#1E293B',
              }}
            >
              {word}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
