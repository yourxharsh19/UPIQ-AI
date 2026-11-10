import { Navigate, Outlet } from "react-router-dom";
import { getInitialAuthState } from "../utils/authUtils.js";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = () => {
    const authContext = useAuth();
    const loading = authContext?.loading ?? false;

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const isAuthenticated = getInitialAuthState();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
