export default function TeacherQuizOverview({
  quizPerformance = {},
  selectedQuiz = null,
  onSelectQuiz = () => {}
}) {
  const rows = Array.isArray(quizPerformance.rows)
    ? quizPerformance.rows
    : [];

  const assessments = [
    {
      quizId: "ALL",
      quizTitle: "All"
    },
    ...Array.from(
      new Map(
        rows.map(row => [
          row.quizId,
          {
            quizId: row.quizId,
            quizTitle: row.quizTitle || "Untitled Assessment"
          }
        ])
      ).values()
    )
  ];

  return (
    <div
      className="teacher-workspace-card"
      style={{
        margin: "18px 0",
        boxShadow: "none",
        background: "#fbfffd"
      }}
    >
      <div
        className="teacher-workspace-heading"
        style={{ marginBottom: 16 }}
      >
        <div>
          <div className="lms-section-label">
            Assessment Filter
          </div>

          <h2>Filter Assessment Results</h2>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12
        }}
      >
        {assessments.map(item => {
          const active =
            (selectedQuiz ?? "ALL") === item.quizId;

          return (
            <button
              key={item.quizId}
              type="button"
              className={
                active
                  ? "lms-report-button"
                  : "quiz-secondary"
              }
              onClick={() =>
                onSelectQuiz(item.quizId)
              }
            >
              {item.quizId === "ALL"
                ? "🌎 All"
                : item.quizTitle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
