import { api } from "../api/apiService";

export interface User {
    username: string;
    token: string;
}

export const AuthService = {
    login: async (credentials: { username: string; password: string }): Promise<User> => {
        // نرسل الطلب إلى المسار الصحيح المكتوب في الـ Controller
        const response = await api.post("/api/auth/login", {
            username: credentials.username,
            password: credentials.password
        });

        // الباكيند يعيد { token: "..." }
        // سنقوم بدمج اسم المستخدم مع التوكين لنحافظ على هيكل الـ User في الفرونت
        return {
            username: credentials.username,
            token: response.data.token
        };
    },

    validateToken: async (token: string): Promise<User | null> => {
        try {
            // ملاحظة: الـ AuthController الحالي لا يحتوي على GetMe أو Validate.
            // يمكنك حالياً إرجاع كائن المستخدم طالما التوكين موجود محلياً
            // أو إضافة ميثود [Authorize] في الباكيند للتحقق.
            return { username: "admin", token };
        } catch {
            return null;
        }
    },

    logout: async () => {
        // مسح محلي فقط لأن الـ JWT عديم الحالة (Stateless)
        localStorage.removeItem("token");
    }
};