import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import dashboard from './dashboard'; 
import customers from './customers';
import products from './products';
import invoices from './invoice';

Vue.use(Vuex);

// Create and export the Vuex store with modules
export default new Vuex.Store({
  modules: {
    dashboard, // Register the dashboard module
    customers,
    products,
    invoices
  },
  state: {
    user: null,       // Store user data after login
    token: localStorage.getItem('token') || null,  // Load token from localStorage on reload
    refreshToken: localStorage.getItem('refreshToken') || null, // Load refresh token from localStorage on reload
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;  // Set user mutation
    },
    SET_TOKEN(state, token) {
      state.token = token;  // Set access token mutation
    },
    SET_REFRESH_TOKEN(state, refreshToken) {
      state.refreshToken = refreshToken;  // Set refresh token mutation
    },
    CLEAR_USER(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
    },
  },
  actions: {
    // Action to log in and store both tokens
    async loginUser({ commit }, credentials) {
      try {
        const response = await axios.post('http://localhost:3001/auth/login', credentials);
        const { user, token, refreshToken } = response.data;
        
        commit('SET_USER', user);
        commit('SET_TOKEN', token);
        commit('SET_REFRESH_TOKEN', refreshToken);
        
        // Store both tokens in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
      } catch (error) {
        console.error('Error logging in:', error);
        throw error; // Re-throw to handle in components
      }
    },
    
    // Action to refresh the token using the refresh token
    async refreshToken({ state, commit }) {
      try {
        const response = await axios.post('http://localhost:3001/auth/refresh', {
          refreshToken: state.refreshToken || localStorage.getItem('refreshToken'), // Use stored refresh token
        });

        const newToken = response.data.token;
        
        // Set the new access token
        commit('SET_TOKEN', newToken);
        localStorage.setItem('token', newToken); // Update token in localStorage

        return newToken;  // Return the new token for further requests
      } catch (error) {
        console.error('Error refreshing token:', error);
        commit('CLEAR_USER');  // Clear user data if refresh fails
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        throw error;  // Re-throw to handle in components
      }
    },
    
    // Action to log out
    logoutUser({ commit }) {
      // Remove tokens from localStorage and clear state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      commit('CLEAR_USER');
    },
  },
  getters: {
    isAuthenticated: state => !!state.token, // Check if user is authenticated based on token
    currentUser: state => state.user,
  },
});
