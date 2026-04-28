import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSkillStore } from "../store/skillStore";
import {
  generateAssessment,
  determineLevel,
} from "../services/ai";
import type { AssessmentQuestion } from "../types/skill";

export default function AssessPage() {
  const { skillName, setLevel } = useSkillStore();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Если нет скилла — вернуться на главную
  useEffect(() => {
    if (!skillName) {
      navigate("/");
      return;
    }
    // Загружаем вопросы
    generateAssessment(skillName).then((q) => {
      setQuestions(q);
      setLoading(false);
    });
  }, [skillName, navigate]);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      // Следующий вопрос
      setCurrentQ(currentQ + 1);
    } else {
      // Все вопросы отвечены — определяем уровень
      const level = determineLevel(newAnswers);
      setLevel(level);
      navigate("/learn");
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Готовим вопросы для «{skillName}»...</p>
      </div>
    );
  }

  const question = questions[currentQ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Прогресс */}
        <div style={styles.progress}>
          {currentQ + 1} / {questions.length}
        </div>

        {/* Вопрос */}
        <h2 style={styles.question}>{question.question}</h2>

        {/* Варианты ответа */}
        <div style={styles.options}>
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              style={styles.optionBtn}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    padding: 24,
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: "40px 36px",
    maxWidth: 500,
    width: "100%",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  progress: {
    fontSize: 14,
    color: "#999",
    marginBottom: 24,
  },
  question: {
    fontSize: 22,
    fontWeight: 600,
    margin: "0 0 28px",
    lineHeight: 1.4,
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  optionBtn: {
    background: "#f8f8f8",
    border: "2px solid #e8e8e8",
    borderRadius: 12,
    padding: "14px 20px",
    fontSize: 15,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
  },
};
