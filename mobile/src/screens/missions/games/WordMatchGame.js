import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function WordMatchGame({
  mission,
  selected,
  submitting,
  onSelect,
  onSubmit,
}) {
  return (
    <>
      <Text style={styles.question}>
        {mission.prompt}
      </Text>

      {mission.options.map((option) => {
        const active = selected === option;

        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              active && styles.optionSelected,
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={styles.optionText}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          !selected && styles.buttonDisabled,
        ]}
        disabled={!selected || submitting}
        onPress={onSubmit}
      >
        <Text style={styles.primaryButtonText}>
          Submit
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  question: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
  },

  option: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },

  optionSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },

  optionText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  primaryButton: {
    marginTop: 18,
    backgroundColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 18,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  primaryButtonText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
});
