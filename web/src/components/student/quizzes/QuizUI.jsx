import React from "react";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}


function subjectIconSrc(subject = "") {
  const key = String(subject || "").toLowerCase();
  if (key.includes("pagbasa")) return "/category-pagbasa.png";
  if (key.includes("bokabularyo")) return "/category-bokabularyo.png";
  if (key.includes("panitikan")) return "/category-panitikan.png";
  if (key.includes("oral")) return "/category-oralcomm.png";
  if (key.includes("pagsulat")) return "/category-pagsulat.png";
  return "";
}

function SubjectImageIcon({ subject = "", className = "subject-img-icon", fallback = "📚" }) {
  const src = subjectIconSrc(subject);
  if (!src) return <>{fallback}</>;
  return <img src={src} alt="" className={className} aria-hidden="true" />;
}

function subjectTheme(subject) {
  const map = {
    Pagbasa: {
      icon: "📖",
      iconSrc: "/category-pagbasa.png",
      bg: "#DFF7E8",
      accent: "#2ECC71",
      tag: "Kwento",
    },
    Bokabularyo: {
      icon: "🔤",
      iconSrc: "/category-bokabularyo.png",
      bg: "#DFF2FF",
      accent: "#3498DB",
      tag: "Salita",
    },
    Panitikan: {
      icon: "📜",
      iconSrc: "/category-panitikan.png",
      bg: "#FFF0DD",
      accent: "#F39C12",
      tag: "Tula",
    },
    "Oral Comm": {
      icon: "🎙️",
      iconSrc: "/category-oralcomm.png",
      bg: "#FFE2EA",
      accent: "#E67EA2",
      tag: "Bigkas",
    },
    Pagsulat: {
      icon: "✍️",
      iconSrc: "/category-pagsulat.png",
      bg: "#FFF8CF",
      accent: "#F1C40F",
      tag: "Sulatin",
    },
    Grupo: {
      icon: "👥",
      bg: "#EFE5FF",
      accent: "#9B59B6",
      tag: "Sama-sama",
    },
  };

  return (
    map[subject] || {
      icon: "📚",
      bg: "#F6F6F6",
      accent: "#95A5A6",
      tag: "Lessons",
    }
  );
}

function masteryFromPercent(percent = 0) {
  const value = Number(percent || 0);

  if (value >= 90) {
    return {
      label: "Advanced",
      icon: "🏆",
      tone: "green",
      note: "Excellent mastery. You showed strong understanding of the lesson.",
    };
  }

  if (value >= 75) {
    return {
      label: "Proficient",
      icon: "🌟",
      tone: "blue",
      note: "Great work. You understood most of the lesson.",
    };
  }

  if (value >= 50) {
    return {
      label: "Developing",
      icon: "🌱",
      tone: "yellow",
      note: "Magandang pagsubok. Balikan ang mga maling sagot.",
    };
  }

  return {
    label: "Needs Practice",
    icon: "💪",
    tone: "pink",
    note: "Try again after reviewing the lesson.",
  };
}

function StarRow({ count = 0, max = 6 }) {
  return (
    <>
      {Array.from({ length: max }).map((_, index) => (
        <span
          key={index}
          className={index < count ? "kid-star on" : "kid-star"}
        >
          ⭐
        </span>
      ))}
    </>
  );
}

