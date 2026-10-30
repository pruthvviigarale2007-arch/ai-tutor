// ====================================================================
// LearnMate AI - Main Router & Protected Application Hierarchy
// ====================================================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ChatbotWidget } from './components/chatbot/ChatbotWidget';

// Pages
import { MainChatbotApp } from './pages/MainChatbotApp';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TutorPage } from './pages/TutorPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { ConversationHistoryPage } from './pages/ConversationHistoryPage';
import { LearningPathsPage } from './pages/LearningPathsPage';
import { LearningPathDetailPage } from './pages/LearningPathDetailPage';
import { LessonReaderPage } from './pages/LessonReaderPage';
import { QuizSetupPage } from './pages/QuizSetupPage';
import { QuizTakerPage } from './pages/QuizTakerPage';
import { QuizResultsPage } from './pages/QuizResultsPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-semibold">
        Verifying student session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but hasn't completed onboarding, redirect to onboarding wizard
  if (profile && !profile.is_onboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

// Public Route Guard (Redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Standalone AI Tutor Chatbot as the Primary App Experience */}
          <Route path="/" element={<MainChatbotApp />} />
          <Route path="/chat" element={<MainChatbotApp />} />
          <Route path="/chatbot" element={<MainChatbotApp />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/about" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          {/* Onboarding Wizard */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Authenticated Application Pages (Wrapped in AppLayout) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* AI Tutor Chat & History */}
          <Route
            path="/tutor"
            element={
              <ProtectedRoute>
                <TutorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor/:id"
            element={
              <ProtectedRoute>
                <TutorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor/history"
            element={
              <ProtectedRoute>
                <ConversationHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Learning Paths & Roadmaps */}
          <Route
            path="/learning-paths"
            element={
              <ProtectedRoute>
                <LearningPathsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learning-paths/:id"
            element={
              <ProtectedRoute>
                <LearningPathDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Lesson Reader */}
          <Route
            path="/lessons/:id"
            element={
              <ProtectedRoute>
                <LessonReaderPage />
              </ProtectedRoute>
            }
          />

          {/* Quizzes & Practice */}
          <Route
            path="/quizzes"
            element={
              <ProtectedRoute>
                <QuizSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes/:id"
            element={
              <ProtectedRoute>
                <QuizTakerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes/:id/results"
            element={
              <ProtectedRoute>
                <QuizResultsPage />
              </ProtectedRoute>
            }
          />

          {/* Study Materials Library & RAG Grounding */}
          <Route
            path="/materials"
            element={
              <ProtectedRoute>
                <StudyMaterialsPage />
              </ProtectedRoute>
            }
          />

          {/* Active Recall Flashcards (SM-2) */}
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute>
                <FlashcardsPage />
              </ProtectedRoute>
            }
          />

          {/* Study Planner & Timetable */}
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <StudyPlannerPage />
              </ProtectedRoute>
            }
          />

          {/* Progress Analytics & Mastery */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Profile & Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Global Floating AI Tutor Chatbot Widget on Every Page */}
        <ChatbotWidget />
      </Router>
    </AuthProvider>
  );
};

export default App;
