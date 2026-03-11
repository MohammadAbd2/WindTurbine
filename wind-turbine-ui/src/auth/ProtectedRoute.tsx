import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{ padding: "40px", textAlign: "center" }}>
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace={true} />;
    }

    return <>{children}</>;
}