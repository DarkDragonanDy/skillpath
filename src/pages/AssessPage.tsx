/**
 * SkillPath — Assessment Page
 * Written collaboratively by Andrej and Claude
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSkillStore } from "../store/skillStore";
import { generateAssessment, analyzeAssessmentAnswers } from "../services/ai";
import type { AssessmentQuestion } from "../types/skill";

export default function AssessPage() {
  const { skillName, setLevel, setStudentProfile } = useSkillStore();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!skillName) {
      navigate("/");
      return;
    }
    generateAssessment(skillName).then((q) => {
      setQuestions(q);
      setLoading(false);
    });
  }, [skillName, navigate]);

  const handleAnswer = async (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setAnalyzing(true);
      const profile = await analyzeAssessmentAnswers(skillName, questions, newAnswers);
      setStudentProfile(profile);
      setLevel(profile.level);
      navigate("/learn");
    }
  };

  const progress = questions.length > 0
    ? ((currentQ + 1) / questions.length) * 100
    : 0;

  if (loading || analyzing) {
    return (
      <div className="assess-container">
        <p className="assess-loading">
          {analyzing ? `Analyzing your profile for "${skillName}"...` : `Preparing questions for "${skillName}"...`}
        </p>
      </div>
    );
  }

  const question = questions[currentQ];

  return (
    <div className="assess-container">
      <div className="assess-content">
        {/* Progress bar */}
        <div className="assess-progress-wrap">
          <div className="assess-progress-bar">
            <div className="assess-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="assess-progress-text">
            Question {currentQ + 1} of {questions.length}
          </span>
        </div>

        {/* Card */}
        <div className="assess-card">
          <h1 className="assess-skill-title">{skillName}</h1>
          <p className="assess-subtitle">Determining your level</p>

          <h2 className="assess-question">{question.question}</h2>

          <div className="assess-options">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="assess-option-btn"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
