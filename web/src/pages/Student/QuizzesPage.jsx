import React from "react";

import {
  QuizSharedStyles,
  asArray,
  subjectTheme,
  masteryFromPercent,
} from "../../components/student/quizzes/QuizUI";
import "./QuizzesPagePolish.css";


function subjectIconSrc(subject = "") {
  const key = String(subject || "").toLowerCase();
  if (key.includes("pagbasa")) return "/category-pagbasa.png";
  if (key.includes("bokabularyo")) return "/category-bokabularyo.png";
  if (key.includes("panitikan")) return "/category-panitikan.png";
  if (key.includes("oral")) return "/category-oralcomm.png";
  if (key.includes("pagsulat")) return "/category-pagsulat.png";
  return "";
}

function SubjectImageIcon({ subject = "", src = "", className = "subject-img-icon", fallback = "📚" }) {
  const resolvedSrc = src || subjectIconSrc(subject);
  if (!resolvedSrc) return <>{fallback}</>;
  return <img src={resolvedSrc} alt="" className={className} aria-hidden="true" />;
}

export default function QuizzesPage({
  data,
  go,
  openQuiz,
  openQuizResult,
  quizAttempts = {},
  subjects = [],
  buildStudentQuizzes,
  getBestQuizAttempt,
  EarlyStudentChrome,
  Grade46StudentChrome,
  logout,
}) {
  const student = data?.student || {};
  const early = Number(student?.gradeLevel || 4) <= 2;
  const [quizSubjectFilter, setQuizSubjectFilter] = React.useState("ALL");

  const quizzes =
    typeof buildStudentQuizzes === "function"
      ? buildStudentQuizzes(data)
      : [];

  const getBest =
    typeof getBestQuizAttempt === "function"
      ? getBestQuizAttempt
      : () => null;

  const maxQuizAttempts = 2;

  function grade46FilterStyle(active, subjectName = "ALL") {
    if (early) return undefined;

    const key = String(subjectName || "ALL").toLowerCase();
    const palette = key.includes("pagbasa")
      ? { border: "#7CC4FF", bg: "#EEF8FF", activeBg: "#DDF1FF", color: "#1268A8" }
      : key.includes("bokabularyo")
        ? { border: "#8BD7FF", bg: "#F0FAFF", activeBg: "#DFF5FF", color: "#1672A5" }
        : key.includes("panitikan")
          ? { border: "#F3C27A", bg: "#FFF8EA", activeBg: "#FFECC4", color: "#A45B00" }
          : key.includes("oral")
            ? { border: "#C9B6FF", bg: "#F7F2FF", activeBg: "#EDE4FF", color: "#5B3BB3" }
            : key.includes("pagsulat")
              ? { border: "#FFB6C9", bg: "#FFF2F6", activeBg: "#FFE0EA", color: "#A92E5A" }
              : { border: "#9EE6C1", bg: "#F1FFF7", activeBg: "#DDFBEA", color: "#087A43" };

    return {
      minHeight: 46,
      padding: "12px 18px",
      borderRadius: 999,
      border: `2px solid ${active ? palette.color : palette.border}`,
      background: active ? palette.activeBg : palette.bg,
      color: palette.color,
      fontSize: 15,
      fontWeight: 950,
      boxShadow: active ? "0 10px 24px rgba(26, 122, 75, 0.14)" : "none"
    };
  }

  function titleCaseQuizzesText(value = "") {
    const smallWords = new Set(["ang", "ng", "sa", "si", "ni", "kay", "at", "ay", "mga", "na", "po"]);
    const words = String(value || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return words
      .map((word, index) => {
        if (index > 0 && smallWords.has(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  function isGenericQuizzesName(value = "") {
    const text = String(value || "")
      .replace(/\s*quiz\s*$/i, "")
      .trim();

    return /^(bokabularyo|pagbasa|panitikan|bigkas|gawa|patlang|oral comm|pagsulat|quiz)(\s+\d+)?$/i.test(text);
  }

  function cleanQuizzesTitleSeed(value = "", earlyMode = false) {
    let text = String(value || "")
      .replace(/[“”"]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    text = text
      .replace(/^mission\s*:\s*/i, "")
      .replace(/^tanong\s*\d+\s*[:.-]?\s*/i, "")
      .replace(/^question\s*\d+\s*[:.-]?\s*/i, "")
      .replace(/\s*quiz\s*$/i, "")
      .trim();

    // Remove common question/task starters so the title becomes content-based.
    const starters = [
      /^ano ang\s+/i,
      /^alin ang\s+/i,
      /^sino ang\s+/i,
      /^saan\s+/i,
      /^kailan\s+/i,
      /^bakit\s+/i,
      /^paano\s+/i,
      /^piliin ang\s+/i,
      /^hanapin ang\s+/i,
      /^tukuyin ang\s+/i,
      /^isulat ang\s+/i,
      /^bigkasin\s*:?\s*/i,
      /^basahin\s*:?\s*/i,
      /^ayusin ang\s+/i,
      /^buuin ang\s+/i,
      /^kumpletuhin ang\s+/i,
      /^sagutin ang\s+/i,
    ];

    starters.forEach((pattern) => {
      text = text.replace(pattern, "");
    });

    text = text
      .replace(/[?.!]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const maxWords = earlyMode ? 4 : 6;
    const words = text.split(/\s+/).filter(Boolean);

    return titleCaseQuizzesText(words.slice(0, maxWords).join(" "));
  }

  function specificQuizCardTitle(quiz = {}, earlyMode = false) {
    const firstQuestion = asArray(quiz.questions)[0] || {};
    const sources = [
      firstQuestion.prompt,
      firstQuestion.question,
      quiz.lessonTitle,
      quiz.title,
      quiz.subject,
    ];

    const fallback = cleanQuizzesTitleSeed(quiz.title || quiz.subject || "Quizzes", earlyMode) || "Quizzes";

    const chosen =
      sources
        .map((source) => cleanQuizzesTitleSeed(source, earlyMode))
        .find((candidate) => candidate && candidate.length >= 3 && !isGenericQuizzesName(candidate)) ||
      fallback;

    const finalTitle = chosen.replace(/\s*quiz\s*$/i, "").trim() || "Quizzes";
    return finalTitle;
  }

  // Keep this function name for existing Grade 1-2 card rendering.
  function shortEarlyQuizzesTitle(quiz = {}) {
    return specificQuizCardTitle(quiz, true);
  }

  const visibleQuizzes =
    quizSubjectFilter === "ALL"
      ? quizzes
      : quizzes.filter((quiz) => {
        const subject = String(quiz.subject || '').trim();
        return (
          subject === quizSubjectFilter ||
          (subject === 'Oral Comm' && quizSubjectFilter === 'Komunikasyong Pagsasalita') ||
          (subject === 'Komunikasyong Pagsasalita' && quizSubjectFilter === 'Oral Comm') ||
          (subject === 'Oral Communication' && quizSubjectFilter === 'Komunikasyong Pagsasalita')
        );
      });

  const recommendedQuizzes =
    visibleQuizzes.find((quiz) => asArray(quizAttempts?.[quiz.id]).length < maxQuizAttempts) ||
    visibleQuizzes[0] ||
    quizzes[0];

  const subjectCounts = subjects
    .map((subject) => ({
      ...subject,
      count: quizzes.filter((quiz) => {
        const value = String(quiz.subject || '').trim();
        return (
          value === subject.name ||
          (value === 'Oral Comm' && subject.name === 'Komunikasyong Pagsasalita') ||
          (value === 'Komunikasyong Pagsasalita' && subject.name === 'Oral Comm') ||
          (value === 'Oral Communication' && subject.name === 'Komunikasyong Pagsasalita')
        );
      }).length,
    }))
    .filter((item) => item.count > 0);


  const cards = visibleQuizzes.map((quiz, index) => {
    const attempts = asArray(quizAttempts?.[quiz.id]);
    const attemptsUsed = attempts.length;
    const attemptsDone = attemptsUsed >= maxQuizAttempts;
    const best = getBest(quizAttempts, quiz.id);
    const mastery = best?.mastery || null;
    const subjectMeta =
      subjects.find((subject) => subject.name === quiz.subject) ||
      subjects[index % subjects.length] ||
      subjects[0] || {
        tone: "green",
        icon: "📚",
        iconSrc: subjectIconSrc(quiz.subject),
      };
    const subjectLook = subjectTheme(quiz.subject) || {};
    const statusLabel = attemptsDone
      ? "May huling pagbabalik-aral"
      : attemptsUsed
        ? `Naisave ang pagsubok ${Math.min(attemptsUsed, maxQuizAttempts)}/${maxQuizAttempts}`
        : "Handa nang simulan";
    const actionLabel = attemptsDone
      ? "Balikan"
      : attemptsUsed
        ? "Subukang Muli"
        : "Simulan";

    return {
      quiz,
      best,
      mastery,
      tone: best ? (mastery?.tone || "green") : (subjectLook.tone || subjectMeta.tone || "green"),
      icon: subjectLook.icon || subjectMeta.icon || "📚",
      iconSrc: subjectLook.iconSrc || subjectMeta.iconSrc || subjectIconSrc(quiz.subject),
      attemptsUsed,
      attemptsDone,
      statusLabel,
      actionLabel,
    };
  });

  const quizContent = (
    <>
      <QuizSharedStyles />

      <div className="quiz-shell">
        <section
          className={early ? "g12-section-card quiz-time-panel early" : "g46-ref-panel quiz-time-panel grade46"}
          style={!early ? { minHeight: 620 } : undefined}
        >
          <div className={early ? "g12-section-head" : "g46-ref-panel-head"}>
            <div>
              <h2 className={early ? "g12-section-title" : ""}>
                {early ? "🧠 Mga Pagsusulit" : "Listahan ng mga Pagsusulit"}
              </h2>

            </div>

          </div>

          {subjectCounts.length > 0 && (
            <div
              className="quiz-game-subject-row"
              aria-label="Mga filter ng asignatura"
              style={!early ? {
                gap: 12,
                marginTop: 18,
                marginBottom: 18,
                alignItems: "center",
                flexWrap: "wrap"
              } : undefined}
            >
              <button
                type="button"
                className={`quiz-game-subject-chip ${quizSubjectFilter === "ALL" ? "active" : ""}`}
                style={grade46FilterStyle(quizSubjectFilter === "ALL", "ALL")}
                onClick={() => setQuizSubjectFilter("ALL")}
              >
                🌎 Lahat
              </button>

              {subjectCounts.map((subject) => (
                <button
                  type="button"
                  className={`quiz-game-subject-chip ${quizSubjectFilter === subject.name ? "active" : ""}`}
                  style={grade46FilterStyle(quizSubjectFilter === subject.name, subject.name)}
                  key={subject.name}
                  onClick={() => setQuizSubjectFilter(subject.name)}
                >
                  <SubjectImageIcon subject={subject.name} src={subject.iconSrc} fallback={subject.icon} className="subject-img-icon chip" /> {subject.name}{!early && `: ${subject.count}`}
                </button>
              ))}
            </div>
          )}

          <div
            className="quiz-card-grid"
            style={!early ? { minHeight: 360, alignContent: "start" } : undefined}
          >
            {cards.map(({ quiz, best, mastery, tone, icon, iconSrc, attemptsUsed, attemptsDone, statusLabel, actionLabel }) => (
              <button
                type="button"
                className={`quiz-card ${tone} ${early ? "early-quiz-card" : ""}`}
                key={quiz.id}
                onClick={() => attemptsDone && typeof openQuizResult === "function" ? openQuizResult(quiz) : openQuiz(quiz)}
              >
                <div>
                  <div className="quiz-card-head">
                    <span className="quiz-card-icon"><SubjectImageIcon subject={quiz.subject} src={iconSrc} fallback={icon} /></span>

                  </div>

                  <h3>{specificQuizCardTitle(quiz, early)}</h3>

                  <p>
                    {quiz.questions.length} tanong • ⭐ {quiz.xpReward} XP
                  </p>
                </div>

                <span className="quiz-action" role="button" tabIndex={-1}>
                  {early ? "›" : actionLabel}
                </span>
              </button>
            ))}
          </div>

          {!quizzes.length && (
            <div className={early ? "g12-empty" : "g46-ref-empty"}>
              Wala pang mga pagsusulit.

Gumawa muna ng aralin na may aktibidad na pagsusulit.
            </div>
          )}

          {quizzes.length > 0 && !visibleQuizzes.length && (
            <div className={early ? "g12-empty" : "g46-ref-empty"}>
              Wala pang pagsusulit para sa asignaturang ito.
            </div>
          )}
        </section>
      </div>
    </>
  );

  if (early && typeof EarlyStudentChrome === "function") {
    return (
      <EarlyStudentChrome
        data={data}
        activeTab="quizzes"
        go={go}
        icon="🧠"
        title="Mga Pagsusulit"
        subtitle=""
      >
        {quizContent}
      </EarlyStudentChrome>
    );
  }

  if (!early && typeof Grade46StudentChrome === "function") {
    return (
      <Grade46StudentChrome
        data={data}
        activeTab="quizzes"
        go={go}
        logout={logout}
        icon="🧠"
        title="Mga Pagsusulit"
        subtitle=""
      >
        {quizContent}
      </Grade46StudentChrome>
    );
  }

  return quizContent;
}
