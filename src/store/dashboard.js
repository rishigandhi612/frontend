// src/store/dashboard.js

import axios from 'axios';

const state = {
  stats: {}, // Initialize stats state
};

const mutations = {
  SET_DASHBOARD_STATS(state, stats) {
    state.stats = stats; // Set the stats mutation
  },
};

const actions = {
  async fetchDashboardStats({ commit }) {
    try {
      const token = localStorage.getItem('token'); // Assuming you're storing the token in local storage
      const response = await axios.get('http://localhost:3001/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in the Authorization header
        },
      });
      commit('SET_DASHBOARD_STATS', response.data); // Use the correct mutation name
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error; // Rethrow to handle in the component if needed
    }
  },
};

const getters = {
  dashboardStats: (state) => state.stats, // Getter to access stats
};

export default {
  namespaced: true, // Enable namespacing for this module
  state,
  mutations,
  actions,
  getters,
};