function QuizSharedStyles() {
  return (
    <style>{`
      .quiz-shell {
        --quiz-green: var(--tt-green, #15965a);
        --quiz-green-dark: var(--tt-green-dark, #0f7d49);
        --quiz-green-soft: var(--tt-green-soft, #edf8f1);
        --quiz-yellow: var(--tt-yellow, #fff5cf);
        --quiz-yellow-deep: var(--tt-yellow-deep, #f6c453);
        --quiz-sky: var(--tt-sky, #eef8ff);
        --quiz-cream: var(--tt-cream, #fffdf7);
        --quiz-purple: var(--tt-purple, #7b4fd6);
        --quiz-ink: var(--tt-ink, #203451);
        --quiz-muted: var(--tt-muted, #526988);
        display: grid;
        gap: 18px;
        color: var(--quiz-ink);
      }

      .quiz-game-panel,
      .quiz-game-stage,
      .quiz-game-results,
      .quiz-game-landing-card {
        position: relative;
        overflow: hidden;
        border-radius: 34px;
        background:
          radial-gradient(circle at 10% 12%, color-mix(in srgb, var(--quiz-yellow) 88%, transparent), transparent 28%),
          radial-gradient(circle at 92% 18%, color-mix(in srgb, var(--quiz-sky) 82%, transparent), transparent 26%),
          linear-gradient(135deg, var(--quiz-cream), #ffffff 54%, var(--quiz-green-soft));
        border: 1px solid color-mix(in srgb, var(--quiz-green) 13%, transparent);
        box-shadow: 0 18px 38px rgba(31, 73, 61, 0.08);
      }

      .quiz-game-panel::before,
      .quiz-game-stage::before,
      .quiz-game-results::before,
      .quiz-game-landing-card::before {
        content: '';
        position: absolute;
        width: 180px;
        height: 180px;
        right: -72px;
        top: -72px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--quiz-yellow) 68%, transparent);
        pointer-events: none;
      }

      .quiz-game-panel::after,
      .quiz-game-stage::after,
      .quiz-game-results::after,
      .quiz-game-landing-card::after {
        content: '';
        position: absolute;
        width: 120px;
        height: 120px;
        left: -42px;
        bottom: -42px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--quiz-green-soft) 86%, transparent);
        pointer-events: none;
      }

      .quiz-game-landing-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(260px, 0.52fr);
        gap: 24px;
        align-items: center;
        padding: 30px;
      }

      .quiz-game-copy,
      .quiz-game-mascot-scene,
      .quiz-game-results-inner,
      .quiz-game-stage-inner {
        position: relative;
        z-index: 1;
      }

      .quiz-game-copy h2,
      .quiz-game-panel h2,
      .quiz-game-results h2 {
        margin: 0;
        color: var(--quiz-ink);
        font-size: clamp(32px, 4vw, 54px);
        line-height: 0.98;
        font-weight: 1000;
        letter-spacing: -0.055em;
      }

      .quiz-game-copy p,
      .quiz-game-panel p,
      .quiz-game-results p,
      .quiz-game-help-text {
        margin: 12px 0 0;
        color: var(--quiz-muted);
        font-size: 16px;
        line-height: 1.55;
        font-weight: 850;
      }

      .quiz-game-mascot-scene {
        min-height: 220px;
        border-radius: 30px;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 34% 26%, rgba(255, 255, 255, 0.92), transparent 18%),
          linear-gradient(145deg, color-mix(in srgb, var(--quiz-yellow) 76%, white), color-mix(in srgb, var(--quiz-sky) 76%, white));
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
      }

      .quiz-game-mascot {
        width: 142px;
        height: 142px;
        border-radius: 45px;
        display: grid;
        place-items: center;
        background: #ffffff;
        font-size: 78px;
        box-shadow: 0 16px 34px rgba(31, 73, 61, 0.11), inset 0 0 0 3px color-mix(in srgb, var(--quiz-yellow) 50%, transparent);
      }

      .quiz-game-float {
        position: absolute;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: #ffffff;
        box-shadow: 0 12px 22px rgba(31, 73, 61, 0.08);
        font-weight: 1000;
      }

      .quiz-game-float.one {
        width: 52px;
        height: 52px;
        left: 12%;
        top: 18%;
        color: var(--quiz-green-dark);
      }

      .quiz-game-float.two {
        width: 64px;
        height: 64px;
        right: 13%;
        top: 28%;
        color: var(--quiz-purple);
      }

      .quiz-game-float.three {
        width: 48px;
        height: 48px;
        left: 22%;
        bottom: 18%;
        color: var(--quiz-yellow-deep);
      }


      /* Grade 1-2 quiz start spacing polish */
      .g12-page .quiz-game-landing-card {
        grid-template-columns: minmax(0, 1.15fr) minmax(330px, 0.55fr) !important;
        gap: 22px !important;
        padding: 28px 34px !important;
        align-items: center !important;
      }

      .g12-page .quiz-game-copy h2 {
        max-width: 820px !important;
      }

      .g12-page .quiz-game-copy p {
        max-width: 620px !important;
      }

      .g12-page .quiz-game-mascot-scene {
        min-height: 215px !important;
        max-width: 430px !important;
        width: 100% !important;
        justify-self: end !important;
        overflow: visible !important;
      }

      .g12-page .quiz-game-mascot {
        width: 132px !important;
        height: 132px !important;
        font-size: 72px !important;
        border-radius: 38px !important;
      }

      .quiz-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .quiz-stat {
        border-radius: 26px;
        padding: 18px;
        background: #ffffff;
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
        box-shadow: 0 12px 26px rgba(31, 73, 61, 0.06);
      }

      .quiz-stat b {
        display: block;
        color: var(--quiz-ink);
        font-size: 30px;
        font-weight: 1000;
        letter-spacing: -0.04em;
      }

      .quiz-stat span {
        display: block;
        margin-top: 4px;
        color: var(--quiz-muted);
        font-size: 12px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .quiz-game-toolbar,
      .quiz-game-header,
      .quiz-result-actions,
      .quiz-nav-actions,
      .quiz-pill-row,
      .quiz-game-subject-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }

      .quiz-game-toolbar {
        justify-content: space-between;
        margin-bottom: 18px;
      }

      .quiz-game-subject-row {
        margin: 4px 0 18px;
      }

      .quiz-game-subject-chip,
      .quiz-pill,
      .quiz-game-help {
        min-height: 34px;
        border: 0;
        padding: 0 12px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        background: rgba(255, 255, 255, 0.82);
        color: var(--quiz-green-dark);
        font-size: 12px;
        font-weight: 1000;
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--quiz-green) 9%, transparent);
      }

      .quiz-game-help {
        width: 42px;
        min-height: 42px;
        padding: 0;
        font-size: 18px;
        background: var(--quiz-yellow);
        color: var(--quiz-ink);
      }

      .quiz-card-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .quiz-card {
        border: 0;
        min-height: 232px;
        padding: 22px;
        border-radius: 30px;
        background: #ffffff;
        color: var(--quiz-ink);
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 14px 28px rgba(31, 73, 61, 0.06);
        border: 1px solid color-mix(in srgb, var(--quiz-green) 8%, transparent);
        transition: transform 0.16s ease, box-shadow 0.16s ease;
      }

      .quiz-card:hover,
      .quiz-card:focus-visible,
      .quiz-primary:hover,
      .quiz-secondary:hover,
      .quiz-choice:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      .quiz-card:focus-visible,
      .quiz-primary:focus-visible,
      .quiz-secondary:focus-visible,
      .quiz-choice:focus-visible,
      .quiz-game-start-btn:focus-visible {
        outline: 4px solid color-mix(in srgb, var(--quiz-yellow-deep) 45%, transparent);
        outline-offset: 3px;
      }

      .quiz-card.green {
        background: var(--quiz-green-soft);
      }

      .quiz-card.blue {
        background: var(--quiz-sky);
      }

      .quiz-card.yellow {
        background: var(--quiz-yellow);
      }

      .quiz-card.purple {
        background: color-mix(in srgb, var(--quiz-purple) 10%, white);
      }

      .quiz-card.pink {
        background: #fff0f5;
      }

      .quiz-card-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .quiz-card-icon {
        width: 66px;
        height: 66px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.82);
        font-size: 36px;
        flex: 0 0 auto;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.65);
      }

      .quiz-card h3 {
        margin: 14px 0 8px;
        color: var(--quiz-ink);
        font-size: 25px;
        line-height: 1.05;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .quiz-card p {
        margin: 0;
        color: var(--quiz-muted);
        font-size: 15px;
        line-height: 1.5;
        font-weight: 850;
      }

      .quiz-action,
      .quiz-primary,
      .quiz-secondary,
      .quiz-game-start-btn {
        min-height: 50px;
        border-radius: 18px;
        font-size: 15px;
        font-weight: 1000;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        line-height: 1;
      }

      .quiz-action,
      .quiz-primary,
      .quiz-game-start-btn {
        border: 0;
        padding: 0 22px;
        background: linear-gradient(135deg, var(--quiz-green), var(--quiz-green-dark));
        color: #ffffff;
        box-shadow: 0 12px 20px rgba(21, 150, 90, 0.16);
      }

      .quiz-game-start-btn {
        min-height: 60px;
        border-radius: 22px;
        padding: 0 28px;
        font-size: 18px;
      }

      .quiz-secondary {
        border: 2px solid color-mix(in srgb, var(--quiz-green) 22%, transparent);
        padding: 0 20px;
        background: #ffffff;
        color: var(--quiz-green-dark);
      }

      .quiz-primary:disabled,
      .quiz-secondary:disabled,
      .quiz-choice:disabled {
        cursor: not-allowed;
        opacity: 0.72;
      }

      .quiz-game-stage {
        padding: 24px;
      }

      .quiz-game-stage-inner {
        display: grid;
        gap: 18px;
      }

      .quiz-game-header {
        justify-content: space-between;
        padding: 16px 18px;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
      }

      .quiz-game-title-line {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .quiz-game-title-icon {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: var(--quiz-yellow);
        font-size: 30px;
        flex: 0 0 auto;
      }

      .quiz-game-title-line h2 {
        margin: 0;
        color: var(--quiz-ink);
        font-size: clamp(23px, 3vw, 36px);
        line-height: 1.04;
        font-weight: 1000;
        letter-spacing: -0.045em;
      }

      .quiz-game-title-line small {
        display: block;
        margin-top: 3px;
        color: var(--quiz-muted);
        font-size: 13px;
        font-weight: 900;
      }

      .quiz-progress-line {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        color: var(--quiz-muted);
        font-weight: 950;
      }

      .quiz-progress-track {
        height: 14px;
        border-radius: 999px;
        background: #eaf4ee;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--quiz-green) 12%, transparent);
      }

      .quiz-progress-track span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--quiz-green), var(--quiz-yellow-deep));
      }

      .quiz-question-box {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 190px;
        gap: 22px;
        align-items: center;
        border-radius: 30px;
        padding: 26px;
        background:
          radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.72), transparent 18%),
          linear-gradient(135deg, #ffffff, var(--quiz-yellow) 55%, var(--quiz-sky));
        border: 1px solid color-mix(in srgb, var(--quiz-yellow-deep) 28%, transparent);
      }

      .quiz-question-box small {
        display: inline-flex;
        width: max-content;
        min-height: 32px;
        align-items: center;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        color: var(--quiz-green-dark);
        font-weight: 1000;
      }

      .quiz-question-box h2 {
        margin: 12px 0 0;
        color: var(--quiz-ink);
        font-size: clamp(28px, 3.6vw, 48px);
        line-height: 1.08;
        letter-spacing: -0.05em;
        font-weight: 1000;
      }

      .quiz-question-mascot {
        min-height: 172px;
        border-radius: 28px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.72);
        font-size: 88px;
        box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.68);
      }

      .quiz-choice-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .quiz-choice {
        border: 0;
        min-height: 88px;
        padding: 16px 18px;
        border-radius: 24px;
        background: #ffffff;
        color: var(--quiz-ink);
        text-align: left;
        font-size: 17px;
        line-height: 1.35;
        font-weight: 950;
        cursor: pointer;
        box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--quiz-green) 10%, transparent), 0 10px 18px rgba(31, 73, 61, 0.04);
        transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
      }

      .quiz-choice-letter {
        width: 38px;
        height: 38px;
        margin-right: 10px;
        border-radius: 14px;
        display: inline-grid;
        place-items: center;
        background: var(--quiz-green-soft);
        color: var(--quiz-green-dark);
        font-size: 15px;
        font-weight: 1000;
      }

      .quiz-choice.selected {
        background: var(--quiz-yellow);
        box-shadow: inset 0 0 0 4px color-mix(in srgb, var(--quiz-yellow-deep) 30%, transparent), 0 8px 0 color-mix(in srgb, var(--quiz-yellow-deep) 32%, transparent);
      }

      .quiz-choice.correct {
        background: var(--quiz-green-soft);
        box-shadow: inset 0 0 0 4px color-mix(in srgb, var(--quiz-green) 24%, transparent), 0 8px 0 color-mix(in srgb, var(--quiz-green) 18%, transparent);
      }

      .quiz-choice.incorrect {
        background: #fff8f8;
        box-shadow: inset 0 0 0 4px rgba(239, 68, 68, 0.18), 0 8px 0 rgba(239, 68, 68, 0.08);
      }

      .quiz-feedback {
        display: grid;
        grid-template-columns: 64px minmax(0, 1fr);
        gap: 14px;
        align-items: center;
        padding: 18px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
        box-shadow: 0 12px 24px rgba(31, 73, 61, 0.05);
      }

      .quiz-feedback.correct {
        background: var(--quiz-green-soft);
        border-color: color-mix(in srgb, var(--quiz-green) 26%, transparent);
      }

      .quiz-feedback.incorrect {
        background: #fff8f8;
        border-color: rgba(239, 68, 68, 0.18);
      }

      .quiz-feedback-icon {
        width: 64px;
        height: 64px;
        border-radius: 22px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.78);
        font-size: 34px;
      }

      .quiz-feedback h3 {
        margin: 0;
        color: var(--quiz-ink);
        font-size: 22px;
        font-weight: 1000;
        letter-spacing: -0.035em;
      }

      .quiz-feedback p {
        margin: 6px 0 0;
        color: var(--quiz-muted);
        font-size: 15px;
        line-height: 1.45;
        font-weight: 850;
      }

      .quiz-nav-actions,
      .quiz-result-actions {
        justify-content: space-between;
      }

      .quiz-game-results {
        padding: 32px;
        text-align: center;
      }

      .quiz-game-results-inner {
        display: grid;
        justify-items: center;
        gap: 16px;
      }

      .quiz-result-mascot {
        width: 138px;
        height: 138px;
        border-radius: 44px;
        display: grid;
        place-items: center;
        background: #ffffff;
        font-size: 76px;
        box-shadow: 0 16px 34px rgba(31, 73, 61, 0.10), inset 0 0 0 3px color-mix(in srgb, var(--quiz-yellow) 50%, transparent);
      }

      .quiz-score-badge {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        min-height: 78px;
        padding: 0 30px;
        border-radius: 28px;
        background: #ffffff;
        color: var(--quiz-ink);
        font-size: clamp(30px, 4vw, 46px);
        font-weight: 1000;
        box-shadow: 0 12px 24px rgba(31, 73, 61, 0.08);
      }

      .quiz-game-stars {
        display: flex;
        justify-content: center;
        gap: 6px;
        font-size: 28px;
        line-height: 1;
      }

      .quiz-game-stars .kid-star {
        filter: grayscale(1);
        opacity: 0.38;
      }

      .quiz-game-stars .kid-star.on {
        filter: none;
        opacity: 1;
      }

      .quiz-result-rewards {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        width: min(720px, 100%);
      }

      .quiz-reward-box {
        padding: 16px;
        border-radius: 22px;
        background: #ffffff;
        border: 1px solid color-mix(in srgb, var(--quiz-green) 10%, transparent);
      }

      .quiz-reward-box b {
        display: block;
        color: var(--quiz-ink);
        font-size: 22px;
        font-weight: 1000;
      }

      .quiz-reward-box span {
        display: block;
        margin-top: 3px;
        color: var(--quiz-muted);
        font-size: 13px;
        font-weight: 900;
      }

      .quiz-review-list {
        display: grid;
        gap: 12px;
      }

      .quiz-review-item {
        border-radius: 22px;
        padding: 16px;
        background: #ffffff;
        border: 1px solid #e7f0ea;
      }

      .quiz-review-item.correct {
        background: var(--quiz-green-soft);
        border-color: color-mix(in srgb, var(--quiz-green) 26%, transparent);
      }

      .quiz-review-item.wrong {
        background: #fff8f8;
        border-color: rgba(239, 68, 68, 0.18);
      }

      .quiz-review-item b {
        color: var(--quiz-ink);
      }

      .quiz-review-item p {
        margin: 7px 0 0;
        color: var(--quiz-muted);
        font-weight: 850;
        line-height: 1.45;
      }

      .g12-page .quiz-stat-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }


      /* Grade 1-2 Quiz Time pastel subject tabs */
      .g12-page .quiz-game-subject-row {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin: 20px 0 24px;
        align-items: center;
      }

      .g12-page .quiz-game-subject-chip {
        min-height: 64px;
        padding: 14px 24px;
        border-radius: 24px;
        background: #fffdf7;
        border: 2px solid rgba(21, 150, 90, 0.12);
        color: #203451;
        font-size: 19px;
        font-weight: 1000;
        letter-spacing: -0.02em;
        box-shadow: 0 8px 18px rgba(31, 73, 61, 0.045);
      }

      .g12-page .quiz-game-subject-chip:nth-child(1) {
        background: #edf8f1;
      }

      .g12-page .quiz-game-subject-chip:nth-child(2) {
        background: #eef8ff;
      }

      .g12-page .quiz-game-subject-chip:nth-child(3) {
        background: #fff8e8;
      }

      .g12-page .quiz-game-subject-chip:nth-child(4) {
        background: #f6efff;
      }

      .g12-page .quiz-game-subject-chip:nth-child(5) {
        background: #fff1f4;
      }


      /* Grade 1-2 Quiz Time active filter state */
      .g12-page .quiz-game-subject-chip {
        cursor: pointer;
        transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, border-color 0.16s ease;
      }

      .g12-page .quiz-game-subject-chip:hover {
        transform: translateY(-1px);
      }

      .g12-page .quiz-game-subject-chip.active {
        background: #15965a !important;
        border-color: #0f7d49 !important;
        color: #ffffff !important;
        box-shadow: 0 8px 18px rgba(21, 150, 90, 0.16) !important;
        transform: translateY(-2px);
      }

      .g12-page .quiz-game-subject-chip.active:hover {
        transform: translateY(-2px);
      }


      /* Grade 1-2 Quiz Time card redesign */
      .g12-page .quiz-card-grid {
        gap: 22px;
      }

      .g12-page .quiz-card.early-quiz-card {
        min-height: 188px;
        display: grid !important;
        grid-template-columns: 96px minmax(0, 1fr) 76px;
        align-items: center;
        gap: 22px;
        padding: 28px 28px !important;
        border-radius: 32px !important;
        text-align: left;
        background:
          radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.88), transparent 26%),
          linear-gradient(135deg, #F8FCFF, #FFFDF7) !important;
        border: 2px solid rgba(21, 150, 90, 0.10) !important;
        box-shadow: 0 14px 28px rgba(31, 73, 61, 0.08) !important;
      }

      .g12-page .quiz-card.early-quiz-card.pink,
      .g12-page .quiz-card.early-quiz-card.green,
      .g12-page .quiz-card.early-quiz-card.blue,
      .g12-page .quiz-card.early-quiz-card.yellow,
      .g12-page .quiz-card.early-quiz-card.purple {
        background:
          radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.9), transparent 28%),
          linear-gradient(135deg, #F8FCFF, #FFFDF7) !important;
      }

      .g12-page .quiz-card.early-quiz-card > div:first-child {
        display: contents;
      }

      .g12-page .quiz-card.early-quiz-card .quiz-card-head {
        grid-column: 1;
        margin: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .g12-page .quiz-card.early-quiz-card .quiz-card-icon {
        width: 82px !important;
        height: 82px !important;
        border-radius: 26px !important;
        font-size: 42px !important;
        box-shadow: 0 10px 18px rgba(31, 73, 61, 0.06) !important;
      }

      .g12-page .quiz-card.early-quiz-card h3 {
        grid-column: 2;
        margin: 0 0 8px !important;
        font-size: 32px !important;
        line-height: 1.05 !important;
        letter-spacing: -0.04em !important;
        color: #203451 !important;
      }

      .g12-page .quiz-card.early-quiz-card p {
        grid-column: 2;
        margin: 0 !important;
        font-size: 19px !important;
        font-weight: 950 !important;
        color: #526988 !important;
      }

      .g12-page .quiz-card.early-quiz-card .quiz-action {
        grid-column: 3;
        width: 66px !important;
        min-width: 66px !important;
        height: 66px !important;
        padding: 0 !important;
        border-radius: 50% !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        justify-self: center !important;
        align-self: center !important;
        background: #FFFDF6 !important;
        border: 2px solid #E7EFE8 !important;
        color: #149b55 !important;
        font-size: 42px !important;
        font-weight: 1000 !important;
        line-height: 0.9 !important;
        box-shadow: 0 6px 14px rgba(27, 46, 70, 0.06) !important;
      }

      .g12-page .quiz-card {
        min-height: 210px;
        border-radius: 34px;
        border: 3px solid rgba(255, 255, 255, 0.70);
        box-shadow: 0 8px 0 rgba(21, 150, 90, 0.09), 0 18px 28px rgba(21, 150, 90, 0.09);
      }

      .g12-page .quiz-card h3 {
        font-size: 24px;
      }

      .g12-page .quiz-choice {
        min-height: 90px;
        border-radius: 26px;
        font-size: 18px;
      }

      .g12-page .quiz-game-stage,
      .g12-page .quiz-game-results,
      .g12-page .quiz-game-landing-card {
        border-radius: 36px;
      }

      @media (max-width: 980px) {
        .quiz-game-landing-card,
        .quiz-question-box,
        .quiz-result-rewards {
          grid-template-columns: 1fr;
        }

        .quiz-question-mascot {
          min-height: 124px;
          font-size: 64px;
        }
      }

      @media (max-width: 900px) {
        .quiz-stat-grid,
        .quiz-card-grid,
        .quiz-choice-grid {
          grid-template-columns: 1fr;
        }

        .quiz-progress-line {
          grid-template-columns: 1fr;
        }

        .quiz-game-header,
        .quiz-nav-actions,
        .quiz-result-actions {
          align-items: stretch;
          flex-direction: column;
        }

        .quiz-secondary,
        .quiz-primary,
        .quiz-game-start-btn {
          width: 100%;
        }
      }
    `}</style>
  );
}

