import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PrincipalDashboardPage from './pages/PrincipalDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeachersManagementPage from './pages/TeachersManagementPage';
import ClassesManagementPage from './pages/ClassesManagementPage';
import StudentManagementPage from './pages/StudentManagementPage';
import FeeEntryPage from './pages/FeeEntryPage';
import ReportsPage from './pages/ReportsPage';
import SetupWizardPage from './pages/SetupWizardPage';

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup" element={<SetupWizardPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route
                  path="principal"
                  element={
                    <ProtectedRoute roles={['principal']}>
                      <PrincipalDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="teacher"
                  element={
                    <ProtectedRoute roles={['teacher']}>
                      <TeacherDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="teachers"
                  element={
                    <ProtectedRoute roles={['principal']}>
                      <TeachersManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="classes"
                  element={
                    <ProtectedRoute roles={['principal']}>
                      <ClassesManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="students"
                  element={
                    <ProtectedRoute roles={['teacher']}>
                      <StudentManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="fees"
                  element={
                    <ProtectedRoute roles={['teacher']}>
                      <FeeEntryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute roles={['teacher', 'principal']}>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={<Navigate to={user?.role === 'principal' ? '/principal' : '/teacher'} replace />}
                />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
