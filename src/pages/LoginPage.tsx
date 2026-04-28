import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎯 SkillLearn</h1>
        <p style={styles.subtitle}>
          Изучай любой навык с персональным AI-наставником
        </p>
        <button onClick={login} style={styles.button}>
          Войти через Google
        </button>
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
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: "48px 40px",
    textAlign: "center",
    maxWidth: 400,
    width: "100%",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 32,
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    margin: "0 0 32px",
  },
  button: {
    background: "#4285f4",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "12px 32px",
    fontSize: 16,
    cursor: "pointer",
    width: "100%",
  },
};
