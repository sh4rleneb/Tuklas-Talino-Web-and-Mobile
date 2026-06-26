import { useState } from 'react';

const quizExample = `Question 1:
Ano ang pangunahing ideya ng kwento?

A. Mahalaga ang pagtutulungan at pagpapahalaga sa pamayanan.
B. Mahirap magbasa ng lumang aklat.
C. Mas masarap mamili sa palengke.
D. Dapat iwasan ang lumang lugar.

Answer: A

Question 2:
Bakit mahalaga ang lumang mapa sa kwento?

A. Ipinakita nito ang mahahalagang lugar at kwento ng pamayanan.
B. Ginamit ito ni Lira upang maglaro.
C. Itinapon ito ng guro.
D. Wala itong kinalaman sa kwento.

Answer: A`;

function makeId(prefix = 'quiz') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeLine(line = '') {
  return String(line || '').trim();
}

function parseQuizText(rawText = '') {
  const lines = String(rawText || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(normalizeLine);

  const questions = [];
  let current = null;
  let lastChoice = null;

  function pushCurrent() {
    if (!current) return;

    const questionText = normalizeLine(current.question);
    const choices = (current.choices || []).filter(choice => normalizeLine(choice.text));

    if (!questionText || choices.length < 2) {
      current = null;
      lastChoice = null;
      return;
    }

    const answerLetter = String(current.answerLetter || '').toUpperCase();
    const hasCorrect = choices.some(choice => choice.letter === answerLetter);

    questions.push({
      id: makeId('question'),
      question: questionText,
      options: choices.map((choice, index) => ({
        id: makeId('option'),
        text: normalizeLine(choice.text),
        isCorrect: hasCorrect ? choice.letter === answerLetter : index === 0
      }))
    });

    current = null;
    lastChoice = null;
  }

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);

    if (!line) {
      continue;
    }

    const questionMatch =
      line.match(/^(?:question|q)\s*\d*\s*[:.)-]?\s*(.*)$/i) ||
      line.match(/^(\d+)[.)]\s+(.+)$/);

    if (questionMatch) {
      pushCurrent();

      current = {
        question: normalizeLine(questionMatch[2] || questionMatch[1] || ''),
        choices: [],
        answerLetter: ''
      };
      lastChoice = null;
      continue;
    }

    const choiceMatch = line.match(/^([A-D])\s*[.)]\s*(.+)$/i);

    if (choiceMatch && current) {
      const choice = {
        letter: choiceMatch[1].toUpperCase(),
        text: normalizeLine(choiceMatch[2])
      };

      current.choices.push(choice);
      lastChoice = choice;
      continue;
    }

    const answerMatch = line.match(/^(?:answer|correct answer|correct|sagot)\s*[:.)-]?\s*([A-D])\b/i);

    if (answerMatch && current) {
      current.answerLetter = answerMatch[1].toUpperCase();
      continue;
    }

    if (current) {
      if (!current.choices.length) {
        current.question = normalizeLine(`${current.question} ${line}`);
      } else if (lastChoice) {
        lastChoice.text = normalizeLine(`${lastChoice.text} ${line}`);
      }
    }
  }

  pushCurrent();

  return questions;
}

export default function TeacherQuizTextImporter({
  onImportQuestions,
  currentQuestionCount = 0
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawQuizText, setRawQuizText] = useState('');
  const [status, setStatus] = useState('');

  function handleImport() {
    const parsedQuestions = parseQuizText(rawQuizText);

    if (!parsedQuestions.length) {
      setStatus('No valid quiz questions found. Please follow the example format.');
      return;
    }

    const confirmed = window.confirm(
      `Import ${parsedQuestions.length} question${parsedQuestions.length === 1 ? '' : 's'}? This will replace the current ${currentQuestionCount || 0} quiz question${currentQuestionCount === 1 ? '' : 's'} in this block.`
    );

    if (!confirmed) return;

    onImportQuestions(parsedQuestions);
    setStatus(`${parsedQuestions.length} question${parsedQuestions.length === 1 ? '' : 's'} imported successfully.`);
    setIsOpen(false);
  }

  return (
    <div className="teacher-quiz-importer">
      <style>{`
        .teacher-quiz-importer {
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 18px;
          background: #f8fcf9;
          border: 1px solid #dcefe2;
          margin-bottom: 14px;
        }

        .teacher-quiz-importer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .teacher-quiz-importer-title {
          display: grid;
          gap: 3px;
        }

        .teacher-quiz-importer-title strong {
          color: #17324d;
          font-size: 1rem;
          font-weight: 950;
        }

        .teacher-quiz-importer-title small {
          color: #64748b;
          font-weight: 800;
          line-height: 1.35;
        }

        .teacher-quiz-importer-toggle,
        .teacher-quiz-importer-action {
          border: 0;
          border-radius: 14px;
          padding: 10px 13px;
          font-weight: 950;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .teacher-quiz-importer-toggle {
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .teacher-quiz-importer-toggle:hover,
        .teacher-quiz-importer-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(13, 71, 45, 0.10);
        }

        .teacher-quiz-importer-body {
          display: grid;
          gap: 10px;
        }

        .teacher-quiz-importer-body textarea {
          width: 100%;
          min-height: 260px;
          resize: vertical;
          border-radius: 16px;
          border: 1px solid #dcefe2;
          background: #ffffff;
          color: #17324d;
          font-size: 0.94rem;
          line-height: 1.5;
          font-weight: 760;
          padding: 14px 16px;
          outline: none;
        }

        .teacher-quiz-importer-body textarea:focus {
          border-color: #009a57;
          box-shadow: 0 0 0 4px rgba(0, 154, 87, 0.10);
        }

        .teacher-quiz-importer-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .teacher-quiz-importer-action.primary {
          background: linear-gradient(135deg, #009a57, #46b56d);
          color: #ffffff;
        }

        .teacher-quiz-importer-action.secondary {
          background: #ffffff;
          color: #315241;
          border: 1px solid #dcefe2;
        }

        .teacher-quiz-importer-status {
          padding: 10px 12px;
          border-radius: 14px;
          background: #fff8df;
          border: 1px solid #f4e7aa;
          color: #6b4b00;
          font-weight: 850;
          line-height: 1.4;
        }
      `}</style>

      <div className="teacher-quiz-importer-top">
        <div className="teacher-quiz-importer-title">
          <strong>Import Quiz from Text</strong>
          <small>Paste formatted questions and answers to auto-fill this Quiz block.</small>
        </div>

        <button
          type="button"
          className="teacher-quiz-importer-toggle"
          onClick={() => setIsOpen(value => !value)}
        >
          {isOpen ? 'Hide Importer' : 'Paste Quiz Text'}
        </button>
      </div>

      {isOpen && (
        <div className="teacher-quiz-importer-body">
          <textarea
            value={rawQuizText}
            onChange={(e) => {
              setRawQuizText(e.target.value);
              setStatus('');
            }}
            placeholder={quizExample}
          />

          <div className="teacher-quiz-importer-actions">
            <button
              type="button"
              className="teacher-quiz-importer-action primary"
              onClick={handleImport}
            >
              Import Quiz Questions
            </button>

            <button
              type="button"
              className="teacher-quiz-importer-action secondary"
              onClick={() => {
                setRawQuizText('');
                setStatus('');
              }}
            >
              Clear Text
            </button>
          </div>
        </div>
      )}

      {status && (
        <div className="teacher-quiz-importer-status">
          {status}
        </div>
      )}
    </div>
  );
}
