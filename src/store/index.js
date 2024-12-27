import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import dashboard from './dashboard';
import customers from './customers';
import products from './products';
import invoices from './invoice';

Vue.use(Vuex);

const BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3001';
console.log('Environment Base URL:', process.env);

export default new Vuex.Store({
  modules: {
    dashboard,
    customers,
    products,
    invoices,
  },
  state: {
    user: null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_TOKEN(state, token) {
      state.token = token;
    },
    SET_REFRESH_TOKEN(state, refreshToken) {
      state.refreshToken = refreshToken;
    },
    CLEAR_USER(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
    },
  },
  actions: {
    async loginUser({ commit }, credentials) {
      try {
        console.log('Base URL:', BASE_URL); // Debugging
        const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
        const { user, token, refreshToken } = response.data;

        commit('SET_USER', user);
        commit('SET_TOKEN', token);
        commit('SET_REFRESH_TOKEN', refreshToken);

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
      } catch (error) {
        console.error('Error logging in:', error.response?.data || error.message);
        throw error;
      }
    },

    async refreshToken({ state, commit }) {
      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: state.refreshToken || localStorage.getItem('refreshToken'),
        });

        const newToken = response.data.token;

        commit('SET_TOKEN', newToken);
        localStorage.setItem('token', newToken);

        return newToken;
      } catch (error) {
        console.error('Error refreshing token:', error.response?.data || error.message);
        commit('CLEAR_USER');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        throw error;
      }
    },

    logoutUser({ commit }) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      commit('CLEAR_USER');
    },
  },
  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user,
  },
});
