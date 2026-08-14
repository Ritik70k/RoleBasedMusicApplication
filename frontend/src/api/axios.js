import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:3000/api";

const api = axios.create({
    baseURL,
    withCredentials: true
});

export default api;
