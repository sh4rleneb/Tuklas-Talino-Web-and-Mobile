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
    const mastery = best?.mastery || masteryFromPercent(0);
    const subjectMeta =
      subjects.find((subject) => subject.name === quiz.subject) ||
      subjects[index % subjects.length] ||
      subjects[0] || {
        tone: "green",
        icon: "📚",
      };

    return {
      quiz,
      best,
      mastery,
      tone: mastery.tone || subjectMeta.tone || "green",
      icon: subjectTheme(quiz.subject).icon || subjectMeta.icon || "📚",
      attemptsUsed,
      attemptsDone,
    };
  });

  const quizContent = (
    <>
      <QuizSharedStyles />

      <div className="quiz-shell">
        <section className={early ? "g12-section-card" : "g46-ref-panel"}>
          <div className={early ? "g12-section-head" : "g46-ref-panel-head"}>
            <div>
              <h2 className={early ? "g12-section-title" : ""}>
                {early ? "🧠 Quiz Time" : "Quiz List"}
              </h2>

              {!early && (
                <p className="g46-ref-muted">
                  Answer first. Review feedback after your final try.
                </p>
              )}
            </div>

            {!early && recommendedQuiz && (
              <button
                type="button"
                className="quiz-secondary"
                onClick={() => openQuiz(recommendedQuiz)}
              >
                Start Recommended
              </button>
            )}
          </div>

          {subjectCounts.length > 0 && (
            <div className="quiz-game-subject-row" aria-label="Quiz subject filters">
              <button
                type="button"
                className={`quiz-game-subject-chip ${quizSubjectFilter === "ALL" ? "active" : ""}`}
                onClick={() => setQuizSubjectFilter("ALL")}
              >
                🌎 All
              </button>

              {subjectCounts.map((subject) => (
                <button
                  type="button"
                  className={`quiz-game-subject-chip ${quizSubjectFilter === subject.name ? "active" : ""}`}
                  key={subject.name}
                  onClick={() => setQuizSubjectFilter(subject.name)}
                >
                  {subject.icon} {subject.name}{!early && `: ${subject.count}`}
                </button>
              ))}
            </div>
          )}

          <div className="quiz-card-grid">
            {cards.map(({ quiz, best, mastery, tone, icon, attemptsUsed, attemptsDone }) => (
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
                        {best ? `${best.percent}% ${mastery.label}` : "Not taken yet"}
                      </span>
                    )}
                  </div>

                  <h3>{early ? shortEarlyQuizTitle(quiz) : quiz.title}</h3>

                  <p>
                    {early ? (
                      <>
                        {quiz.questions.length} tanong • ⭐ {quiz.xpReward} XP
                      </>
                    ) : (
                      <>
                        {quiz.subject} • Grade {quiz.gradeLevel} •{" "}
                        {quiz.questions.length} question
                        {quiz.questions.length === 1 ? "" : "s"} • +{quiz.xpReward} XP
                      </>
                    )}
                  </p>

                  {!early && (
                    <div className="quiz-pill-row">
                      <span className="quiz-pill">{quiz.type}</span>

                      <span className="quiz-pill">
                        Attempts: {Math.min(attemptsUsed, maxQuizAttempts)}/{maxQuizAttempts}
                      </span>

                      {best && (
                        <span className="quiz-pill">
                          Best: {best.score}/{best.total}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <span className="quiz-action" role="button" tabIndex={-1}>
                  {early
                    ? "›"
                    : attemptsDone
                      ? "Review"
                      : best
                        ? "Try Again"
                        : "Start"}
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
        subtitle="Separate assessment space for scores, mastery, attempts, and review feedback."
      >
        {quizContent}
      </Grade46StudentChrome>
    );
  }

  return quizContent;
}