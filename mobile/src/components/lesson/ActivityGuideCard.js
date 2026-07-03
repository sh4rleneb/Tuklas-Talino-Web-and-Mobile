import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function getActivityGuide(activity = {}, littleLearnerGame = false) {
  const type = String(
    activity?.type ||
    activity?.activityType ||
    activity?.category ||
    activity?.kind ||
    ''
  ).toLowerCase();

  const hasQuestionsWithOptions =
    Array.isArray(activity?.questions) &&
    activity.questions.some(q =>
      Array.isArray(q?.options) || Array.isArray(q?.choices)
    );

  const hasChoices =
    Array.isArray(activity?.choices) ||
    Array.isArray(activity?.options) ||
    Array.isArray(activity?.answers) ||
    hasQuestionsWithOptions;

  const hasAudio =
    Boolean(activity?.audioUrl) ||
    Boolean(activity?.audio) ||
    Boolean(activity?.soundUrl);

  if (hasAudio || type.includes('listen') || type.includes('audio') || type.includes('hearing')) {
    return {
      icon: '👂',
      title: 'What to do',
      body: 'Makinig muna. Pagkatapos ay sagutan ang gawain.',
      steps: ['Makinig', 'Sumagot', 'Magpatuloy'],
    };
  }

  if (type.includes('write') || type.includes('writing') || type.includes('essay') || type.includes('text')) {
    return {
      icon: '✍️',
      title: 'What to do',
      body: 'Read the prompt. Type a short answer.',
      steps: ['Basahin', 'Mag-type', 'I-save'],
    };
  }

  if (type.includes('speak') || type.includes('record') || type.includes('voice') || type.includes('oral')) {
    return {
      icon: '🎙️',
      title: 'What to do',
      body: 'Makinig o basahin ang teksto. Pagkatapos ay i-record ang iyong boses.',
      steps: ['Makinig', 'Mag-record', 'I-save'],
    };
  }

  if (
    type === 'mcq' ||
    type.includes('mcq') ||
    hasChoices ||
    type.includes('quiz') ||
    type.includes('choice') ||
    type.includes('question') ||
    type.includes('multiple')
  ) {
    return {
      icon: '👆',
      title: 'What to do',
      body: littleLearnerGame
        ? 'Pindutin ang tamang sagot.'
        : 'Basahin ang tanong at pumili ng isang sagot.',
      steps: littleLearnerGame ? ['Basahin', 'Pindutin', 'Manalo'] : ['Basahin', 'Pumili', 'Magpatuloy'],
    };
  }

  return {
    icon: '🧭',
    title: 'What to do',
    body: 'Read the task. Do the activity.',
    steps: ['Basahin', 'Gawin', 'Magpatuloy'],
  };
}

export default function ActivityGuideCard({ activity, littleLearnerGame }) {
  if (!activity) return null;

  const guide = getActivityGuide(activity, littleLearnerGame);

  return (
    <View style={styles.guideCard}>
      <View style={styles.guideIconBubble}>
        <Text style={styles.guideIcon}>{guide.icon}</Text>
      </View>

      <View style={styles.guideContent}>
        <Text style={styles.guideTitle}>{guide.title}</Text>
        <Text style={styles.guideBody}>{guide.body}</Text>

        <View style={styles.guideSteps}>
          {guide.steps.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.guideStepPill}>
              <Text style={styles.guideStepNumber}>{index + 1}</Text>
              <Text style={styles.guideStepText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guideCard:{flexDirection:'row',backgroundColor:'#F8FAFC',borderRadius:20,padding:12,marginBottom:12},
  guideIconBubble:{width:44,height:44,borderRadius:22,backgroundColor:'#DCFCE7',justifyContent:'center',alignItems:'center',marginRight:12},
  guideIcon:{fontSize:22},
  guideContent:{flex:1},
  guideTitle:{fontSize:16,fontWeight:'900',color:'#0F172A',marginBottom:4},
  guideBody:{fontSize:13,color:'#475569',lineHeight:18},
  guideSteps:{flexDirection:'row',flexWrap:'wrap',marginTop:10},
  guideStepPill:{flexDirection:'row',alignItems:'center',backgroundColor:'#ECFDF5',borderRadius:999,paddingHorizontal:9,paddingVertical:5,marginRight:6,marginBottom:6},
  guideStepNumber:{width:20,height:20,borderRadius:10,backgroundColor:'#22C55E',color:'#FFF',textAlign:'center',fontWeight:'900',overflow:'hidden'},
  guideStepText:{marginLeft:6,fontWeight:'800',color:'#166534',fontSize:12},
});