function QuizMascotScene({ mascot = "🧠", compact = false }) {
  return (
    <div className="quiz-game-mascot-scene" aria-hidden="true">
      <span className="quiz-game-float one">Aa</span>
      <span className="quiz-game-float two">⭐</span>
      <span className="quiz-game-float three">✓</span>
      <div
        className="quiz-game-mascot"
        style={compact ? { width: 112, height: 112, fontSize: 62 } : undefined}
      >
        {mascot}
      </div>
    </div>
  );
}

function QuizMetricCard({ value, label }) {
  return (
    <div className="quiz-stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function QuizGameProgress({ currentIndex = 0, total = 0, answeredCount = 0 }) {
  const progress = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  return (
    <div className="quiz-progress-line" aria-label="Quiz progress">
      <span>
        Question {Math.min(currentIndex + 1, Math.max(total, 1))} of{" "}
        {total || 1}
      </span>

      <div
        className="quiz-progress-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <span>
        {answeredCount}/{total} answered
      </span>
    </div>
  );
}

function QuizGameHeader({ quiz, best, go, onBack }) {
  return (
    <header className="quiz-game-header">
      <div className="quiz-game-title-line">
        <span className="quiz-game-title-icon">
          <SubjectImageIcon subject={quiz?.subject} fallback={subjectTheme(quiz?.subject).icon || "🧠"} />
        </span>

        <div>
          <h2>{quiz?.title || "Quizzes"}</h2>
          <small>
            {quiz?.subject || "Filipino"} • {quiz?.type || "Pagsasanay na Quizzes"}{" "}
            {best ? `• Best ${best.percent}%` : ""}
          </small>
        </div>
      </div>

      <div className="quiz-game-toolbar" style={{ marginBottom: 0 }}>
        <button
          type="button"
          className="quiz-secondary"
          onClick={onBack || (() => go("screen-stu-quizzes"))}
        >
          ← Back
        </button>

        <button
          type="button"
          className="quiz-game-help"
          title="Basahin ang tanong at piliin ang sagot. Makikita ang feedback pagkatapos mong i-submit ang quiz."
        >
          ?
        </button>
      </div>
    </header>
  );
}

function QuizStartCard({ quiz, best, attemptsUsed = 0, maxAttempts = 2, onStart, onBack }) {
  const questionCount = asArray(quiz?.questions).length;

  return (
    <section className="quiz-game-landing-card" aria-label="Quiz start">
      <div className="quiz-game-copy">
        <h2>Ready ka na sa Quiz?</h2>

        <p>
          Basahin ang tanong at piliin ang tamang sagot.
        </p>

        {best && (
          <p>
            <strong>Best score:</strong> {best.score}/{best.total} (
            {best.percent}%) • {best.mastery?.label || "Naisave ang pag-unlad"}
          </p>
        )}

        <p>
          <strong>Attempts:</strong> {attemptsUsed}/{maxAttempts}
        </p>

        <div
          className="quiz-result-actions"
          style={{ justifyContent: "flex-start", marginTop: 18 }}
        >
          <button type="button" className="quiz-game-start-btn" onClick={onStart}>
            🚀 Start Quiz
          </button>

          <button type="button" className="quiz-secondary" onClick={onBack}>
            ← Back to Quizzes
          </button>
        </div>
      </div>

      <QuizMascotScene mascot="🦉" />
    </section>
  );
}

function QuizAnswerButton({ option, index, selected, reveal, correct, onClick }) {
  const stateClass = reveal
    ? correct
      ? "correct"
      : selected
        ? "incorrect"
        : ""
    : selected
      ? "selected"
      : "";

  return (
    <button
      type="button"
      className={`quiz-choice ${stateClass}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="quiz-choice-letter">{String.fromCharCode(65 + index)}</span>
      {option.text}
    </button>
  );
}

function QuizFeedbackMessage({ selectedOption, correctOption }) {
  if (!selectedOption) {
    return (
      <div className="quiz-feedback">
        <div className="quiz-feedback-icon">💡</div>

        <div>
          <h3>Piliin ang sagot mo.</h3>
          <p>Take your time. Basahin muna ang tanong bago pumili.</p>
        </div>
      </div>
    );
  }

  const correct = String(selectedOption.id) === String(correctOption?.id);

  return (
    <div
      className={`quiz-feedback ${correct ? "correct" : "incorrect"}`}
      role="status"
      aria-live="polite"
    >
      <div className="quiz-feedback-icon">{correct ? "🎉" : "🌱"}</div>

      <div>
        <h3>{correct ? "Tama! Great job!" : "Good try! Balikan natin."}</h3>

        <p>
          {correct
            ? "Nakuha mo ang tamang sagot. Magpatuloy sa susunod na tanong."
            : `Ang tamang sagot ay: ${
                correctOption?.text || "—"
              }. Maaari mong gamitin ito sa review pagkatapos ng quiz.`}
        </p>
      </div>
    </div>
  );
}

function QuizQuestionCard({ quiz, question, currentIndex, total }) {
  return (
    <section className="quiz-question-box" aria-label={`Question ${currentIndex + 1}`}>
      <div>
        <small>{quiz?.subject || "Filipino"} • {question?.source || "Suriin ang Quizzes"}</small>
        <h2>{question?.prompt || "Piliin ang tamang sagot."}</h2>
      </div>

      <div className="quiz-question-mascot" aria-hidden="true">
        {currentIndex + 1 >= total ? "🏁" : "🧠"}
      </div>
    </section>
  );
}

function QuizResultCard({ result }) {
  const mastery = result?.mastery || masteryFromPercent(result?.percent || 0);
  const starCount = Math.max(
    1,
    Math.min(5, Math.ceil(Number(result?.percent || 0) / 20))
  );
  const hasBestScore = Boolean(result?.bestScoreText);
  const rewardGridStyle = hasBestScore
    ? {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
        width: "min(100%, 900px)",
        margin: "0 auto",
        gap: 16,
        alignItems: "stretch",
        justifyContent: "center"
      }
    : undefined;
  const rewardBoxStyle = hasBestScore
    ? {
        border: "2px solid rgba(22, 45, 73, 0.18)",
        color: "#142844",
        minHeight: 108,
        boxShadow: "0 10px 24px rgba(20, 40, 68, 0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 8
      }
    : undefined;

  return (
    <section className="quiz-game-results" aria-label="Quiz result">
      <div className="quiz-game-results-inner">
        <div className="quiz-result-mascot" aria-hidden="true">
          {mastery.icon || "🏆"}
        </div>

        <h2>{mastery.label}</h2>

        <div className="quiz-game-stars">
          <StarRow count={starCount} max={5} />
        </div>

        {mastery.note && (
          <p style={hasBestScore ? { margin: "10px auto 0", maxWidth: 560 } : undefined}>
            {mastery.note}
          </p>
        )}

        <div
          className="quiz-score-badge"
          style={hasBestScore ? {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: "fit-content",
            minWidth: 240,
            margin: "14px auto 34px"
          } : undefined}
        >
          {result.percent}/100
        </div>

        <div className="quiz-result-rewards" style={rewardGridStyle}>
          <div className="quiz-reward-box" style={rewardBoxStyle}>
            <b>
              {result.score}/{result.total}
            </b>
            <span>Raw score</span>
          </div>

          {result.bestScoreText && (
            <div className="quiz-reward-box" style={rewardBoxStyle}>
              <b>{result.bestScoreText}</b>
              <span>Best score</span>
            </div>
          )}

          <div className="quiz-reward-box" style={rewardBoxStyle}>
            <b>+{Number(result.xpAwarded ?? 0)}</b>
            <span>{Number(result.xpAwarded || 0) > 0 ? "Nakuhang XP" : "No extra XP"}</span>
          </div>

          <div className="quiz-reward-box" style={rewardBoxStyle}>
            <b>{result.attemptNo || 1} of {result.maxAttempts || 2}</b>
            <span>Quiz attempts</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export {
  asArray,
  subjectTheme,
  masteryFromPercent,
  StarRow,
  QuizSharedStyles,
  QuizMascotScene,
  QuizMetricCard,
  QuizGameProgress,
  QuizGameHeader,
  QuizStartCard,
  QuizAnswerButton,
  QuizFeedbackMessage,
  QuizQuestionCard,
  QuizResultCard,
};