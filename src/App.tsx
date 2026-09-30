import { FeedbackPage } from './modules/feedback/FeedbackPage';
import { FeedbackInboxPage } from './modules/feedback/FeedbackInboxPage';
import { rememberRoleTheme } from './utils/themePreview';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth.store';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute';
import { LoginPage } from './modules/auth/LoginPage';
import { RegisterPage } from './modules/auth/RegisterPage';
import { ForgotPasswordPage } from './modules/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './modules/auth/ResetPasswordPage';
import { ChangePasswordPage } from './modules/auth/ChangePasswordPage';
import { TermsPage, PrivacyPage } from './modules/auth/LegalPages';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { StudentsPage } from './modules/students/StudentsPage';
import { TeachersPage } from './modules/teachers/TeachersPage';
import { ParentsPage } from './modules/parents/ParentsPage';
import { RegistrationsPage } from './modules/registrations/RegistrationsPage';
import { AttendancePage } from './modules/attendance/AttendancePage';
import { ResultsPage } from './modules/academics/ResultsPage';
import { AcademicStructurePage } from './modules/academic/AcademicStructurePage';
import { CommunicationsPage } from './modules/communications/CommunicationsPage';
import { UsersPage } from './modules/admin/UsersPage';
import { AuditLogsPage } from './modules/admin/AuditLogsPage';
import { SystemPage } from './modules/system/SystemPage';
import { TimetablePage } from './modules/timetable/TimetablePage';
import { FinancePage } from './modules/finance/FinancePage';
import { MyClassesPage } from './modules/teachers/MyClassesPage';
import { MyStudentsPage } from './modules/teachers/MyStudentsPage';
import { MyChildrenPage } from './modules/parent/MyChildrenPage';
import { ChildAttendancePage } from './modules/parent/ChildAttendancePage';
import { ChildResultsPage } from './modules/parent/ChildResultsPage';
import { ChildReportCardsPage } from './modules/parent/ChildReportCardsPage';
import { ParentFeesPage } from './modules/parent/ParentFeesPage';
import { PromotionsPage } from './modules/promotions/PromotionsPage';
import { MyAccountPage } from './modules/account/MyAccountPage';




function ThemeSync() {
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    const root = document.documentElement;
    if (user?.role) {
      root.setAttribute('data-role', user.role);
      rememberRoleTheme(user.email, user.role);
      if (user.username) rememberRoleTheme(user.username, user.role);
    } else {
      root.removeAttribute('data-role');
    }
  }, [user]);
  return null;
}


export function App() {
  return (
        <BrowserRouter>
      <ThemeSync />
    
      <Routes>
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        </Route>
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/students" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><StudentsPage /></RoleRoute>} />
          <Route path="/teachers" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><TeachersPage /></RoleRoute>} />
          <Route path="/parents" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><ParentsPage /></RoleRoute>} />
          <Route path="/registrations" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><RegistrationsPage /></RoleRoute>} />
          <Route path="/classes" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><AcademicStructurePage /></RoleRoute>} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/my-classes" element={<RoleRoute roles={['TEACHER']}><MyClassesPage /></RoleRoute>} />
          <Route path="/my-students" element={<RoleRoute roles={['TEACHER']}><MyStudentsPage /></RoleRoute>} />
          <Route path="/academics" element={<ResultsPage />} />
          <Route path="/communications" element={<CommunicationsPage />} />
          <Route path="/announcements" element={<CommunicationsPage />} />
          <Route path="/news" element={<CommunicationsPage />} />
          <Route path="/account" element={<MyAccountPage />} />
          <Route path="/children" element={<RoleRoute roles={['PARENT']}><MyChildrenPage /></RoleRoute>} />
          <Route path="/child/attendance" element={<RoleRoute roles={['PARENT']}><ChildAttendancePage /></RoleRoute>} />
          <Route path="/child/results" element={<RoleRoute roles={['PARENT']}><ChildResultsPage /></RoleRoute>} />
          <Route path="/child/report-cards" element={<RoleRoute roles={['PARENT']}><ChildReportCardsPage /></RoleRoute>} />
          <Route path="/fees" element={<RoleRoute roles={['PARENT']}><ParentFeesPage /></RoleRoute>} />
          <Route path="/feedback" element={<RoleRoute roles={['TEACHER', 'PARENT']}><FeedbackPage /></RoleRoute>} />
          <Route path="/feedback-inbox" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><FeedbackInboxPage /></RoleRoute>} />
          <Route path="/report-cards" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}><ResultsPage initialTab="Report Card" /></RoleRoute>} />
          <Route path="/finance" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><FinancePage /></RoleRoute>} />
          <Route path="/timetable" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}><TimetablePage /></RoleRoute>} />
          <Route path="/users" element={<RoleRoute roles={['SUPER_ADMIN']}><UsersPage /></RoleRoute>} />
          <Route path="/promotions" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><PromotionsPage /></RoleRoute>} />
          <Route path="/audit" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><AuditLogsPage /></RoleRoute>} />
          <Route path="/system" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><SystemPage /></RoleRoute>} />
          <Route path="/settings" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><SystemPage /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}