import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="overline">Chargement…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}
