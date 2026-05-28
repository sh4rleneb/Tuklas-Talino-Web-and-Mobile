import React from "react";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const MISSION_GAMES = [
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

function getMissionDemo(gameId) {
  const demos = {
    'word-match': {
      instruction: 'Piliin ang tamang kahulugan ng salitang Filipino.',
      prompt: 'Ano ang ibig sabihin ng salitang “bahay”?',
      sample: 'bahay → house / tahanan',
      options: ['House / tahanan', 'Dog / aso', 'Book / aklat'],
      correct: 'House / tahanan',
      success: 'Tama! Ang “bahay” ay house o tahanan.'
    },
    'letter-pop': {
      instruction: 'Piliin ang nawawalang pantig para mabuo ang salita.',
      prompt: 'ba + ___ = bata',
      sample: 'Tapikin ang tamang pantig.',
      options: ['ta', 'sa', 'la'],
      correct: 'ta',
      success: 'Tama! ba + ta = bata.'
    },
    'picture-guess': {
      instruction: 'Tingnan ang picture clue at piliin ang tamang salitang Filipino.',
      prompt: 'Picture clue: 🐱',
      sample: 'Anong Filipino word ang bagay sa larawan?',
      options: ['pusa', 'aso', 'ibon'],
      correct: 'pusa',
      success: 'Tama! Ang larawan ay pusa.'
    },
    'sentence-builder': {
      instruction: 'Piliin ang wastong ayos ng pangungusap.',
      prompt: 'Ayusin ang mga salita: bata / Ako / ay',
      sample: 'Dapat malinaw at tama ang pangungusap.',
      options: ['Ako ay bata.', 'Ay bata ako.', 'Bata ako ay.'],
      correct: 'Ako ay bata.',
      success: 'Tama! “Ako ay bata.” ang wastong pangungusap.'
    },
    'story-quest': {
      instruction: 'Basahin ang maikling kuwento at sagutin ang tanong.',
      prompt: 'Si Ana ay may pulang payong. Ginamit niya ito nang umulan. Ano ang ginamit ni Ana?',
      sample: 'Hanapin ang sagot sa kuwento.',
      options: ['payong', 'aklat', 'lapis'],
      correct: 'payong',
      success: 'Tama! Ginamit ni Ana ang payong.'
    },
    'sound-and-say': {
      instruction: 'Practice card muna habang wala pang backend speech scoring.',
      prompt: 'Bigkasin: “Magandang umaga po.”',
      sample: 'Basahin nang malinaw at malakas.',
      options: ['Nasabi ko na!', 'Ulitin ko muna'],
      correct: 'Nasabi ko na!',
      success: 'Mahusay! Practice complete. Backend speech scoring can be added later.'
    },
    'badge-challenge': {
      instruction: 'Tapusin ang mini challenge para makita kung paano mag-u-unlock ng badge.',
      prompt: 'Ilang vocabulary games ang kailangan para sa “Bokabularyo Star”?',
      sample: 'Complete 3 vocabulary games → unlock badge.',
      options: ['3 games', '1 game', '10 games'],
      correct: '3 games',
      success: 'Tama! 3 vocabulary games para sa Bokabularyo Star.'
    }
  };

  return demos[gameId] || demos['word-match'];
}

function missionGamesForStudent(data) {
  const lessons = asArray(data?.lessons);
  const completedLessons = lessons.filter(lesson => lesson?.completed).length;

  return MISSION_GAMES.map((game, index) => {
    let status = game.baseStatus || 'Available';

    if (game.minCompleted && completedLessons < game.minCompleted) {
      status = 'Locked';
    } else if (!game.future && completedLessons > index + 1) {
      status = 'Completed';
    }

    return { ...game, status };
  });
}

function MissionStyles() {
  return (
    <style>{`
      .missions-wrap {
        display: grid;
        gap: 18px;
      }

      .missions-wrap.early {
        --mission-text: #26354d;
        --mission-muted: #526988;
        --mission-primary: #15965a;
      }

      .missions-wrap.standard {
        --mission-text: #17243b;
        --mission-muted: #64748b;
        --mission-primary: #2563eb;
        padding: 18px 0 96px;
      }

      .missions-hero {
        position: relative;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
        gap: 18px;
        align-items: stretch;
        border-radius: 34px;
        padding: 26px;
        background:
          radial-gradient(circle at 10% 20%, rgba(255, 236, 163, 0.78), transparent 28%),
          radial-gradient(circle at 90% 16%, rgba(219, 234, 254, 0.80), transparent 28%),
          linear-gradient(135deg, #ffffff, #f0fff5 48%, #eef8ff);
        border: 1px solid rgba(31, 154, 92, 0.10);
        box-shadow: 0 16px 34px rgba(39, 87, 63, 0.07);
      }

      .missions-wrap.standard .missions-hero {
        background: linear-gradient(135deg, #eef2ff, #ffffff 54%, #f8fafc);
        border-color: rgba(37, 99, 235, 0.10);
        box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
      }

      .missions-hero-copy h2 {
        margin: 0;
        color: var(--mission-primary);
        font-size: clamp(38px, 4.6vw, 62px);
        line-height: 0.96;
        letter-spacing: -0.055em;
        font-weight: 1000;
      }

      .missions-wrap.standard .missions-hero-copy h2 {
        font-size: clamp(34px, 4vw, 52px);
        letter-spacing: -0.045em;
      }

      .missions-hero-copy p {
        margin: 12px 0 0;
        color: var(--mission-muted);
        max-width: 720px;
        font-size: 18px;
        line-height: 1.55;
        font-weight: 850;
      }

      .missions-hero-icon {
        width: 96px;
        height: 96px;
        display: grid;
        place-items: center;
        margin-bottom: 12px;
        border-radius: 30px;
        background: #fff5cf;
        font-size: 54px;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.22);
      }

      .missions-progress-card {
        border-radius: 30px;
        padding: 22px;
        background: rgba(255, 255, 255, 0.92);
        border: 2px solid rgba(255, 217, 102, 0.32);
        box-shadow: 0 14px 30px rgba(20, 34, 59, 0.08);
        align-self: stretch;
        display: grid;
        align-content: center;
      }

      .missions-progress-card strong {
        color: #14223b;
        font-size: clamp(26px, 3vw, 38px);
        font-weight: 1000;
        letter-spacing: -0.045em;
      }

      .missions-progress-track {
        height: 15px;
        margin-top: 14px;
        border-radius: 999px;
        background: #e2e8f0;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.25);
      }

      .missions-progress-fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #45c985, #facc15);
      }

      .missions-wrap.standard .missions-progress-fill {
        background: linear-gradient(90deg, #2563eb, #7c3aed);
      }

      .missions-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .missions-stat-card {
        min-height: 104px;
        padding: 18px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid rgba(148, 163, 184, 0.20);
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
      }

      .missions-stat-card b {
        display: block;
        color: var(--mission-text);
        font-size: 30px;
        font-weight: 1000;
        line-height: 1;
      }

      .missions-stat-card span {
        display: block;
        margin-top: 8px;
        color: var(--mission-muted);
        font-weight: 850;
      }

      .missions-section {
        border-radius: 32px;
        padding: 26px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(31, 154, 92, 0.07);
        box-shadow: 0 16px 32px rgba(39, 87, 63, 0.06);
      }

      .missions-wrap.standard .missions-section {
        border-color: rgba(37, 99, 235, 0.09);
        box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
      }

      .missions-section-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 18px;
      }

      .missions-section-head h3 {
        margin: 0;
        color: var(--mission-primary);
        font-size: clamp(28px, 3.3vw, 42px);
        line-height: 1;
        letter-spacing: -0.045em;
        font-weight: 1000;
      }

      .missions-section-head p {
        margin: 8px 0 0;
        color: var(--mission-muted);
        font-weight: 850;
        line-height: 1.5;
      }

      .missions-game-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
        gap: 16px;
      }

      .missions-wrap.early .missions-game-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .missions-game-card {
        border: 0;
        min-height: 238px;
        border-radius: 28px;
        padding: 18px;
        text-align: left;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 14px;
        cursor: pointer;
        color: #24324a;
        box-shadow: 0 12px 24px rgba(47, 78, 84, 0.06);
        border: 2px solid transparent;
        transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
      }

      .missions-game-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 30px rgba(47, 78, 84, 0.10);
      }

      .missions-game-card.locked {
        opacity: 0.68;
        cursor: not-allowed;
      }

      .missions-game-card.sky { background: #e0f2fe; }
      .missions-game-card.sun { background: #fef3c7; }
      .missions-game-card.mint { background: #dcfce7; }
      .missions-game-card.pink { background: #fce7f3; }
      .missions-game-card.violet { background: #ede9fe; }
      .missions-game-card.rose { background: #ffe4e6; }
      .missions-game-card.orange { background: #ffedd5; }

      .missions-game-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .missions-game-icon {
        width: 66px;
        height: 66px;
        display: grid;
        place-items: center;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.72);
        font-size: 38px;
      }

      .missions-status {
        min-height: 32px;
        padding: 0 11px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        color: #334155;
        font-size: 12px;
        font-weight: 1000;
      }

      .missions-game-card h4 {
        margin: 12px 0 8px;
        color: #14223b;
        font-size: 24px;
        line-height: 1.05;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .missions-game-card p {
        margin: 0;
        color: #385075;
        font-size: 15px;
        line-height: 1.45;
        font-weight: 800;
      }

      .missions-tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0;
      }

      .missions-tag {
        min-height: 30px;
        padding: 0 10px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        color: #334155;
        font-size: 12px;
        font-weight: 1000;
      }

      .missions-play-btn {
        width: 100%;
        min-height: 48px;
        border: 0;
        border-radius: 18px;
        background: linear-gradient(135deg, #47ce87, #1f9c60);
        color: white;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 18px rgba(32, 156, 96, 0.16);
        display: grid;
        place-items: center;
      }

      .missions-wrap.standard .missions-play-btn {
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        box-shadow: 0 12px 18px rgba(37, 99, 235, 0.16);
      }

      .missions-play-btn.locked {
        background: #94a3b8;
        box-shadow: none;
        cursor: not-allowed;
      }

      .missions-badge-card {
        border-radius: 28px;
        padding: 24px;
        background: #ffffff;
        border: 1px solid rgba(148, 163, 184, 0.22);
        box-shadow: 0 14px 26px rgba(15, 23, 42, 0.05);
      }

      .missions-badge-card h3 {
        margin: 0 0 10px;
        color: var(--mission-primary);
        font-size: 30px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .missions-badge-card p {
        color: var(--mission-muted);
        font-weight: 850;
        line-height: 1.6;
      }

      .missions-badge-preview-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 14px;
      }

      .missions-badge-preview {
        min-height: 108px;
        border-radius: 22px;
        display: grid;
        place-items: center;
        text-align: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #334155;
        font-weight: 950;
      }

      .missions-badge-preview span {
        display: block;
        font-size: 34px;
        margin-bottom: 6px;
      }

      .missions-bottom-nav {
        position: fixed;
        left: 50%;
        bottom: 14px;
        transform: translateX(-50%);
        width: min(760px, calc(100vw - 24px));
        z-index: 90;
        min-height: 76px;
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(148, 163, 184, 0.22);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
        backdrop-filter: blur(14px);
      }

      .missions-bottom-nav button {
        border: 0;
        border-radius: 20px;
        background: transparent;
        color: #475569;
        font-size: 12px;
        font-weight: 950;
        cursor: pointer;
        display: grid;
        place-items: center;
        gap: 2px;
      }

      .missions-bottom-nav button.active {
        background: #edf8f1;
        color: #15965a;
      }

      .missions-wrap.standard + .missions-bottom-nav button.active {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .missions-bottom-nav span {
        font-size: 24px;
        line-height: 1;
      }

      .mission-play-shell {
        display: grid;
        gap: 18px;
      }

      .mission-play-card {
        border-radius: 36px;
        padding: 32px;
        background:
          radial-gradient(circle at 10% 18%, rgba(255, 236, 163, 0.78), transparent 28%),
          radial-gradient(circle at 90% 16%, rgba(219, 234, 254, 0.80), transparent 30%),
          linear-gradient(135deg, #ffffff, #f8fcff);
        border: 1px solid rgba(31, 154, 92, 0.10);
        box-shadow: 0 18px 38px rgba(39, 87, 63, 0.08);
      }

      .mission-play-head {
        display: grid;
        grid-template-columns: 110px minmax(0, 1fr);
        gap: 20px;
        align-items: center;
        margin-bottom: 22px;
      }

      .mission-play-icon {
        width: 110px;
        height: 110px;
        border-radius: 34px;
        display: grid;
        place-items: center;
        background: #fff5cf;
        font-size: 62px;
        box-shadow: inset 0 0 0 2px rgba(246, 196, 83, 0.22);
      }

      .mission-play-head h2 {
        margin: 0;
        color: #15965a;
        font-size: clamp(40px, 5vw, 68px);
        line-height: 0.95;
        letter-spacing: -0.06em;
        font-weight: 1000;
      }

      .mission-play-head p {
        margin: 10px 0 0;
        color: #526988;
        font-size: 18px;
        line-height: 1.55;
        font-weight: 850;
      }

      .mission-prompt-box {
        padding: 24px;
        border-radius: 28px;
        background: #ffffff;
        border: 1px dashed #cbd5e1;
        color: #24324a;
        font-size: clamp(22px, 3vw, 34px);
        line-height: 1.55;
        font-weight: 1000;
      }

      .mission-play-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .mission-play-choice {
        min-height: 72px;
        border: 2px solid rgba(47, 191, 115, 0.20);
        border-radius: 22px;
        background: #ffffff;
        color: #24324a;
        font-size: 18px;
        font-weight: 1000;
        cursor: pointer;
        padding: 12px 16px;
        text-align: center;
      }

      .mission-play-choice.selected,
      .mission-play-choice:hover {
        background: #edf8f1;
        color: #15965a;
        border-color: rgba(47, 191, 115, 0.46);
      }

      .mission-result {
        margin-top: 16px;
        padding: 18px;
        border-radius: 22px;
        background: #fff8cf;
        color: #24324a;
        font-size: 18px;
        font-weight: 1000;
        line-height: 1.45;
      }

      .mission-result.good {
        background: #e9fbef;
        color: #0d7f48;
        border: 1px solid #bfeacb;
      }

      .mission-play-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 22px;
      }

      .mission-play-action {
        min-height: 58px;
        border: 0;
        border-radius: 20px;
        padding: 0 22px;
        background: linear-gradient(135deg, #47ce87, #1f9c60);
        color: white;
        font-size: 17px;
        font-weight: 1000;
        cursor: pointer;
        box-shadow: 0 12px 20px rgba(32, 156, 96, 0.14);
      }

      .mission-play-action.secondary {
        background: #ffffff;
        color: #14975a;
        border: 2px solid #2fbf73;
        box-shadow: none;
      }

      .mission-play-action.purple {
        background: linear-gradient(135deg, #a770ef, #7b4fd6);
      }

      /* Duolingo-inspired mission polish */
      .missions-wrap.early {
        gap: 24px;
      }

      .missions-wrap.early .missions-game-card,
      .missions-wrap.early .mission-play-card,
      .missions-wrap.early .missions-section,
      .missions-wrap.early .missions-badge-card,
      .missions-wrap.early .missions-stat-card {
        border: 3px solid rgba(209, 250, 229, 0.95);
        box-shadow: 0 9px 0 rgba(188, 221, 198, 0.72), 0 18px 34px rgba(25, 78, 54, 0.08);
      }

      .missions-wrap.early .missions-game-card {
        min-height: 258px;
        position: relative;
        overflow: hidden;
        transform: translateY(0);
      }

      .missions-wrap.early .missions-game-card::after {
        content: '';
        position: absolute;
        inset: 12px;
        border-radius: 24px;
        border: 2px solid rgba(255, 255, 255, 0.42);
        pointer-events: none;
      }

      .missions-wrap.early .missions-game-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 0 rgba(188, 221, 198, 0.84), 0 24px 42px rgba(25, 78, 54, 0.12);
      }

      .missions-wrap.early .missions-game-card:active {
        transform: translateY(3px);
        box-shadow: 0 5px 0 rgba(188, 221, 198, 0.84), 0 14px 26px rgba(25, 78, 54, 0.10);
      }

      .missions-wrap.early .missions-game-icon,
      .missions-wrap.early .mission-play-icon {
        background: #ffffff;
        border: 3px solid rgba(255, 238, 174, 0.85);
        box-shadow: 0 6px 0 rgba(246, 196, 83, 0.18);
      }

      .missions-wrap.early .missions-play-btn,
      .missions-wrap.early .mission-play-action {
        min-height: 56px;
        border-radius: 18px;
        background: linear-gradient(180deg, #58cc02 0%, #40a900 100%);
        box-shadow: 0 6px 0 #2f8500, 0 12px 20px rgba(88, 204, 2, 0.18);
        letter-spacing: 0.01em;
      }

      .missions-wrap.early .missions-play-btn {
        text-transform: uppercase;
        font-size: 16px;
      }

      .missions-wrap.early .mission-play-action:hover,
      .missions-wrap.early .missions-play-btn:hover {
        filter: brightness(1.03);
      }

      .missions-wrap.early .mission-play-action:active,
      .missions-wrap.early .missions-play-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #2f8500, 0 8px 14px rgba(88, 204, 2, 0.16);
      }

      .missions-wrap.early .mission-play-action.secondary {
        background: #ffffff;
        color: #15965a;
        border: 3px solid #b7efc5;
        box-shadow: 0 6px 0 #d4ead9;
      }

      .missions-wrap.early .mission-play-action.purple {
        background: linear-gradient(180deg, #8b5cf6 0%, #6d45d8 100%);
        box-shadow: 0 6px 0 #4f2faf, 0 12px 20px rgba(139, 92, 246, 0.18);
      }

      .missions-wrap.early .mission-prompt-box {
        background: #ffffff;
        border: 3px solid #e5eef9;
        box-shadow: inset 0 -5px 0 rgba(226, 232, 240, 0.62);
      }

      .missions-wrap.early .mission-play-choice {
        min-height: 86px;
        border: 3px solid #dbeafe;
        border-bottom-width: 7px;
        border-radius: 24px;
        background: #ffffff;
        color: #24324a;
        box-shadow: none;
        transition: 0.14s ease;
      }

      .missions-wrap.early .mission-play-choice:hover,
      .missions-wrap.early .mission-play-choice.selected {
        background: #ecfdf5;
        color: #15965a;
        border-color: #8ce0ae;
        transform: translateY(-2px);
      }

      .missions-wrap.early .mission-result {
        border: 3px solid #fde68a;
        box-shadow: 0 6px 0 #f7d86b;
      }

      .missions-wrap.early .mission-result.good {
        border-color: #86efac;
        box-shadow: 0 6px 0 #60c983;
      }

      .missions-wrap.early .mission-play-card {
        position: relative;
        overflow: hidden;
      }

      .missions-wrap.early .mission-play-card::before {
        content: '⭐';
        position: absolute;
        right: 28px;
        top: 26px;
        font-size: 34px;
        opacity: 0.38;
        pointer-events: none;
      }

      .g12-mission-play-nohero {
        padding-top: 22px;
      }

      .g12-mission-play-nav {
        grid-template-columns: repeat(6, 1fr);
      }


      /* Grade 1-2 Missions and game screen balanced font sizing. */
      .missions-wrap.early .missions-section,
      .missions-wrap.early .missions-badge-card,
      .missions-wrap.early .missions-stat-card,
      .missions-wrap.early .mission-play-card {
        border-radius: 30px;
      }

      .missions-wrap.early .missions-section {
        padding: 24px;
      }

      .missions-wrap.early .missions-stat-card {
        min-height: 92px;
        padding: 16px;
      }

      .missions-wrap.early .missions-stat-card b {
        font-size: 24px;
      }

      .missions-wrap.early .missions-stat-card span,
      .missions-wrap.early .missions-section-head p,
      .missions-wrap.early .missions-badge-card p {
        font-size: 15px;
        line-height: 1.45;
      }

      .missions-wrap.early .missions-section-head h3,
      .missions-wrap.early .missions-badge-card h3 {
        font-size: clamp(24px, 3vw, 34px);
        line-height: 1.05;
      }

      .g12-page .missions-wrap.early .missions-game-card,
      .missions-wrap.early .missions-game-card {
        min-height: 230px;
        padding: 22px;
        border-radius: 30px;
      }

      .g12-page .missions-wrap.early .missions-game-icon,
      .missions-wrap.early .missions-game-icon {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        font-size: 40px;
      }

      .g12-page .missions-wrap.early .missions-game-card h4,
      .missions-wrap.early .missions-game-card h4 {
        font-size: 28px;
        line-height: 1.08;
      }

      .g12-page .missions-wrap.early .missions-game-card p,
      .missions-wrap.early .missions-game-card p {
        font-size: 16px;
      }

      .g12-page .missions-wrap.early .missions-play-btn,
      .missions-wrap.early .missions-play-btn {
        min-height: 54px;
        border-radius: 20px;
        font-size: 16px;
      }

      .missions-wrap.early .missions-badge-preview {
        min-height: 92px;
        border-radius: 20px;
        font-size: 14px;
      }

      .missions-wrap.early .missions-badge-preview span {
        font-size: 28px;
      }

      .missions-wrap.early .mission-play-card {
        padding: 28px;
      }

      .missions-wrap.early .mission-play-head {
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 18px;
        margin-bottom: 20px;
      }

      .missions-wrap.early .mission-play-icon {
        width: 84px;
        height: 84px;
        border-radius: 28px;
        font-size: 46px;
      }

      .missions-wrap.early .mission-play-head h2 {
        font-size: clamp(30px, 3.8vw, 46px);
        line-height: 1;
      }

      .missions-wrap.early .mission-play-head p {
        font-size: 16px;
        line-height: 1.45;
      }

      .missions-wrap.early .mission-prompt-box {
        padding: 22px;
        border-radius: 24px;
        font-size: clamp(18px, 2.2vw, 26px);
        line-height: 1.6;
      }

      .missions-wrap.early .mission-play-options {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .missions-wrap.early .mission-play-choice {
        min-height: 68px;
        border-radius: 22px;
        font-size: 16px;
      }

      .missions-wrap.early .mission-result {
        padding: 16px;
        border-radius: 20px;
        font-size: 16px;
      }

      .missions-wrap.early .mission-play-action {
        min-height: 54px;
        border-radius: 20px;
        padding: 0 22px;
        font-size: 16px;
      }

      @media (max-width: 960px) {
        .missions-hero,
        .missions-wrap.early .missions-game-grid {
          grid-template-columns: 1fr;
        }

        .missions-stat-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .mission-play-head {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .missions-hero,
        .missions-section,
        .missions-badge-card,
        .mission-play-card {
          border-radius: 26px;
          padding: 20px;
        }

        .missions-stat-grid,
        .missions-badge-preview-row {
          grid-template-columns: 1fr;
        }

        .missions-bottom-nav {
          width: calc(100vw - 18px);
          bottom: 10px;
          border-radius: 22px;
        }

        .missions-bottom-nav button {
          font-size: 10px;
        }

        .mission-play-icon {
          width: 84px;
          height: 84px;
          border-radius: 28px;
          font-size: 48px;
        }
      }
    `}</style>
  );
}

export {
  MISSION_GAMES,
  getMissionDemo,
  MissionStyles,
};
