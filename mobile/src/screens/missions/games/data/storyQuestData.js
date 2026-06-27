const EARLY_ITEMS = [
  {
    id: 'g1-ana-payong',
    title: 'Ang Pulang Payong',
    story: [
      'Si Ana ay may pulang payong.',
      'Ginamit niya ito nang umulan.',
    ],
    questions: [
      {
        question: 'Ano ang ginamit ni Ana?',
        options: [
          { icon: '☂️', label: 'payong' },
          { icon: '📘', label: 'aklat' },
          { icon: '✏️', label: 'lapis' },
        ],
        correct: 'payong',
      },
      {
        question: 'Kailan ginamit ni Ana ang payong?',
        options: [
          { icon: '🌧️', label: 'umulan' },
          { icon: '🌙', label: 'natulog' },
          { icon: '🍽️', label: 'kumain' },
        ],
        correct: 'umulan',
      },
    ],
  },
  {
    id: 'g1-milo-pusa',
    title: 'Ang Pusa ni Milo',
    story: [
      'May pusa si Milo.',
      'Mahilig itong matulog sa banig.',
    ],
    questions: [
      {
        question: 'Ano ang alaga ni Milo?',
        options: [
          { icon: '🐱', label: 'pusa' },
          { icon: '🐶', label: 'aso' },
          { icon: '🐟', label: 'isda' },
        ],
        correct: 'pusa',
      },
      {
        question: 'Saan natutulog ang pusa?',
        options: [
          { icon: '🧺', label: 'banig' },
          { icon: '📦', label: 'kahon' },
          { icon: '🌳', label: 'puno' },
        ],
        correct: 'banig',
      },
    ],
  },
  {
    id: 'g2-lapis-ni-lena',
    title: 'Ang Lapis ni Lena',
    story: [
      'May bagong lapis si Lena.',
      'Ginamit niya ito sa pagguhit ng bahay.',
    ],
    questions: [
      {
        question: 'Ano ang gamit ni Lena sa pagguhit?',
        options: [
          { icon: '✏️', label: 'lapis' },
          { icon: '📚', label: 'aklat' },
          { icon: '☂️', label: 'payong' },
        ],
        correct: 'lapis',
      },
      {
        question: 'Ano ang iginuhit ni Lena?',
        options: [
          { icon: '🏠', label: 'bahay' },
          { icon: '🐱', label: 'pusa' },
          { icon: '🌞', label: 'araw' },
        ],
        correct: 'bahay',
      },
    ],
  },
  {
    id: 'g5-puno-sa-paaralan',
    title: 'Ang Puno sa Paaralan',
    story: [
      'Nagtanim ng puno ang mga mag-aaral sa gilid ng palaruan.',
      'Araw-araw nila itong diniligan upang lumago.',
      'Pagkalipas ng ilang buwan, naging malilim ang paligid at natuwa ang lahat.',
    ],
    questions: [
      {
        question: 'Ano ang itinanim ng mga mag-aaral?',
        options: [
          { icon: '🌳', label: 'puno' },
          { icon: '📘', label: 'aklat' },
          { icon: '🧸', label: 'laruan' },
        ],
        correct: 'puno',
      },
      {
        question: 'Bakit nila diniligan ang puno?',
        options: [
          { icon: '🌱', label: 'upang lumago' },
          { icon: '🔥', label: 'upang matuyo' },
          { icon: '🧊', label: 'upang lumamig' },
        ],
        correct: 'upang lumago',
      },
      {
        question: 'Ano ang naging epekto ng puno?',
        options: [
          { icon: '🌤️', label: 'naging malilim' },
          { icon: '🌪️', label: 'naging maalikabok' },
          { icon: '🔇', label: 'naging tahimik' },
        ],
        correct: 'naging malilim',
      },
    ],
  },
  {
    id: 'g6-bayanihan-sa-barangay',
    title: 'Bayanihan sa Barangay',
    story: [
      'Matapos ang malakas na ulan, nagtulungan ang mga tao sa barangay.',
      'Nagbahagi sila ng pagkain at tumulong sa pag-aayos ng paligid.',
      'Ipinakita nila ang tunay na diwa ng bayanihan.',
    ],
    questions: [
      {
        question: 'Ano ang ginawa ng mga tao sa barangay?',
        options: [
          { icon: '🤝', label: 'nagtulungan' },
          { icon: '🏃', label: 'tumakbo' },
          { icon: '🎤', label: 'kumanta' },
        ],
        correct: 'nagtulungan',
      },
      {
        question: 'Ano ang ibinahagi nila?',
        options: [
          { icon: '🍚', label: 'pagkain' },
          { icon: '🎈', label: 'laruan' },
          { icon: '📺', label: 'telebisyon' },
        ],
        correct: 'pagkain',
      },
      {
        question: 'Anong diwa ang ipinakita sa kuwento?',
        options: [
          { icon: '💚', label: 'bayanihan' },
          { icon: '💤', label: 'katamaran' },
          { icon: '📣', label: 'ingay' },
        ],
        correct: 'bayanihan',
      },
    ],
  },
];

