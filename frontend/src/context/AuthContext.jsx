import { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    setUser({ token });
                }
            } catch {
                // Ignore localStorage errors
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post("/auth/login", { email, password });

            if (response.data && response.data.data && response.data.data.token) {
                const token = response.data.data.token;
                localStorage.setItem("token", token);
                setUser({ token });
                return true;
            } else {
                throw new Error("Invalid response structure from login API");
            }
        } catch (error) {
            console.error("AuthContext: Login request failed:", error.userFriendlyMessage || error.message);
            throw error;
        }
    };

    const logout = () => {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("upiq_auth");
        } catch {
            // Ignore localStorage errors
        }
        setUser(null);
        if (typeof window !== "undefined" && window.location && window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
    };

    const setUserFromToken = (token) => {
        if (token) {
            try {
                localStorage.setItem("token", token);
            } catch {
                // Ignore localStorage errors
            }
            setUser({ token });
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, setUserFromToken }}>
            {children}
        </AuthContext.Provider>
    );
};
