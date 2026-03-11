import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { AuthService, type User } from "./authService";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            AuthService.validateToken(token)
                .then((validUser) => {
                    if (validUser) {
                        setUser(validUser);
                    } else {
                        localStorage.removeItem("token");
                    }
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (username: string, password: string) => {
        const loggedInUser = await AuthService.login({ username, password });
        localStorage.setItem("token", loggedInUser.token);
        setUser(loggedInUser);
    };

    const logout = async () => {
        await AuthService.logout();
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}