const UPPER_ITEMS = [
  {
    id: 'g3-malinis-na-bakuran',
    title: 'Malinis na Bakuran',
    story: [
      'Maagang dumating sa paaralan sina Lito, Bea, at Omar. Napansin nilang maraming kalat sa bakuran.',
      'Pinulot nila ang mga kalat at itinapon sa tamang basurahan.',
      'Natuwa ang guro sa kanilang pagtutulungan. Natutuhan nila na mahalaga ang malinis na paligid.',
    ],
    questions: [
      {
        question: 'Ano ang ginawa ng mga bata?',
        options: [
          { icon: '🧹', label: 'naglinis' },
          { icon: '🎮', label: 'naglalaro' },
          { icon: '😴', label: 'natulog' },
        ],
        correct: 'naglinis',
      },
      {
        question: 'Saan nila itinapon ang kalat?',
        options: [
          { icon: '🗑️', label: 'basurahan' },
          { icon: '🏫', label: 'paaralan' },
          { icon: '🌳', label: 'puno' },
        ],
        correct: 'basurahan',
      },
      {
        question: 'Ano ang aral ng kuwento?',
        options: [
          { icon: '🌿', label: 'alagaan ang kalikasan' },
          { icon: '🍬', label: 'kumain ng kendi' },
          { icon: '📺', label: 'manood buong araw' },
        ],
        correct: 'alagaan ang kalikasan',
      },
    ],
  },
  {
    id: 'g4-aklatan-ni-mara',
    title: 'Sa Aklatan',
    story: [
      'Pumunta si Mara sa aklatan upang magbasa ng bagong kuwento.',
      'Pinili niya ang aklat tungkol sa mga alamat at isinulat ang mahahalagang detalye.',
      'Umuwi siyang masaya dahil may bagong aral siyang natutuhan.',
    ],
    questions: [
      {
        question: 'Saan pumunta si Mara?',
        options: [
          { icon: '📚', label: 'aklatan' },
          { icon: '🏀', label: 'palakasan' },
          { icon: '🏪', label: 'tindahan' },
        ],
        correct: 'aklatan',
      },
      {
        question: 'Tungkol saan ang aklat?',
        options: [
          { icon: '📜', label: 'alamat' },
          { icon: '🌧️', label: 'ulan' },
          { icon: '🐶', label: 'aso' },
        ],
        correct: 'alamat',
      },
      {
        question: 'Ano ang naramdaman ni Mara?',
        options: [
          { icon: '😊', label: 'masaya' },
          { icon: '😡', label: 'galit' },
          { icon: '😴', label: 'inaantok' },
        ],
        correct: 'masaya',
      },
    ],
  },
];

export function getStoryQuestItemsForGrade(gradeLevel = 4) {
  return Number(gradeLevel || 4) <= 2 ? EARLY_ITEMS : UPPER_ITEMS;
}

export function getStoryQuestAttemptItems(gradeLevel = 4) {
  return [...getStoryQuestItemsForGrade(gradeLevel)]
    .sort(() => Math.random() - 0.5);
}
