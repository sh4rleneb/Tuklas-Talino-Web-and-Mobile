import React, { useEffect, useState } from "react";

import {
  asArray,
  QuizSharedStyles,
  QuizGameHeader,
  QuizStartCard,
  QuizGameProgress,
  QuizQuestionCard,
  QuizAnswerButton,
} from "./QuizUI";

export default function QuizPlayer({
  data,
  quiz,
  go,
  submitQuiz,
  quizAttempts = {},
  getBestQuizAttempt,
  EarlyStudentChrome,
  Grade46StudentChrome,
  logout,
}) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const student = data?.student || {};
  const early = Number(student?.gradeLevel || 4) <= 2;
  const questions = asArray(quiz?.questions);
  const current = questions[currentIndex] || questions[0];
  const answeredCount = Object.keys(answers).length;

  const best =
    typeof getBestQuizAttempt === "function"
      ? getBestQuizAttempt(quizAttempts, quiz?.id)
      : null;

  const selectedId = current ? answers[current.id] : null;
  const hasSelectedAnswer = Boolean(selectedId);
  const currentAttempts = asArray(quizAttempts?.[quiz?.id]);
  const attemptsUsed = Math.min(currentAttempts.length, 2);
  const maxAttempts = 2;

  useEffect(() => {
    setStarted(false);
    setCurrentIndex(0);
    setAnswers({});
  }, [quiz?.id]);

  function selectAnswer(questionId, optionId) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }

  function confirmQuizExit() {
    if (!started) return true;

    return window.confirm(
      "Paalala: May sinasagutan ka pang Filipino quiz.\n\nTapusin muna ang quiz para ma-save ang iyong score at review feedback.\n\nPindutin ang Cancel para manatili at tapusin, o OK kung aalis ka muna."
    );
  }

  function goWithQuizGuard(targetScreen) {
    if (!confirmQuizExit()) return;
    go(targetScreen);
  }

  function beforeQuizNavigate() {
    return confirmQuizExit();
  }

  function nextQuestion() {
    setCurrentIndex((index) => Math.min(questions.length - 1, index + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousQuestion() {
    setCurrentIndex((index) => Math.max(0, index - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finishQuiz() {
    if (answeredCount < questions.length) {
      const proceed = window.confirm(
        `May ${answeredCount}/${questions.length} ka pang nasagutan. I-submit na ba ang quiz kahit may hindi pa nasasagutan?`
      );

      if (!proceed) return;
    }

    submitQuiz(quiz, answers);
  }

  let quizInnerContent = null;

  if (!questions.length) {
    quizInnerContent = (
      <section className="quiz-game-panel" style={{ padding: 28 }}>
        <div
          className="quiz-game-copy"
          style={{ position: "relative", zIndex: 1 }}
        >
          <h2>No questions yet</h2>
          <p>This quiz does not have questions. Please return to the quiz list.</p>

          <button
            type="button"
            className="quiz-secondary"
            onClick={() => go("screen-stu-quizzes")}
            style={{ marginTop: 18 }}
          >
            ← Back to Quizzes
          </button>
        </div>
      </section>
    );
  } else if (!started) {
    quizInnerContent = (
      <QuizStartCard
        quiz={quiz}
        best={best}
        attemptsUsed={attemptsUsed}
        maxAttempts={maxAttempts}
        onStart={() => setStarted(true)}
        onBack={() => go("screen-stu-quizzes")}
      />
    );
  } else {
    quizInnerContent = (
      <section className="quiz-game-stage" aria-label="Active quiz">
        <div className="quiz-game-stage-inner">
          {early && (
            <QuizGameHeader
              quiz={quiz}
              best={best}
              go={go}
              onBack={() => goWithQuizGuard("screen-stu-quizzes")}
            />
          )}

          <QuizGameProgress
            currentIndex={currentIndex}
            total={questions.length}
            answeredCount={answeredCount}
          />

          <QuizQuestionCard
            quiz={quiz}
            question={current}
            currentIndex={currentIndex}
            total={questions.length}
          />

          <div className="quiz-choice-grid">
            {asArray(current?.options).map((option, index) => (
              <QuizAnswerButton
                key={option.id}
                option={option}
                index={index}
                selected={String(selectedId) === String(option.id)}
                reveal={false}
                correct={false}
                onClick={() => selectAnswer(current.id, option.id)}
              />
            ))}
          </div>

          <div className="quiz-nav-actions">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {early && (
                <button
                  type="button"
                  className="quiz-secondary"
                  onClick={() => goWithQuizGuard("screen-stu-quizzes")}
                >
                  ← Back to Quizzes
                </button>
              )}

              <button
                type="button"
                className="quiz-secondary"
                onClick={previousQuestion}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className="quiz-primary"
                  onClick={nextQuestion}
                >
                  {hasSelectedAnswer ? "Next Question →" : "Skip for now →"}
                </button>
              ) : (
                <button
                  type="button"
                  className="quiz-primary"
                  onClick={finishQuiz}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const quizContent = (
    <>
      <QuizSharedStyles />

      <div className="quiz-shell">{quizInnerContent}</div>
    </>
  );

  if (early && typeof EarlyStudentChrome === "function") {
    return (
      <EarlyStudentChrome
        data={data}
        activeTab="quizzes"
        go={go}
        icon="🧠"
        title={started ? "Quiz Time" : "Quiz Quest"}
        subtitle={
          started
            ? "Tapusin muna ang quiz bago lumipat sa ibang tab."
            : quiz?.title || "Sagutin ang tanong."
        }
        beforeNavigate={beforeQuizNavigate}
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
        title={quiz?.title || "Quiz"}
        subtitle="" 
        titleAction={
          <button
            type="button"
            className="g46-ref-soft-btn"
            onClick={() => goWithQuizGuard("screen-stu-quizzes")}
          >
            ← Quizzes
          </button>
        }
        beforeNavigate={beforeQuizNavigate}
      >
        {quizContent}
      </Grade46StudentChrome>
    );
  }

  return quizContent;
}
