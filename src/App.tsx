import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeSelector } from "./components/ThemeSelector";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AssessPage from "./pages/AssessPage";
import LearningPage from "./pages/LearningPage";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="learning-loading-wrap">
        <div className="learning-loading-card">
          <div className="learning-spinner" />
          <p className="learning-loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/assess" element={<AssessPage />} />
            <Route path="/learn" element={<LearningPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemeSelector />
      <AppRoutes />
    </ThemeProvider>
  );
}
