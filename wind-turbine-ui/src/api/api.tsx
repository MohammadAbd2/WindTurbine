import axios from "axios";

// This looks for an environment variable, otherwise falls back to local
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5199/api";

const API = axios.create({
    baseURL: BASE_URL,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
