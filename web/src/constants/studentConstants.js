export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦄', '🐰', '🧒'];
export const SUBJECTS = [
  { name: 'Pagbasa', icon: '📖', iconSrc: '/category-pagbasa.png', tone: 'green' },
  { name: 'Bokabularyo', icon: '🔤', iconSrc: '/category-bokabularyo.png', tone: 'blue' },
  { name: 'Panitikan', icon: '📜', iconSrc: '/category-panitikan.png', tone: 'purple' },
  { name: 'Komunikasyong Pagsasalita', icon: '🎙️', iconSrc: '/category-oralcomm.png', tone: 'yellow' },
  { name: 'Pagsulat', icon: '✍️', iconSrc: '/category-pagsulat.png', tone: 'pink' }
];

export const MISSION_GAMES = [
  {
    id: 'word-match',
    title: 'Pagtutugma ng Salita',
    icon: '🧩',
    module: 'Bokabularyo',
    xp: 15,
    baseStatus: 'Handa na',
    short: 'Hanapin ang pares!',
    instruction: 'Hanapin ang tamang pares. Basahin ang salita, tingnan ang larawan o kahulugan, at piliin ang magkapareha.',
    sample: 'aso → larawan ng aso, bahay → larawan ng bahay',
    reward: 'Pag-unlad sa Bituin ng Bokabularyo',
    tone: 'sky'
  },
  {
    id: 'letter-pop',
    title: 'Pagpili ng Titik',
    icon: '🎈',
    module: 'Pagbasa',
    xp: 12,
    baseStatus: 'Handa na',
    short: 'Piliin ang pantig!',
    instruction: 'Piliin ang nawawalang titik o pantig. Kapag tama, mabubuo ang salita at may gantimpalang XP.',
    sample: 'ba + ___ = bata',
    reward: 'Pag-unlad sa sunod-sunod na pagbasa',
    tone: 'sun'
  },
  {
    id: 'picture-guess',
    title: 'Hulaan ang Larawan',
    icon: '🖼️',
    module: 'Bokabularyo',
    xp: 12,
    baseStatus: 'Handa na',
    short: 'Hulaan ang larawan!',
    instruction: 'Pagmasdan ang picture card, pagkatapos piliin ang salitang tumutukoy dito.',
    sample: 'larawan ng pusa → pusa',
    reward: 'Vocabulary confidence',
    tone: 'mint'
  },
  {
    id: 'sentence-builder',
    title: 'Pagbuo ng Pangungusap',
    icon: '🧱',
    module: 'Pagsulat',
    xp: 18,
    baseStatus: 'Handa na',
    short: 'Ayusin ang pangungusap!',
    instruction: 'Ilagay ang mga salita sa tamang ayos hanggang makabuo ng malinaw na pangungusap.',
    sample: 'Ako / ay / bata.',
    reward: 'Pag-unlad sa gantimpala sa Pagsulat Builder',
    tone: 'pink'
  },
  {
    id: 'story-quest',
    title: 'Pag-unawa sa Kwento',
    icon: '📖',
    module: 'Panitikan',
    xp: 20,
    baseStatus: 'Handa na',
    short: 'Basahin at sagutin!',
    instruction: 'Basahin ang story card. Sagutin ang tanong tungkol sa tauhan, tagpuan, o pangyayari.',
    sample: 'Sino ang pangunahing tauhan?',
    reward: 'Pag-unlad sa Hamon sa Pag-unawa',
    tone: 'violet'
  },
  {
    id: 'sound-and-say',
    title: 'Pakikinig at Pagbigkas',
    icon: '🎙️',
    module: 'Komunikasyong Pagsasalita',
    xp: 15,
    baseStatus: 'Handa na',
    short: 'Magsanay bumigkas ng salitang Filipino o maikling parirala.',
    instruction: 'Pakinggan ang salita, pagkatapos bigkasin ito nang malinaw. Maaaring ikonekta ang pagsusuri ng pagbigkas sa susunod.',
    sample: 'Magandang umaga po.',
    reward: 'Oral practice confidence',
    tone: 'rose',
    future: true
  },
  ];

export const EARLY_GROUP_ROLES = [
  { id: 'reader', icon: '📖', label: 'Reader', helper: 'Basahin ang salita o kuwento.' },
  { id: 'speaker', icon: '🎤', label: 'Tagapagsalita', helper: 'Bigkasin ang sagot nang malinaw.' },
  { id: 'helper', icon: '⭐', label: 'Helper', helper: 'Tumulong sa kaklase.' },
  { id: 'checker', icon: '✅', label: 'Checker', helper: 'Tingnan kung tapos na ang gawain.' }
];

export const UPPER_GROUP_ROLES = [
  { id: 'leader', icon: '👑', label: 'Leader', helper: 'Guide the group and keep everyone on task.' },
  { id: 'reader', icon: '📖', label: 'Reader', helper: 'Read the passage or instructions.' },
  { id: 'writer', icon: '✍️', label: 'Writer', helper: 'Ihanda ang sagot o buod ng grupo.' },
  { id: 'reporter', icon: '🎙️', label: 'Reporter', helper: 'Present the group output.' },
  { id: 'checker', icon: '✅', label: 'Checker', helper: 'Review the answer before submission.' }
];
