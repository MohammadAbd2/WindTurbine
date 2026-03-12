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
        let isMounted = true;

        const checkToken = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                const validUser = await AuthService.validateToken(token);
                if (isMounted) {
                    if (validUser) {
                        setUser(validUser);
                    } else {
                        localStorage.removeItem("token");
                    }
                    setIsLoading(false);
                }
            } else if (isMounted) {
                setIsLoading(false);
            }
        };

        checkToken();

        return () => {
            isMounted = false;
        };
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}