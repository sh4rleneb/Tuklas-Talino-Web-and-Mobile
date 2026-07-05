function shuffle(items = []) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }


function shuffleChoicesForAttempt(items = []) {
  return items.map((item) => ({
    ...item,
    choices: Array.isArray(item.choices) ? shuffle(item.choices) : item.choices,
    options: Array.isArray(item.options) ? shuffle(item.options) : item.options,
  }));
}

  return copy;
}

const DATA = {
  1: [
    {
      emoji: "🐶",
      answer: "Aso",
      choices: ["Aso", "Pusa", "Isda"],
    },
    {
      emoji: "🏠",
      answer: "Bahay",
      choices: ["Bahay", "Puno", "Mesa"],
    },
    {
      emoji: "☀️",
      answer: "Araw",
      choices: ["Araw", "Buwan", "Ulap"],
    },
  ],

  2: [
    {
      emoji: "📚",
      answer: "Aklat",
      choices: ["Aklat", "Lapis", "Mesa"],
    },
    {
      emoji: "🌳",
      answer: "Puno",
      choices: ["Puno", "Bulaklak", "Damo"],
    },
    {
      emoji: "✏️",
      answer: "Lapis",
      choices: ["Lapis", "Papel", "Teacher"],
    },
  ],

  3: [
    {
      emoji: "🏫",
      answer: "Paaralan",
      choices: ["Paaralan", "Pamayanan", "Aklatan"],
    },
    {
      emoji: "📖",
      answer: "Aklatan",
      choices: ["Aklatan", "Panitikan", "Kaalaman"],
    },
    {
      emoji: "🩺",
      answer: "Manggagamot",
      choices: ["Manggagamot", "Teacher", "Magsasaka"],
    },
  ],

  4: [
    {
      emoji: "📜",
      answer: "Panitikan",
      choices: ["Panitikan", "Talasalitaan", "Pamayanan"],
    },
    {
      emoji: "🎨",
      answer: "Malikhain",
      choices: ["Malikhain", "Masipag", "Matapat"],
    },
    {
      emoji: "🔤",
      answer: "Talasalitaan",
      choices: ["Talasalitaan", "Kaalaman", "Aklatan"],
    },
  ],

  5: [
    {
      emoji: "🤝",
      answer: "Mapagkakatiwalaan",
      choices: ["Mapagkakatiwalaan", "Masipag", "Malikhain"],
    },
    {
      emoji: "👥",
      answer: "Pakikipagkapwa",
      choices: ["Pakikipagkapwa", "Panitikan", "Pamayanan"],
    },
    {
      emoji: "💡",
      answer: "Kaalaman",
      choices: ["Kaalaman", "Talasalitaan", "Aklatan"],
    },
  ],

  6: [
    {
      emoji: "📜",
      answer: "Panitikan",
      choices: ["Panitikan", "Pakikipagkapwa", "Kaalaman"],
    },
    {
      emoji: "🤝",
      answer: "Mapagkakatiwalaan",
      choices: ["Mapagkakatiwalaan", "Talasalitaan", "Panitikan"],
    },
    {
      emoji: "👥",
      answer: "Pakikipagkapwa",
      choices: ["Pakikipagkapwa", "Kaalaman", "Pamayanan"],
    },
  ],
};

export function getPictureGuessAttemptItems(gradeLevel = 1) {
  return shuffleChoicesForAttempt(shuffle(DATA[Number(gradeLevel)] || DATA[1]));
}
