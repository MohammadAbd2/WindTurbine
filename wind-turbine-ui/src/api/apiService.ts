import axios from "axios";

const API_BASE_URL = "http://localhost:5199";

// 1. إنشاء نسخة axios مع إعدادات الأمان الأساسية
export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // للسماح بتبادل بيانات الهوية إذا لزم الأمر
});

// 2. إعداد الـ Interceptor لإضافة التوكين تلقائياً في كل طلب
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            // إضافة التوكين في الهيدر ليتعرف عليه الـ [Authorize] في C#
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. تعريف الخدمات (الطلبات العادية)
export const ApiService = {
    // جلب كل التوربينات
    getTurbines: async () => {
        const response = await api.get("/api/turbines");
        return response.data;
    },

    // جلب تنبيهات توربين معين من قاعدة البيانات
    getAlerts: async (turbineId: string) => {
        const response = await api.get(`/api/turbines/${turbineId}/alerts`);
        return response.data;
    },

    // جلب آخر المقاييس (للرسم البياني)
    getMetrics: async (turbineId: string, limit: number = 20) => {
        const response = await api.get(`/api/metrics/${turbineId}?limit=${limit}`);
        return response.data;
    }
};

// 4. إعداد الـ SSE لاستقبال البيانات الحية (مع دعم التوكين)
export const getSSEConnection = (endpoint: string) => {
    const token = localStorage.getItem("token");

    // بما أن EventSource لا يدعم Headers، نقوم بتمرير التوكين في الرابط
    // ستحتاج لإعداد الباكيند ليقرأ "access_token" من الرابط في الـ SSE
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${API_BASE_URL}${endpoint}${token ? `${separator}access_token=${token}` : ""}`;

    return new EventSource(url);
};