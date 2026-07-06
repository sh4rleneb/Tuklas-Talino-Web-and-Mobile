import React, { useEffect, useState } from "react";

import {
  masteryFromPercent,
  QuizSharedStyles,
  QuizResultCard,
} from "./QuizUI";

function list(value) {
  return Array.isArray(value) ? value : [];
}

function sameId(left, right) {
  return String(left ?? "") === String(right ?? "");
}

function optionText(option, fallback = "") {
  return String(
    option?.text ??
    option?.optionText ??
    option?.label ??
    option?.value ??
    fallback ??
    ""
  ).trim();
}

function questionPrompt(question, fallback = "") {
  return String(
    question?.prompt ??
    question?.question ??
    question?.text ??
    question?.title ??
    fallback ??
    ""
  ).trim();
}

function hydrateAttemptBalikan(attempt = {}, quiz = {}) {
  const questions = list(quiz?.questions);
  const reviewItems = list(attempt?.review?.length ? attempt.review : attempt?.details);

  return reviewItems.map((item = {}, index) => {
    const question =
      questions.find((candidate) => sameId(candidate?.id, item.questionId)) ||
      questions[index] ||
      null;

    const options = list(question?.options);
    const selectedOption =
      options.find((candidate) => sameId(candidate?.id, item.selectedOptionId)) ||
      null;

    const correctOption =
      options.find((candidate) => sameId(candidate?.id, item.correctOptionId)) ||
      options.find((candidate) => Boolean(candidate?.isCorrect || candidate?.correct)) ||
      null;

    const correct =
      item.correct !== undefined
        ? Boolean(item.correct)
        : item.isCorrect !== undefined
          ? Boolean(item.isCorrect)
          : Boolean(
              selectedOption &&
              correctOption &&
              sameId(selectedOption.id, correctOption.id)
            );

    return {
      ...item,
      index: item.index || index + 1,
      questionId: item.questionId || question?.id || index + 1,
      prompt: item.prompt || questionPrompt(question, `Tanong ${index + 1}`),
      selectedOptionId: item.selectedOptionId || selectedOption?.id || null,
      selectedText: item.selectedText || optionText(selectedOption, "Walang sagot"),
      correctOptionId: item.correctOptionId || correctOption?.id || null,
      correctText: item.correctText || optionText(correctOption, "—"),
      correct,
      isCorrect: correct,
    };
  });
}

