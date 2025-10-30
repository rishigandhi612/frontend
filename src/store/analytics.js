// src/store/analytics.js

import apiClient from "./apiClient"; // Import the Axios instance

const state = {
  analytics: {},
};

const getters = {
  analytics: (state) => state.analytics,
};

const actions = {
  async fetchAnalytics({ commit }) {
    try {
      const response = await apiClient.get("/analytics/monthly-dashboard");
      commit("SET_ANALYTICS", response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  },
};

const mutations = {
  SET_ANALYTICS(state, analytics) {
    state.analytics = analytics;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
