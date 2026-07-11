import { useEffect, useMemo, useState } from 'react';

function cleanText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function previewParagraphs(value, fallback) {
  const text = cleanText(value, fallback);
  return text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);
}

function firstActivity(activities = [], type) {
  return (activities || []).find(activity => activity?.type === type) || null;
}

function normalizeOptions(options = []) {
  return (options || [])
    .map((option, index) => ({
      id: option.id || `${index}-${option.text || option.optionText || 'option'}`,
      text: cleanText(option.text || option.optionText, `Option ${index + 1}`)
    }))
    .filter(option => option.text);
}

function normalizeWordBank(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean);
  }

  return String(value || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function StepCard({ step, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`teacher-student-preview-step ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="teacher-student-preview-step-number">{step.number}</span>
      <span>
        <strong>{step.title}</strong>
        <small>{step.subtitle}</small>
      </span>
    </button>
  );
}

function TextLessonCard({ title, subtitle, paragraphs, emptyText }) {
  const rows = paragraphs?.length ? paragraphs : [emptyText];

  return (
    <div className="teacher-student-preview-content-card">
      <div className="teacher-student-preview-card-kicker">{subtitle}</div>
      <h3>{title}</h3>
      <div className="teacher-student-preview-reading">
        {rows.map((line, index) => (
          <p key={`${title}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function QuizPreview({ activity, activities = [] }) {
  const quizActivities = Array.isArray(activities) && activities.length
    ? activities.filter(item => item?.type === 'mcq')
    : activity
      ? [activity]
      : [];

  const visibleQuizActivities = quizActivities
    .map((item, index) => ({
      activity: item,
      blockIndex: index,
      questions: Array.isArray(item?.questions) ? item.questions : []
    }))
    .filter(item => item.questions.length);

  const totalQuestions = visibleQuizActivities.reduce(
    (sum, item) => sum + item.questions.length,
    0
  );

  if (!totalQuestions) {
    return (
      <div className="teacher-student-preview-content-card">
        <div className="teacher-student-preview-card-kicker">
          Student quiz step
        </div>
        <h3>Quiz Preview</h3>
        <p className="teacher-student-preview-muted">
          No Quiz added yet. Add a Quiz activity before publishing.
        </p>
      </div>
    );
  }

  let questionNumber = 0;

  return (
    <div className="teacher-student-preview-content-card">
      <div className="teacher-student-preview-card-kicker">
        Student quiz step
      </div>

      <h3>Quiz Preview</h3>

      <p className="teacher-student-preview-muted">
        Showing all {totalQuestions} quiz question{totalQuestions === 1 ? '' : 's'}
        {visibleQuizActivities.length > 1
          ? ` from ${visibleQuizActivities.length} quiz blocks.`
          : '.'}
      </p>

      {visibleQuizActivities.map(({ activity: quizBlock, blockIndex, questions }) => (
        <div
          key={quizBlock?.id || `quiz-preview-block-${blockIndex}`}
          style={{
            display: 'grid',
            gap: 12,
            marginTop: blockIndex ? 18 : 0
          }}
        >
          {visibleQuizActivities.length > 1 ? (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 14,
                background: '#f8fcf9',
                border: '1px solid #dcefe2',
                color: '#17324d',
                fontWeight: 950
              }}
            >
              {quizBlock?.title || `Quiz Block ${blockIndex + 1}`} - {questions.length}
              {' '}
              question{questions.length === 1 ? '' : 's'}
            </div>
          ) : quizBlock?.instructions ? (
            <p className="teacher-student-preview-muted">
              {quizBlock.instructions}
            </p>
          ) : null}

          {visibleQuizActivities.length > 1 && quizBlock?.instructions ? (
            <p className="teacher-student-preview-muted">
              {quizBlock.instructions}
            </p>
          ) : null}

          {questions.map((question, questionIndex) => {
            questionNumber += 1;

            const options = Array.isArray(question?.options)
              ? question.options
              : [];

            const correctIndex = options.findIndex(option => Boolean(option?.isCorrect));
            const correctLetter = correctIndex >= 0
              ? String.fromCharCode(65 + correctIndex)
              : '';

            return (
              <div
                className="teacher-student-preview-quiz-item"
                key={
                  question?.id ||
                  `preview-question-${blockIndex}-${questionIndex}`
                }
              >
                <div className="teacher-student-preview-question">
                  <strong>Question {questionNumber}</strong>
                  <p>
                    {question?.question ||
                      question?.prompt ||
                      question?.text ||
                      'Untitled question'}
                  </p>
                </div>

                <div className="teacher-student-preview-options">
                  {options.length ? (
                    options.map((option, optionIndex) => {
                      const isCorrect = Boolean(option?.isCorrect);

                      return (
                        <div
                          className="teacher-student-preview-option"
                          key={
                            option?.id ||
                            `preview-option-${blockIndex}-${questionIndex}-${optionIndex}`
                          }
                          style={isCorrect ? {
                            borderColor: '#86efac',
                            background: '#f0fdf4'
                          } : null}
                        >
                          <span>
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <p>
                            {option?.text ||
                              option?.optionText ||
                              option?.label ||
                              option?.value ||
                              'Untitled choice'}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="teacher-student-preview-muted">
                      No answer choices added yet.
                    </p>
                  )}
                </div>

                {correctLetter ? (
                  <div className="teacher-student-preview-note">
                    Correct answer: {correctLetter}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}

      <div className="teacher-student-preview-note">
        Answer selection is disabled in teacher preview.
      </div>
    </div>
  );
}

function GawainPreview({ activity }) {
  if (!activity) {
    return (
      <div className="teacher-student-preview-content-card">
        <div className="teacher-student-preview-card-kicker">Student activity step</div>
        <h3>Writing Activity</h3>
        <p className="teacher-student-preview-muted">No Writing Activity added yet. Add a Writing Activity before publishing.</p>
      </div>
    );
  }

  const rubric = activity.rubric || activity.rubricJson || activity.writingTask?.rubricJson || {};
  const gawainType = rubric.gawainType || activity.gawainType || 'writing_task';
  const isCompleteSentence = gawainType === 'complete_sentence';
  const template = cleanText(rubric.template || activity.template || activity.prompt, 'No sentence template added yet.');
  const choices = normalizeWordBank(rubric.choices || rubric.wordBank || activity.choicesText);

  return (
    <div className="teacher-student-preview-content-card">
      <div className="teacher-student-preview-card-kicker">Student activity step</div>
      <h3>{activity.title || 'Writing Activity'}</h3>
      {activity.instructions && (
        <p className="teacher-student-preview-muted">{activity.instructions}</p>
      )}

      {isCompleteSentence ? (
        <>
          <div className="teacher-student-preview-answer-box">
            {template}
          </div>
          <div className="teacher-student-preview-word-bank">
            {choices.length ? choices.map(choice => (
              <span key={choice}>{choice}</span>
            )) : (
              <small>No word bank choices added yet.</small>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="teacher-student-preview-question">
            <strong>{activity.prompt || 'No writing prompt added yet.'}</strong>
          </div>
          <div className="teacher-student-preview-textarea">
            Student answer area
          </div>
        </>
      )}
    </div>
  );
}

function BigkasPreview({ activity }) {
  if (!activity) {
    return (
      <div className="teacher-student-preview-content-card">
        <div className="teacher-student-preview-card-kicker">Student speaking step</div>
        <h3>Speech Activity</h3>
        <p className="teacher-student-preview-muted">No Speech Activity added yet. Add a Speech Activity before publishing.</p>
      </div>
    );
  }

  return (
    <div className="teacher-student-preview-content-card">
      <div className="teacher-student-preview-card-kicker">Student speaking step</div>
      <h3>{activity.title || 'Speech Activity'}</h3>
      {activity.instructions && (
        <p className="teacher-student-preview-muted">{activity.instructions}</p>
      )}
      <div className="teacher-student-preview-speech-text">
        {activity.targetText || 'No speech text added yet.'}
      </div>
      <button type="button" className="teacher-student-preview-disabled-button">
        Record button preview only
      </button>
    </div>
  );
}

export default function TeacherStudentLessonPreview({
  lessonDraft = {},
  activities = [],
  materialInfo = null,
  subjectMeta = null
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const quizActivities = useMemo(
    () => (activities || []).filter(activity => activity?.type === 'mcq'),
    [activities]
  );
  const quizQuestionCount = quizActivities.reduce(
    (sum, activity) => sum + (Array.isArray(activity?.questions) ? activity.questions.length : 0),
    0
  );
  const writingActivity = firstActivity(activities, 'writing');
  const speechActivity = firstActivity(activities, 'speech');

  const steps = useMemo(() => {
    const rows = [
      {
        key: 'layunin',
        title: 'Layunin',
        subtitle: 'Goal of the lesson',
        render: () => (
          <TextLessonCard
            title="Layunin"
            subtitle="What students should learn"
            paragraphs={previewParagraphs(lessonDraft.layunin)}
            emptyText="No Layunin added yet."
          />
        )
      },
      {
        key: 'alamin',
        title: 'Alamin',
        subtitle: 'Short topic guide',
        render: () => (
          <TextLessonCard
            title="Alamin"
            subtitle="What students need to know first"
            paragraphs={previewParagraphs(lessonDraft.alamin)}
            emptyText="No Alamin added yet."
          />
        )
      }
    ];

    if (materialInfo) {
      rows.push({
        key: 'material',
        title: 'Materyal',
        subtitle: 'Uploaded file',
        render: () => (
          <div className="teacher-student-preview-content-card">
            <div className="teacher-student-preview-card-kicker">Student material step</div>
            <h3>Materyal</h3>
            <div className="teacher-student-preview-material">
              <strong>{materialInfo.fileType || 'FILE'}</strong>
              <span>{materialInfo.fileName || 'Uploaded lesson material'}</span>
            </div>
            <p className="teacher-student-preview-muted">
              Students will open this material before continuing the lesson.
            </p>
          </div>
        )
      });
    }

    rows.push(
      {
        key: 'aralin',
        title: 'Lessons',
        subtitle: 'Main lesson content',
        render: () => (
          <TextLessonCard
            title="Lessons"
            subtitle="Student reading card"
            paragraphs={previewParagraphs(lessonDraft.aralin || lessonDraft.passage)}
            emptyText="No Lessons added yet."
          />
        )
      },
      {
        key: 'quiz',
        title: 'Quiz',
        subtitle: quizQuestionCount
          ? `${quizQuestionCount} question${quizQuestionCount === 1 ? '' : 's'} visible`
          : 'Not added yet',
        render: () => <QuizPreview activities={quizActivities} />
      },
      {
        key: 'gawain',
        title: 'Writing',
        subtitle: writingActivity ? 'Activity preview' : 'Not added yet',
        render: () => <GawainPreview activity={writingActivity} />
      },
      {
        key: 'bigkas',
        title: 'Speech',
        subtitle: speechActivity ? 'Speaking preview' : 'Not added yet',
        render: () => <BigkasPreview activity={speechActivity} />
      },
      {
        key: 'done',
        title: 'Tapos',
        subtitle: 'Completion screen',
        render: () => (
          <div className="teacher-student-preview-content-card">
            <div className="teacher-student-preview-card-kicker">Student completion step</div>
            <h3>Tapos</h3>
            <p className="teacher-student-preview-muted">
              In the real student view, students can complete the lesson after finishing the required activities.
            </p>
            <div className="teacher-student-preview-complete">
              Lesson ready for student completion.
            </div>
          </div>
        )
      }
    );

    return rows.map((step, index) => ({
      ...step,
      number: index + 1
    }));
  }, [lessonDraft, materialInfo, quizActivities, quizQuestionCount, writingActivity, speechActivity]);

  useEffect(() => {
    if (activeIndex > steps.length - 1) {
      setActiveIndex(Math.max(0, steps.length - 1));
    }
  }, [activeIndex, steps.length]);

  const activeStep = steps[activeIndex] || steps[0];

  return (
    <section className="teacher-side-card lms-live-preview builder-side-preview">
      <style>{`
        .teacher-student-preview-shell {
          display: grid;
          gap: 14px;
        }

        .teacher-student-preview-header {
          padding: 16px;
          border-radius: 22px;
          background: linear-gradient(135deg, #ecfdf5, #ffffff);
          border: 1px solid #dcefe2;
        }

        .teacher-student-preview-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .teacher-student-preview-badges span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #dcefe2;
          color: #315241;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .teacher-student-preview-title {
          color: #102a43;
          font-size: 1.25rem;
          font-weight: 950;
          line-height: 1.15;
        }

        .teacher-student-preview-subtitle {
          margin-top: 6px;
          color: #607466;
          font-size: 0.92rem;
          font-weight: 800;
          line-height: 1.4;
        }

        .teacher-student-preview-steps {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .teacher-student-preview-step {
          border: 1px solid #dcefe2;
          background: #ffffff;
          color: #315241;
          border-radius: 16px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 9px;
          text-align: left;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .teacher-student-preview-step:hover {
          transform: translateY(-1px);
          border-color: #86d4a6;
          background: #f0fdf4;
        }

        .teacher-student-preview-step.active {
          border-color: #009a57;
          background: #e9fcef;
          box-shadow: 0 10px 24px rgba(0, 154, 87, 0.12);
        }

        .teacher-student-preview-step-number {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #f0fdf4;
          color: #166534;
          display: grid;
          place-items: center;
          font-weight: 950;
          flex-shrink: 0;
        }

        .teacher-student-preview-step.active .teacher-student-preview-step-number {
          background: #009a57;
          color: #ffffff;
        }

        .teacher-student-preview-step strong {
          display: block;
          font-size: 0.88rem;
          line-height: 1.1;
        }

        .teacher-student-preview-step small {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 800;
          line-height: 1.1;
        }

        .teacher-student-preview-content-card {
          padding: 18px;
          border-radius: 24px;
          background: #ffffff;
          border: 1px solid #dcefe2;
          box-shadow: 0 12px 30px rgba(13, 71, 45, 0.06);
        }

        .teacher-student-preview-card-kicker {
          color: #009a57;
          font-size: 0.78rem;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }

        .teacher-student-preview-content-card h3 {
          margin: 0 0 10px;
          color: #102a43;
          font-size: 1.22rem;
          font-weight: 950;
        }

        .teacher-student-preview-reading {
          display: grid;
          gap: 10px;
        }

        .teacher-student-preview-reading p,
        .teacher-student-preview-muted {
          margin: 0;
          color: #315241;
          font-weight: 760;
          line-height: 1.58;
        }

        .teacher-student-preview-question,
        .teacher-student-preview-answer-box,
        .teacher-student-preview-speech-text {
          margin-top: 12px;
          padding: 14px;
          border-radius: 18px;
          background: #f8fcf9;
          border: 1px solid #dcefe2;
          color: #17324d;
          line-height: 1.5;
          font-weight: 850;
        }

        .teacher-student-preview-quiz-item {
          border-top: 1px solid #dcefe3;
          margin-top: 16px;
          padding-top: 16px;
        }

        .teacher-student-preview-quiz-item:first-child {
          border-top: 0;
          margin-top: 0;
          padding-top: 0;
        }

        .teacher-student-preview-question strong {
          display: block;
          color: #125334;
          font-size: 12px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .teacher-student-preview-question p {
          margin: 0;
        }

        .teacher-student-preview-options {
          display: grid;
          gap: 9px;
          margin-top: 12px;
        }

        .teacher-student-preview-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #dcefe2;
        }

        .teacher-student-preview-option span {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #f0fdf4;
          color: #166534;
          display: grid;
          place-items: center;
          font-weight: 950;
          flex-shrink: 0;
        }

        .teacher-student-preview-option p {
          margin: 0;
          color: #315241;
          font-weight: 820;
          line-height: 1.3;
        }

        .teacher-student-preview-word-bank {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .teacher-student-preview-word-bank span {
          padding: 8px 11px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #bbf7d0;
          font-weight: 900;
        }

        .teacher-student-preview-textarea {
          margin-top: 12px;
          min-height: 84px;
          padding: 14px;
          border-radius: 18px;
          border: 1px dashed #b7d8c3;
          color: #7b8b80;
          background: #fbfffd;
          font-weight: 800;
        }

        .teacher-student-preview-material {
          display: grid;
          gap: 6px;
          padding: 14px;
          border-radius: 18px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          margin-bottom: 10px;
        }

        .teacher-student-preview-material strong {
          font-size: 0.85rem;
          font-weight: 950;
        }

        .teacher-student-preview-material span {
          color: #315241;
          font-weight: 850;
          overflow-wrap: anywhere;
        }

        .teacher-student-preview-disabled-button {
          margin-top: 12px;
          width: 100%;
          border: 0;
          border-radius: 16px;
          padding: 12px 14px;
          background: #e2e8f0;
          color: #64748b;
          font-weight: 950;
          cursor: not-allowed;
        }

        .teacher-student-preview-complete {
          margin-top: 12px;
          padding: 14px;
          border-radius: 18px;
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #bbf7d0;
          font-weight: 950;
          text-align: center;
        }

        .teacher-student-preview-note {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 14px;
          background: #fff8df;
          border: 1px solid #f4e7aa;
          color: #6b4b00;
          font-size: 0.84rem;
          font-weight: 850;
          line-height: 1.4;
        }

        .teacher-student-preview-nav {
          display: flex;
          gap: 10px;
        }

        .teacher-student-preview-nav button {
          flex: 1;
          border: 0;
          border-radius: 16px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .teacher-student-preview-nav button:first-child {
          background: #f1f5f9;
          color: #315241;
        }

        .teacher-student-preview-nav button:last-child {
          background: linear-gradient(135deg, #009a57, #46b56d);
          color: #ffffff;
        }

        .teacher-student-preview-nav button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(13, 71, 45, 0.12);
        }

        .teacher-student-preview-nav button:disabled {
          opacity: 0.48;
          cursor: not-allowed;
        }
      `}</style>

      <div className="teacher-design-heading">
        <div className="teacher-design-step">PREVIEW</div>
        <div>
          <h2>Student Preview</h2>
          <p>This is how your lesson may appear to students before publishing.</p>
        </div>
      </div>

      <div className="teacher-student-preview-shell">
        <div className="teacher-student-preview-header">
          <div className="teacher-student-preview-badges">
            <span>{subjectMeta?.icon || 'Book'} {lessonDraft.subject || 'Subject'}</span>
            <span>Grade {lessonDraft.gradeLevel || '-'}</span>
            <span>{lessonDraft.xpReward || 0} XP</span>
            <span>Preview only</span>
          </div>

          <div className="teacher-student-preview-title">
            {lessonDraft.title || 'Untitled Lesson'}
          </div>
          <div className="teacher-student-preview-subtitle">
            Teacher preview only. Answers, XP, and student progress are not saved here.
          </div>
        </div>

        <div className="teacher-student-preview-steps">
          {steps.map((step, index) => (
            <StepCard
              key={step.key}
              step={step}
              isActive={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>

        {activeStep?.render()}

        <div className="teacher-student-preview-nav">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex(index => Math.max(0, index - 1))}
          >
            Back
          </button>
          <button
            type="button"
            disabled={activeIndex >= steps.length - 1}
            onClick={() => setActiveIndex(index => Math.min(steps.length - 1, index + 1))}
          >
            Next
          </button>
        </div>

        <div className="teacher-student-preview-note">
          Preview mode only. This does not submit answers, record progress, or award XP.
        </div>
      </div>
    </section>
  );
}
