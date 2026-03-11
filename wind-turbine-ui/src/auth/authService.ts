export interface User {
    username: string;
    role: "Operator";
    token: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock credentials (replace with real API later)
const MOCK_USERS = [
    { username: "operator", password: "operator123", role: "Operator" as const },
];

export const AuthService = {
    async login(credentials: LoginCredentials): Promise<User> {
        await delay(500); // Simulate network

        const user = MOCK_USERS.find(
            (u) => u.username === credentials.username && u.password === credentials.password
        );

        if (!user) {
            throw new Error("Invalid username or password");
        }

        const token = `mock-jwt-token-${Date.now()}`; // Fake token
        
        return {
            username: user.username,
            role: user.role,
            token,
        };
    },

    async logout(): Promise<void> {
        await delay(200);
        // In real app: call backend to invalidate token
    },

    // Check if stored token is valid
    async validateToken(token: string): Promise<User | null> {
        await delay(200);
        
        // Mock validation - in real app, verify with backend
        if (token.startsWith("mock-jwt-token-")) {
            return { username: "operator", role: "Operator", token };
        }
        return null;
    },
};