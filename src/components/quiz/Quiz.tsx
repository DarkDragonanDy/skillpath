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
            // Quiz finished
            const score = Math.round(
                ((correctCount + (selected === question.correctIndex ? 1 : 0)) /
                    questions.length) *
                100
            );
            setFinished(true);
            onComplete(score);
        }
    };

    if (finished) {
        const finalScore = Math.round(
            ((correctCount + (selected === question.correctIndex ? 1 : 0)) /
                questions.length) *
            100
        );
        return (
            <div style={styles.container}>
                <div style={styles.finishedCard}>
          <span style={styles.finishedEmoji}>
            {finalScore >= 80 ? "🎉" : finalScore >= 50 ? "👍" : "📚"}
          </span>
                    <h3 style={styles.finishedTitle}>Quiz Complete!</h3>
                    <p style={styles.finishedScore}>
                        Your score: <strong>{finalScore}%</strong>
                    </p>
                    <p style={styles.finishedHint}>
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
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.label}>📝 Lesson Quiz</span>
                <span style={styles.progress}>
          {currentQ + 1} / {questions.length}
        </span>
            </div>

            <h3 style={styles.question}>{question.question}</h3>

            <div style={styles.options}>
                {question.options.map((option, i) => {
                    let bg = "#f8f8f8";
                    let border = "2px solid #e8e8e8";
                    if (showResult) {
                        if (i === question.correctIndex) {
                            bg = "#e6f4ea";
                            border = "2px solid #34a853";
                        } else if (i === selected && i !== question.correctIndex) {
                            bg = "#fce8e6";
                            border = "2px solid #ea4335";
                        }
                    } else if (i === selected) {
                        bg = "#e8f0fe";
                        border = "2px solid #4285f4";
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(i)}
                            style={{ ...styles.optionBtn, background: bg, border }}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

            {showResult && (
                <div style={styles.explanation}>
                    <p style={styles.explanationText}>
                        {selected === question.correctIndex ? "✅ Correct! " : "❌ Incorrect. "}
                        {question.explanation}
                    </p>
                    <button onClick={handleNext} style={styles.nextBtn}>
                        {currentQ < questions.length - 1 ? "Next Question →" : "See Results"}
                    </button>
                </div>
            )}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        background: "#f0f4ff",
        borderRadius: 12,
        padding: "24px 28px",
        marginBottom: 32,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 600,
        color: "#4285f4",
    },
    progress: {
        fontSize: 13,
        color: "#999",
    },
    question: {
        fontSize: 18,
        fontWeight: 600,
        margin: "0 0 20px",
        lineHeight: 1.4,
    },
    options: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    optionBtn: {
        borderRadius: 10,
        padding: "12px 16px",
        fontSize: 15,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
    },
    explanation: {
        marginTop: 20,
        paddingTop: 16,
        borderTop: "1px solid #d0d8e8",
    },
    explanationText: {
        fontSize: 14,
        lineHeight: 1.5,
        color: "#333",
        margin: "0 0 16px",
    },
    nextBtn: {
        background: "#4285f4",
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "10px 24px",
        fontSize: 14,
        cursor: "pointer",
        fontWeight: 500,
    },
    finishedCard: {
        textAlign: "center",
        padding: "12px 0",
    },
    finishedEmoji: {
        fontSize: 48,
    },
    finishedTitle: {
        fontSize: 22,
        margin: "12px 0 8px",
    },
    finishedScore: {
        fontSize: 18,
        margin: "0 0 8px",
    },
    finishedHint: {
        fontSize: 14,
        color: "#666",
        margin: 0,
    },
};