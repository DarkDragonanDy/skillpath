import { useState } from "react";
import type { QuizQuestion } from "../../types/skill";

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[currentQ];

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
    if (index === question.correctIndex) {
      setCorrectCount(correctCount + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      const lastCorrect = selected === question.correctIndex ? 1 : 0;
      const score = Math.round(((correctCount + lastCorrect) / questions.length) * 100);
      setFinished(true);
      onComplete(score);
    }
  };

  if (finished) {
    const lastCorrect = selected === question.correctIndex ? 1 : 0;
    const finalScore = Math.round(((correctCount + lastCorrect) / questions.length) * 100);
    return (
      <div className="quiz-container">
        <div className="quiz-finished">
          <div className="quiz-finished-emoji">
            {finalScore >= 80 ? "🎉" : finalScore >= 50 ? "👍" : "📚"}
          </div>
          <h3 className="quiz-finished-title">Quiz Complete!</h3>
          <p className="quiz-finished-score">
            Your score: <strong>{finalScore}%</strong>
          </p>
          <p className="quiz-finished-hint">
            {finalScore >= 80
              ? "Excellent! You've mastered this lesson."
              : finalScore >= 50
              ? "Good job! Review the material to improve."
              : "Keep studying — you'll get there!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="quiz-label">📝 Lesson Quiz</span>
        <span className="quiz-counter">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      <h3 className="quiz-question-text">{question.question}</h3>

      <div className="quiz-options">
        {question.options.map((option, i) => {
          let extraClass = "";
          if (showResult) {
            if (i === question.correctIndex) extraClass = "correct";
            else if (i === selected) extraClass = "wrong";
          } else if (i === selected) {
            extraClass = "selected-opt";
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`quiz-option-btn ${extraClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="quiz-explanation">
          <p className="quiz-explanation-text">
            {selected === question.correctIndex ? "✅ Correct! " : "❌ Incorrect. "}
            {question.explanation}
          </p>
          <button onClick={handleNext} className="quiz-next-btn">
            {currentQ < questions.length - 1 ? "Next Question →" : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}
