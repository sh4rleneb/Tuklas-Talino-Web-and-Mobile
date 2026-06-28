import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

export default function SentenceSlotRow({
  words = [],
  totalSlots = 0,
  onRemoveWord,
}) {
  return (
    <View
      style={{
        flexDirection:'row',
        flexWrap:'wrap',
        justifyContent:'center',
        marginBottom:18,
      }}
    >
      {Array.from({ length: totalSlots }).map((_, index) => {
        const word = words[index];

        return (
          <TouchableOpacity
            key={index}
            disabled={!word}
            onPress={() => onRemoveWord?.(index)}
            style={{
              width:76,
              height:56,
              margin:6,
              borderRadius:16,
              borderWidth:2,
              borderColor: word ? '#22C55E' : '#BFDBFE',
              backgroundColor: word ? '#DCFCE7' : '#F8FAFC',
              justifyContent:'center',
              alignItems:'center',
            }}
          >
            <Text
              style={{
                fontSize:18,
                fontWeight:'900',
                color: word ? '#166534' : '#94A3B8',
              }}
            >
              {word || '____'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
