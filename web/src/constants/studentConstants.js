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
    short: 'Itugma ang salitang Filipino sa tamang kahulugan o larawan.',
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
    short: 'Tapikin ang tamang titik o pantig para mabuo ang salitang Filipino.',
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
    short: 'Tingnan ang larawan at piliin ang tamang salitang Filipino.',
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
    short: 'Ayusin ang mga salita para makabuo ng wastong pangungusap.',
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
    short: 'Basahin ang maikling kuwento at sagutin ang simpleng tanong.',
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
  {
    id: 'badge-challenge',
    title: 'Badge Challenge',
    icon: '🏅',
    module: 'Rewards',
    xp: 25,
    baseStatus: 'Locked',
    short: 'Kumpletuhin ang mini-game streak para maka-unlock ng badge.',
    instruction: 'Tapusin ang 3 vocabulary or reading games para ma-unlock ang special badge.',
    sample: '3 games = Bokabularyo Star',
    reward: 'Bokabularyo Star badge',
    tone: 'orange',
    minCompleted: 3
  }
];
