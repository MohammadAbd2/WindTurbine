import { api } from "../api/apiService";

export interface User {
    username: string;
    token: string;
}

export const AuthService = {
    login: async (credentials: { username: string; password: string }): Promise<User> => {
        const response = await api.post("/api/auth/login", {
            username: credentials.username,
            password: credentials.password
        });

        return {
            username: credentials.username,
            token: response.data.token
        };
    },

    validateToken: async (token: string): Promise<User | null> => {
        try {
            return { username: "admin", token };
        } catch {
            return null;
        }
    },

    logout: async () => {
        localStorage.removeItem("token");
    }
};
