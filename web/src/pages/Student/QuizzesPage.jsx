import React from "react";

import {
  QuizSharedStyles,
  asArray,
  subjectTheme,
  masteryFromPercent,
} from "../../components/student/quizzes/QuizUI";

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

  function shortEarlyQuizTitle(quiz = {}) {
    const subject = String(quiz.subject || "").trim();
    const title = String(quiz.title || "").trim();

    const withoutQuiz = title.replace(/\s*quiz\s*$/i, "").trim();

    if (/^gawa$/i.test(withoutQuiz)) return "Gawa";
    if (/^gawa\b/i.test(withoutQuiz)) return "Gawa";

    const prefix = withoutQuiz
      .replace(/^([^:]+)\s*:\s*.+$/, "$1")
      .replace(/\s+/g, " ")
      .trim();

    if (prefix && prefix.length <= 22) {
      if (/oral|bigkas|speech|komunikasyon/i.test(prefix)) {
        const number = prefix.match(/\d+/)?.[0];
        return number ? `Bigkas ${number}` : "Bigkas";
      }

      if (/pagsulat|sulatin|patlang|writing/i.test(prefix)) {
        const number = prefix.match(/\d+/)?.[0];
        return number ? `Patlang ${number}` : "Patlang";
      }

      return prefix;
    }

    if (/bokabularyo/i.test(subject) || /bokabularyo/i.test(title)) return "Bokabularyo";
    if (/pagbasa/i.test(subject) || /pagbasa/i.test(title)) return "Pagbasa";
    if (/panitikan/i.test(subject) || /panitikan/i.test(title)) return "Panitikan";
    if (/oral|bigkas|speech|komunikasyon/i.test(subject) || /oral|bigkas|speech|komunikasyon/i.test(title)) return "Bigkas";
    if (/pagsulat|sulatin|patlang|writing/i.test(subject) || /pagsulat|sulatin|patlang|writing/i.test(title)) return "Patlang";

    return prefix || subject || "Quiz";
  }

  const visibleQuizzes =
    quizSubjectFilter === "ALL"
      ? quizzes
      : quizzes.filter((quiz) => quiz.subject === quizSubjectFilter);

  const recommendedQuiz =
    visibleQuizzes.find((quiz) => asArray(quizAttempts?.[quiz.id]).length < maxQuizAttempts) ||
    visibleQuizzes[0] ||
    quizzes[0];

  const subjectCounts = subjects
    .map((subject) => ({
      ...subject,
      count: quizzes.filter((quiz) => quiz.subject === subject.name).length,
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
      };
    const subjectLook = subjectTheme(quiz.subject) || {};
    const statusLabel = attemptsDone
      ? "Final review available"
      : attemptsUsed
        ? `Attempt ${Math.min(attemptsUsed, maxQuizAttempts)}/${maxQuizAttempts} saved`
        : "Ready to start";
    const actionLabel = attemptsDone
      ? "Review"
      : attemptsUsed
        ? "Try Again"
        : "Start";

    return {
      quiz,
      best,
      mastery,
      tone: best ? (mastery?.tone || "green") : (subjectLook.tone || subjectMeta.tone || "green"),
      icon: subjectLook.icon || subjectMeta.icon || "📚",
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
          className={early ? "g12-section-card" : "g46-ref-panel"}
          style={!early ? { minHeight: 620 } : undefined}
        >
          <div className={early ? "g12-section-head" : "g46-ref-panel-head"}>
            <div>
              <h2 className={early ? "g12-section-title" : ""}>
                {early ? "🧠 Quiz Time" : "Quiz List"}
              </h2>

            </div>

          </div>

          {subjectCounts.length > 0 && (
            <div
              className="quiz-game-subject-row"
              aria-label="Quiz subject filters"
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
                🌎 All
              </button>

              {subjectCounts.map((subject) => (
                <button
                  type="button"
                  className={`quiz-game-subject-chip ${quizSubjectFilter === subject.name ? "active" : ""}`}
                  style={grade46FilterStyle(quizSubjectFilter === subject.name, subject.name)}
                  key={subject.name}
                  onClick={() => setQuizSubjectFilter(subject.name)}
                >
                  {subject.icon} {subject.name}{!early && `: ${subject.count}`}
                </button>
              ))}
            </div>
          )}

          <div
            className="quiz-card-grid"
            style={!early ? { minHeight: 360, alignContent: "start" } : undefined}
          >
            {cards.map(({ quiz, best, mastery, tone, icon, attemptsUsed, attemptsDone, statusLabel, actionLabel }) => (
              <button
                type="button"
                className={`quiz-card ${tone} ${early ? "early-quiz-card" : ""}`}
                key={quiz.id}
                onClick={() => attemptsDone && typeof openQuizResult === "function" ? openQuizResult(quiz) : openQuiz(quiz)}
              >
                <div>
                  <div className="quiz-card-head">
                    <span className="quiz-card-icon">{icon}</span>

                    {!early && (
                      <span className="quiz-pill">
                        {best ? `${best.percent}% ${mastery?.label || "Mastery"}` : statusLabel}
                      </span>
                    )}
                  </div>

                  <h3>{early ? shortEarlyQuizTitle(quiz) : quiz.title}</h3>

                  {early && (
                    <p>
                      {quiz.questions.length} tanong • ⭐ {quiz.xpReward} XP
                    </p>
                  )}
                </div>

                <span className="quiz-action" role="button" tabIndex={-1}>
                  {early ? "›" : actionLabel}
                </span>
              </button>
            ))}
          </div>

          {!quizzes.length && (
            <div className={early ? "g12-empty" : "g46-ref-empty"}>
              No quizzes yet. Create lessons with MCQ or matching activities first.
            </div>
          )}

          {quizzes.length > 0 && !visibleQuizzes.length && (
            <div className={early ? "g12-empty" : "g46-ref-empty"}>
              No quizzes found for this subject yet.
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
        title="Quiz Time"
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
        icon="🧠"
        title="Quizzes"
        subtitle=""
      >
        {quizContent}
      </Grade46StudentChrome>
    );
  }

  return quizContent;
}