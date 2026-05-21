import React, { useState } from "react";

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

  const sourceQuiz = quizzes.find((quiz) => quiz.id === result?.quizId);
  const attemptNo = Number(result?.attemptNo || 1);
  const maxAttempts = Number(result?.maxAttempts || 2);
  const attemptHistory = Array.isArray(result?.attemptHistory) && result.attemptHistory.length
    ? result.attemptHistory
    : [result].filter(Boolean);
  const [selectedReviewIndex, setSelectedReviewIndex] = useState(0);
  const canRetake = Boolean(sourceQuiz && attemptHistory.length < maxAttempts);
  const showReview = !canRetake;
  const activeReviewIndex = Math.min(selectedReviewIndex, Math.max(0, attemptHistory.length - 1));
  const activeAttempt = attemptHistory[activeReviewIndex] || result;
  const activeReviewItems = activeAttempt?.review || activeAttempt?.details || [];

  const resultContent = (
    <>
      <QuizSharedStyles />

      <div className="quiz-shell">
        <QuizResultCard result={{ ...result, mastery }} />

        <section className={early ? "g12-section-card" : "g46-ref-panel"}>
          <div className={early ? "g12-section-head" : "g46-ref-panel-head"}>
            <div>
              <h2 className={early ? "g12-section-title" : ""}>
                {showReview ? "Review Answers" : "Quiz Attempt Saved"}
              </h2>

              <p className={early ? "g12-section-subtitle" : "g46-ref-muted"}>
                {showReview
                  ? "Check your answers."
                  : "Try again first. Feedback later."}
              </p>
            </div>

            <div className="quiz-result-actions">
              {canRetake && (
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

          {!showReview ? (
            <div
              className="quiz-review-item correct"
              style={early ? { fontSize: 24, padding: 26, borderRadius: 30, lineHeight: 1.55 } : { fontSize: 17, lineHeight: 1.45 }}
            >
              <b>Score saved!</b>
              <p>Try again first. Feedback later.</p>
            </div>
          ) : (
            <div className="quiz-review-list">
              <div className="quiz-result-actions" style={{ justifyContent: "flex-start", marginBottom: 12 }}>
                {attemptHistory.map((attempt, attemptIndex) => (
                  <button
                    type="button"
                    key={attempt.id || attemptIndex}
                    className={activeReviewIndex === attemptIndex ? "quiz-primary" : "quiz-secondary"}
                    onClick={() => setSelectedReviewIndex(attemptIndex)}
                    style={early ? { fontSize: 20, padding: "14px 22px", borderRadius: 22, minHeight: 56 } : undefined}
                  >
                    Try {attempt.attemptNo || attemptIndex + 1}
                  </button>
                ))}
              </div>

              <section style={{ display: "grid", gap: 12 }}>
                <h3 className={early ? "g12-section-title" : ""}>
                  Try {activeAttempt?.attemptNo || activeReviewIndex + 1} of {maxAttempts}
                </h3>

                {activeReviewItems.map((item, index) => (
                  <article
                    key={`${activeAttempt?.id || activeReviewIndex}-${item.questionId || index}`}
                    className={`quiz-review-item ${item.correct ? "correct" : "wrong"}`}
                    style={early ? { fontSize: 24, padding: 26, borderRadius: 30, lineHeight: 1.55 } : { fontSize: 17, lineHeight: 1.45 }}
                  >
                    <b>
                      Question {index + 1}: {item.correct ? "✅ Correct!" : "❌ Review this"}
                    </b>

                    <p>{item.prompt}</p>

                    <p>
                      Your answer: <strong>{item.selectedText || "No answer"}</strong>
                    </p>

                    <p>
                      Correct: <strong>{item.correctText || "—"}</strong>
                    </p>
                  </article>
                ))}
              </section>
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
