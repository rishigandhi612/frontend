// src/apiClient.js

import axios from 'axios';
import store from './index'; 

// Create an Axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:3001', // Set your base URL
  timeout: 5000, // Optional timeout setting
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
    return Promise.reject(error);
  }
);

// Add a response interceptor to refresh the token if needed
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Call the Vuex action to refresh the token
        const newToken = await store.dispatch('refreshToken');
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
