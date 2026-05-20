import React from "react";

import {
  masteryFromPercent,
  QuizSharedStyles,
  QuizResultCard,
} from "./QuizUI";

export default function QuizResults({
  data,
  result,
  go,
  openQuiz,
  buildStudentQuizzes,
  EarlyStudentChrome,
  Grade46StudentChrome,
}) {
  const student = data?.student || {};
  const early = Number(student?.gradeLevel || 4) <= 2;
  const mastery = result?.mastery || masteryFromPercent(result?.percent || 0);

  const quizzes =
    typeof buildStudentQuizzes === "function"
      ? buildStudentQuizzes(data)
      : [];

  const sourceQuiz = quizzes.find((quiz) => quiz.id === result.quizId);

  const resultContent = (
    <>
      <QuizSharedStyles />

      <div className="quiz-shell">
        <QuizResultCard result={{ ...result, mastery }} />

        <section className={early ? "g12-section-card" : "g46-ref-panel"}>
          <div className={early ? "g12-section-head" : "g46-ref-panel-head"}>
            <div>
              <h2 className={early ? "g12-section-title" : ""}>
                Review Answers
              </h2>

              <p className={early ? "g12-section-subtitle" : "g46-ref-muted"}>
                Feedback appears after the quiz so students can focus while answering.
              </p>
            </div>

            <div className="quiz-result-actions">
              {sourceQuiz && (
                <button
                  type="button"
                  className="quiz-primary"
                  onClick={() => openQuiz(sourceQuiz)}
                >
                  Retake Quiz
                </button>
              )}

              <button
                type="button"
                className="quiz-secondary"
                onClick={() => go("screen-stu-quizzes")}
              >
                Back to Quizzes
              </button>
            </div>
          </div>

          <div className="quiz-review-list">
            {(result.details || []).map((item, index) => (
              <article
                key={item.questionId || index}
                className={`quiz-review-item ${item.correct ? "correct" : "wrong"}`}
              >
                <b>
                  {item.correct ? "✓" : "•"} Question {index + 1}
                </b>

                <p>{item.prompt}</p>

                <p>
                  Your answer: <strong>{item.selectedText || "No answer"}</strong>
                </p>

                <p>
                  Correct answer: <strong>{item.correctText || "—"}</strong>
                </p>
              </article>
            ))}
          </div>
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
        icon={mastery.icon || "🏆"}
        title="Quiz Result"
        subtitle={mastery.label}
      >
        {resultContent}
      </EarlyStudentChrome>
    );
  }

  if (!early && typeof Grade46StudentChrome === "function") {
    return (
      <Grade46StudentChrome
        data={data}
        activeTab="quizzes"
        go={go}
        icon={mastery.icon || "🏆"}
        title="Quiz Result"
        subtitle={`${mastery.label} • ${result.score}/${result.total}`}
      >
        {resultContent}
      </Grade46StudentChrome>
    );
  }

  return resultContent;
}