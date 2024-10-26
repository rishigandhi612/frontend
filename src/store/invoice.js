import apiClient from './apiClient';

const state = {
  invoices: [],
  invoiceDetail: null,
  loading: false,
};

const getters = {
  allInvoices: (state) => state.invoices,
  invoiceDetail: (state) => state.invoiceDetail,
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

  async fetchInvoiceDetail({ commit }, invoiceId) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.get(`http://localhost:3001/custprod/${invoiceId}`);
      if (response.data.success && response.data.data) {
        commit('SET_INVOICE_DETAIL', response.data.data);
      } else {
        throw new Error("Invoice data not found.");
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateInvoiceInStore({ commit }, { id, data }) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.put(`http://localhost:3001/custprod/${id}`, data);
      commit('UPDATE_INVOICE', response.data.data);
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deleteInvoiceFromStore({ commit }, invoiceId) {
    commit('SET_LOADING', true);
    try {
      await apiClient.delete(`http://localhost:3001/custprod/${invoiceId}`);
      commit('REMOVE_INVOICE', invoiceId);
    } catch (error) {
      console.error("Error deleting invoice:", error);
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
  SET_INVOICE_DETAIL(state, invoice) {
    state.invoiceDetail = invoice;
  },
  UPDATE_INVOICE(state, updatedInvoice) {
    const index = state.invoices.findIndex((invoice) => invoice._id === updatedInvoice._id);
    if (index !== -1) {
      state.invoices.splice(index, 1, updatedInvoice);
    }
    if (state.invoiceDetail && state.invoiceDetail._id === updatedInvoice._id) {
      state.invoiceDetail = updatedInvoice;
    }
  },
  REMOVE_INVOICE(state, invoiceId) {
    state.invoices = state.invoices.filter((invoice) => invoice._id !== invoiceId);
    if (state.invoiceDetail && state.invoiceDetail._id === invoiceId) {
      state.invoiceDetail = null;
    }
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
