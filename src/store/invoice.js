import apiClient from './apiClient';

const state = {
  invoices: [],
  loading: false,
};

const getters = {
  allInvoices: (state) => state.invoices,
  isLoading: (state) => state.loading,
};

const actions = {
  async fetchInvoices({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.get('http://localhost:3001/custprod');
      commit('SET_INVOICES', response.data.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
};

const mutations = {
  SET_INVOICES(state, invoices) {
    state.invoices = invoices;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
