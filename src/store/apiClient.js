// src/apiClient.js

import axios from 'axios';
import store from './index'; // Import the Vuex store

// Create an Axios instance
const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3001', // Set base URL with fallback
});

// Add a request interceptor to include the token
apiClient.interceptors.request.use(
  (config) => {
    const token = store.state.token || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach the token to all requests
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error); // Log request errors
    return Promise.reject(error);
  }
);

// Add a response interceptor to refresh the token if needed
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await store.dispatch('refreshToken'); // Refresh the token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest); // Retry the original request with new token
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        store.dispatch('logoutUser'); // Logout if the refresh token fails
        return Promise.reject(refreshError);
      }
    }

    // Log other response errors
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
