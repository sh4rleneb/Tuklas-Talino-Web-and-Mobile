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
  quizAttempts = {},
  subjects = [],
  buildStudentQuizzes,
  getBestQuizAttempt,
  EarlyStudentChrome,
  Grade46StudentChrome,
}) {
  const student = data?.student || {};
  const early = Number(student?.gradeLevel || 4) <= 2;

  const quizzes =
    typeof buildStudentQuizzes === "function"
      ? buildStudentQuizzes(data)
      : [];

  const getBest =
    typeof getBestQuizAttempt === "function"
      ? getBestQuizAttempt
      : () => null;

  const recommendedQuiz =
    quizzes.find((quiz) => !asArray(quizAttempts?.[quiz.id]).length) ||
    quizzes[0];

  const subjectCounts = subjects
    .map((subject) => ({
      ...subject,
      count: quizzes.filter((quiz) => quiz.subject === subject.name).length,
    }))
    .filter((item) => item.count > 0);

  const cards = quizzes.map((quiz, index) => {
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
                {early ? "🧠 Mga Quiz" : "Quiz List"}
              </h2>

              <p className={early ? "g12-section-subtitle" : "g46-ref-muted"}>
                {early
                  ? "Pumili ng quiz. Makikita ang feedback pagkatapos i-submit."
                  : "Choose a quiz to check lesson mastery and review results after submission."}
              </p>
            </div>

            {recommendedQuiz && (
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
            <div className="quiz-game-subject-row" aria-label="Quiz subject counts">
              {subjectCounts.map((subject) => (
                <span className="quiz-game-subject-chip" key={subject.name}>
                  {subject.icon} {subject.name}: {subject.count}
                </span>
              ))}
            </div>
          )}

          <div className="quiz-card-grid">
            {cards.map(({ quiz, best, mastery, tone, icon }) => (
              <button
                type="button"
                className={`quiz-card ${tone}`}
                key={quiz.id}
                onClick={() => openQuiz(quiz)}
              >
                <div>
                  <div className="quiz-card-head">
                    <span className="quiz-card-icon">{icon}</span>

                    <span className="quiz-pill">
                      {best ? `${best.percent}% ${mastery.label}` : "Not taken yet"}
                    </span>
                  </div>

                  <h3>{quiz.title}</h3>

                  <p>
                    {quiz.subject} • Grade {quiz.gradeLevel} •{" "}
                    {quiz.questions.length} question
                    {quiz.questions.length === 1 ? "" : "s"} • +{quiz.xpReward} XP
                  </p>

                  <div className="quiz-pill-row">
                    <span className="quiz-pill">{quiz.type}</span>

                    {best && (
                      <span className="quiz-pill">
                        Best: {best.score}/{best.total}
                      </span>
                    )}
                  </div>
                </div>

                <span className="quiz-action" role="button" tabIndex={-1}>
                  {best ? "Retake Quiz" : "Start Quiz"}
                </span>
              </button>
            ))}
          </div>

          {!quizzes.length && (
            <div className={early ? "g12-empty" : "g46-ref-empty"}>
              No quizzes yet. Create lessons with MCQ or matching activities first.
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
        title="Quiz Quest"
        subtitle="Sagutin ang quiz para malaman kung naintindihan ang lesson."
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