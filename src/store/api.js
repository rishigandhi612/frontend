import axios from 'axios';
import store from './store';  // Import the Vuex store

const api = axios.create({
  baseURL: 'http://localhost:3001', // Your API base URL
});

// Add request interceptor to include token in the headers
api.interceptors.request.use(config => {
  const token = store.state.token || localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(response => {
  return response;
}, async error => {
  const originalRequest = error.config;

  if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    
    try {
      const newToken = await store.dispatch('refreshToken');  // Dispatch refresh token action
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return api(originalRequest);  // Retry the original request with the new token
    } catch (refreshError) {
      store.dispatch('logoutUser');  // Logout if token refresh fails
      return Promise.reject(refreshError);
    }
  }
  
  return Promise.reject(error);
});

export default api;
