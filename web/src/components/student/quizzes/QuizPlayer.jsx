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

function normalizeQuizMaxAttempts(value, fallback = 2) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (
    normalized === 'unlimited' ||
    normalized === '0'
  ) {
    return 0;
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(10, Math.max(1, parsed));
}

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
  resetKey = 0,
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
  const maxAttempts = normalizeQuizMaxAttempts(
    quiz?.maxAttempts ??
      quiz?.max_attempts ??
      quiz?.dataJson?.maxAttempts ??
      quiz?.data_json?.maxAttempts
  );
  const attemptsUsed = maxAttempts === 0
    ? currentAttempts.length
    : Math.min(currentAttempts.length, maxAttempts);

  useEffect(() => {
    setStarted(false);
    setCurrentIndex(0);
    setAnswers({});
  }, [quiz?.id, resetKey]);

  function startFreshAttempt() {
    setCurrentIndex(0);
    setAnswers({});
    setStarted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectAnswer(questionId, optionId) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }

  function confirmQuizExit() {
    if (!started) return true;

    return window.confirm(
      "Paalala: May sinasagutan ka pang pagsusulit sa Filipino.\n\nTapusin muna ang pagsusulit upang maitala ang iyong iskor at puna sa sagot.\n\nManatili sa pahinang ito upang tapusin ang pagsusulit, o magpatuloy kung aalis ka muna."
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
      alert(
        `Sagutin muna ang lahat ng tanong. ${answeredCount} sa ${questions.length} ang nasagutan mo.`
      );
      return;
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
          <h2>Wala pang tanong</h2>
          <p>Walang tanong ang pagsusulit na ito. Bumalik sa listahan ng pagsusulit.</p>

          <button
            type="button"
            className="quiz-secondary"
            onClick={() => go("screen-stu-quizzes")}
            style={{ marginTop: 18 }}
          >
            ← Bumalik sa Mga Pagsusulit
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
        onStart={startFreshAttempt}
        onBack={() => go("screen-stu-quizzes")}
      />
    );
  } else {
    quizInnerContent = (
      <section className="quiz-game-stage" aria-label="Kasalukuyang Pagsusulit">
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
                  ← Bumalik sa Mga Pagsusulit
                </button>
              )}

              <button
                type="button"
                className="quiz-secondary"
                onClick={previousQuestion}
                disabled={currentIndex === 0}
              >
                Nakaraang Tanong
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className="quiz-primary"
                  onClick={nextQuestion}
                >
                  {hasSelectedAnswer ? "Susunod na Tanong →" : "Laktawan Muna →"}
                </button>
              ) : (
                <button
                  type="button"
                  className="quiz-primary"
                  onClick={finishQuiz}
                >
                  Ipasa ang Pagsusulit
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
        title={started ? "Mga Pagsusulit" : "Hamon sa Pagsusulit"}
        subtitle={
          started
            ? "Tapusin muna ang pagsusulit bago lumipat sa ibang tab."
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
        title={quiz?.title || "Mga Pagsusulit"}
        subtitle=""
        titleAction={
          <button
            type="button"
            className="g46-ref-soft-btn"
            onClick={() => goWithQuizGuard("screen-stu-quizzes")}
          >
            ← Mga Pagsusulit
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
