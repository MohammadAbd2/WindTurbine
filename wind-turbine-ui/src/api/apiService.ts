import axios from "axios";

const API_BASE_URL = "http://localhost:5199"; // تأكد من أنه نفس بورت الباكيند

const api = axios.create({
    baseURL: API_BASE_URL,
});

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

// إعداد الـ SSE لاستقبال البيانات الحية
export const getSSEConnection = (endpoint: string) => {
    return new EventSource(`${API_BASE_URL}${endpoint}`);
};