export default function QuizResults({
  data,
  result,
  go,
  openQuiz,
  buildStudentQuizzes,
  EarlyStudentChrome,
  Grade46StudentChrome,
  logout,
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
  const rawAttemptHistory = Array.isArray(result?.attemptHistory) && result.attemptHistory.length
    ? result.attemptHistory
    : [result].filter(Boolean);
  const attemptHistory = rawAttemptHistory.map((attempt) => ({
    ...attempt,
    review: hydrateAttemptBalikan(attempt, sourceQuiz),
  }));
  const highestAttemptNo = Math.max(
    0,
    ...attemptHistory.map((attempt) => Number(attempt?.attemptNo || 0))
  );
  const preferredAttemptNo = attemptNo || highestAttemptNo;
  const preferredBalikanIndex = Math.max(
    0,
    attemptHistory.findIndex((attempt) => Number(attempt?.attemptNo || 0) === preferredAttemptNo)
  );
  const [selectedBalikanIndex, setSelectedBalikanIndex] = useState(preferredBalikanIndex);

  useEffect(() => {
    setSelectedBalikanIndex(preferredBalikanIndex);
  }, [result?.id, result?.attemptNo, result?.submittedAt, preferredBalikanIndex]);

  const canRetake = Boolean(sourceQuiz && attemptHistory.length < maxAttempts);
  const showBalikan = !canRetake;
  const activeBalikanIndex = Math.min(selectedBalikanIndex, Math.max(0, attemptHistory.length - 1));
  const activeAttempt = attemptHistory[activeBalikanIndex] || result;
  const activeBalikanItems = activeAttempt?.review || activeAttempt?.details || [];
  const bestAttempt = attemptHistory.reduce((best, attempt) => {
    const currentPercent = Number(attempt?.percent ?? 0);
    const bestPercent = Number(best?.percent ?? -1);
    return currentPercent > bestPercent ? attempt : best;
  }, attemptHistory[0] || result);
  const bestScoreText = bestAttempt
    ? `${Number(bestAttempt.score ?? 0)}/${Number(bestAttempt.total ?? result?.total ?? 0)} • ${Number(bestAttempt.percent ?? 0)}%`
    : '';

  function reviewAttemptScore(attempt = {}) {
    const score = Number(attempt?.score ?? 0);
    const total = Number(attempt?.total ?? result?.total ?? 0);
    const rawPercent = attempt?.percent;
    const percent = rawPercent !== undefined && rawPercent !== null
      ? Number(rawPercent)
      : total
        ? Math.round((score / total) * 100)
        : 0;

    return total ? `${score}/${total} • ${percent}%` : `${percent}%`;
  }

  const resultContent = (
    <>
      <QuizSharedStyles />

      <div className="quiz-shell">
        <QuizResultCard result={{ ...result, mastery, bestScoreText: early ? '' : bestScoreText }} />

        <section className={early ? "g12-section-card" : "g46-ref-panel"}>
          <div className={early ? "g12-section-head" : "g46-ref-panel-head"}>
            <div>
              <h2 className={early ? "g12-section-title" : ""}>
                {showBalikan ? "Balikan ang mga Sagot" : "Naitala ang iyong resulta sa pagsusulit."}
              </h2>

              <p className={early ? "g12-section-subtitle" : "g46-ref-muted"}>
                {showBalikan
                  ? "Suriin ang iyong mga sagot."
                  : "Subukan muna muli. Susunod ang feedback."}
              </p>
            </div>

            <div className="quiz-result-actions">
              {canRetake && (
                <button
                  type="button"
                  className="quiz-primary"
                  onClick={() => openQuiz(sourceQuiz)}
                >
                  Ulitin ang Pagsusulit
                </button>
              )}

              <button
                type="button"
                className="quiz-secondary"
                onClick={() => go("screen-stu-quizzes")}
              >
                Bumalik sa Mga Pagsusulit
              </button>
            </div>
          </div>

          {!showBalikan ? (
            <div
              className="quiz-review-item correct"
              style={early ? { fontSize: 24, padding: 26, borderRadius: 30, lineHeight: 1.55 } : { fontSize: 17, lineHeight: 1.45 }}
            >
              <b>Score saved!</b>
              <p>Subukan muna muli. Susunod ang feedback.</p>
            </div>
          ) : (
            <div className="quiz-review-list">
              <div className="quiz-result-actions" style={{ justifyContent: "flex-start", marginBottom: 12 }}>
                {attemptHistory.map((attempt, attemptIndex) => {
                  const selected = activeBalikanIndex === attemptIndex;

                  return (
                    <button
                      type="button"
                      key={attempt.id || attemptIndex}
                      className={selected ? "quiz-primary" : "quiz-secondary"}
                      onClick={() => setSelectedBalikanIndex(attemptIndex)}
                      style={early ? {
                        fontSize: 20,
                        padding: "14px 22px",
                        borderRadius: 22,
                        minHeight: 56
                      } : {
                        minHeight: 68,
                        padding: "12px 20px",
                        borderRadius: 20,
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        lineHeight: 1.15,
                        minWidth: 128,
                        boxShadow: selected ? "0 12px 28px rgba(10, 126, 73, 0.18)" : "none"
                      }}
                    >
                      <span>Try {attempt.attemptNo || attemptIndex + 1}</span>
                      {!early && (
                        <small style={{ fontSize: 12, fontWeight: 900, opacity: selected ? 0.95 : 0.78 }}>
                          Score {reviewAttemptScore(attempt)}
                        </small>
                      )}
                    </button>
                  );
                })}
              </div>

              <section style={{ display: "grid", gap: 12 }}>
                <h3 className={early ? "g12-section-title" : ""}>
                  Try {activeAttempt?.attemptNo || activeBalikanIndex + 1} sa {maxAttempts}
                </h3>

                {activeBalikanItems.map((item, index) => (
                  <article
                    key={`${activeAttempt?.id || activeBalikanIndex}-${item.questionId || index}`}
                    className={`quiz-review-item ${item.correct ? "correct" : "wrong"}`}
                    style={early ? { fontSize: 24, padding: 26, borderRadius: 30, lineHeight: 1.55 } : { fontSize: 17, lineHeight: 1.45 }}
                  >
                    <b>
                      Tanong {index + 1}: {item.correct ? "✅ Tama!" : "❌ Balikan Ito"}
                    </b>

                    <p>{item.prompt}</p>

                    <p>
                      Your answer: <strong>{item.selectedText || "Walang sagot"}</strong>
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
        title="Resulta ng Pagsusulit"
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
        logout={logout}
        icon={mastery.icon || "🏆"}
        title="Resulta ng Pagsusulit"
        subtitle={`${mastery.label} • ${result.score}/${result.total}`}
      >
        {resultContent}
      </Grade46StudentChrome>
    );
  }

  return resultContent;
}
