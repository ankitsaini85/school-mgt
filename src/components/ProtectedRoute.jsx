import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function ProtectedRoute({ children, roles }) {
  const { user, token } = useSelector((state) => state.auth);

  if (!user || !token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;
