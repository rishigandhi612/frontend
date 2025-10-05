import apiClient from "./apiClient";

const state = {
  loading: false,
  summaries: null, // Changed from array to object to hold full response
};

const getters = {
  isLoading: (state) => state.loading,
  allSummaries: (state) => state.summaries,
  periodBreakdown: (state) => state.summaries?.periodBreakdown || [],
  overallStats: (state) => state.summaries?.overallStatistics || null,
  comparison: (state) => state.summaries?.comparison || null,
  trends: (state) => state.summaries?.trends || null,
};

const actions = {
  // Fetch monthly summary with optional query parameters
  async fetchMonthlySummary({ commit }, queryParams = "") {
    commit("SET_LOADING", true);
    try {
      const url = `/custprod/monthly-totals${queryParams}`;
      const response = await apiClient.get(url);

      if (response && response.data.data) {
        commit("SET_SUMMARIES", response.data.data);
      } else {
        throw new Error("Invalid response format");
      }

      console.log("Fetching monthly summary...", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      commit("SET_SUMMARIES", null);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },
};

const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_SUMMARIES(state, summaries) {
    state.summaries = summaries;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
