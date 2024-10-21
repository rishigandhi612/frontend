// src/store/dashboard.js

import apiClient from './apiClient'; // Import the Axios instance

const state = {
  stats: {},
};

const getters = {
  dashboardStats: (state) => state.stats,
};

const actions = {
  async fetchDashboardStats({ commit }) {
    try {
      const response = await apiClient.get('/dashboard/stats');
      commit('SET_DASHBOARD_STATS', response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
};

const mutations = {
  SET_DASHBOARD_STATS(state, stats) {
    state.stats = stats;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
