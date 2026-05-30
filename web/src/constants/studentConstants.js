export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦄', '🐰', '🧒'];
export const SUBJECTS = [
  { name: 'Pagbasa', icon: '📖', tone: 'green' },
  { name: 'Bokabularyo', icon: '🔤', tone: 'blue'},
  { name: 'Panitikan', icon: '📜', tone: 'purple' },
  { name: 'Oral Comm', icon: '🎙️', tone: 'yellow' },
  { name: 'Pagsulat', icon: '✍️', tone: 'pink'}
];

export const MISSION_GAMES = [
  {
    id: 'word-match',
    title: 'Word Match',
    icon: '🧩',
    module: 'Bokabularyo',
    xp: 15,
    baseStatus: 'Available',
    short: 'Hanapin ang pares!',
    instruction: 'Hanapin ang tamang pares. Basahin ang salita, tingnan ang larawan o kahulugan, at piliin ang magkapareha.',
    sample: 'aso → larawan ng aso, bahay → larawan ng bahay',
    reward: 'Bokabularyo Star progress',
    tone: 'sky'
  },
  {
    id: 'letter-pop',
    title: 'Letter Pop',
    icon: '🎈',
    module: 'Pagbasa',
    xp: 12,
    baseStatus: 'Available',
    short: 'Piliin ang pantig!',
    instruction: 'Piliin ang nawawalang titik o pantig. Kapag tama, bubuo ang salita at may XP reward.',
    sample: 'ba + ___ = bata',
    reward: 'Reading streak progress',
    tone: 'sun'
  },
  {
    id: 'picture-guess',
    title: 'Picture Guess',
    icon: '🖼️',
    module: 'Bokabularyo',
    xp: 12,
    baseStatus: 'Available',
    short: 'Hulaan ang larawan!',
    instruction: 'Pagmasdan ang picture card, pagkatapos piliin ang salitang tumutukoy dito.',
    sample: 'larawan ng pusa → pusa',
    reward: 'Vocabulary confidence',
    tone: 'mint'
  },
  {
    id: 'sentence-builder',
    title: 'Sentence Builder',
    icon: '🧱',
    module: 'Pagsulat',
    xp: 18,
    baseStatus: 'Available',
    short: 'Ayusin ang pangungusap!',
    instruction: 'Ilagay ang mga salita sa tamang ayos hanggang makabuo ng malinaw na pangungusap.',
    sample: 'Ako / ay / bata.',
    reward: 'Pagsulat Builder badge progress',
    tone: 'pink'
  },
  {
    id: 'story-quest',
    title: 'Story Quest',
    icon: '📖',
    module: 'Panitikan',
    xp: 20,
    baseStatus: 'Available',
    short: 'Basahin at sagutin!',
    instruction: 'Basahin ang story card. Sagutin ang tanong tungkol sa tauhan, tagpuan, o pangyayari.',
    sample: 'Sino ang pangunahing tauhan?',
    reward: 'Pag-unawa Quest progress',
    tone: 'violet'
  },
  {
    id: 'sound-and-say',
    title: 'Sound and Say',
    icon: '🎙️',
    module: 'Oral Comm',
    xp: 15,
    baseStatus: 'Practice',
    short: 'Magsanay bumigkas ng salitang Filipino o maikling parirala.',
    instruction: 'Pakinggan ang salita, pagkatapos bigkasin ito nang malinaw. Speech checking can be connected later.',
    sample: 'Magandang umaga po.',
    reward: 'Oral practice confidence',
    tone: 'rose',
    future: true
  },
  ];

export const EARLY_GROUP_ROLES = [
  { id: 'reader', icon: '📖', label: 'Reader', helper: 'Basahin ang salita o kuwento.' },
  { id: 'speaker', icon: '🎤', label: 'Speaker', helper: 'Bigkasin ang sagot nang malinaw.' },
  { id: 'helper', icon: '⭐', label: 'Helper', helper: 'Tumulong sa kaklase.' },
  { id: 'checker', icon: '✅', label: 'Checker', helper: 'Tingnan kung tapos na ang gawain.' }
];

export const UPPER_GROUP_ROLES = [
  { id: 'leader', icon: '👑', label: 'Leader', helper: 'Guide the group and keep everyone on task.' },
  { id: 'reader', icon: '📖', label: 'Reader', helper: 'Read the passage or instructions.' },
  { id: 'writer', icon: '✍️', label: 'Writer', helper: 'Prepare the group answer or summary.' },
  { id: 'reporter', icon: '🎙️', label: 'Reporter', helper: 'Present the group output.' },
  { id: 'checker', icon: '✅', label: 'Checker', helper: 'Review the answer before submission.' }
];
