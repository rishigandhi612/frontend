// src/store/customers.js

import apiClient from './apiClient'; // Import the Axios instance

const state = {
  customers: [],
  loading: false,
  customerDetail: null,
};

const getters = {
  allCustomers: (state) => state.customers,
  isLoading: (state) => state.loading,
  customerDetail: (state) => state.customerDetail,
  getCustomerById: (state) => (customerId) => {
    return state.customers.find(customer => customer.id === customerId) || null;
  },
};

const actions = {
  async fetchCustomers({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.get('/customer');
      commit('SET_CUSTOMERS', response.data.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchCustomerDetail({ commit }, customerId) {
    try {
      const response = await apiClient.get(`/customer/${customerId}`);
      if (response.data.success) {
        commit('SET_CUSTOMER_DETAIL', response.data.data);
      } else {
        throw new Error('Failed to fetch customer details');
      }
    } catch (error) {
      console.error("Error fetching customer detail:", error);
      throw error;
    }
  },

  async deleteCustomerFromStore({ commit }, customerId) {
    try {
      await apiClient.delete(`/customer/${customerId}`);
      commit('REMOVE_CUSTOMER_FROM_LIST', customerId);  // Remove customer from list
      commit('REMOVE_CUSTOMER');  // Clear customer detail from state
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },
};

const mutations = {
  SET_CUSTOMERS(state, customers) {
    state.customers = customers;
  },
  SET_CUSTOMER_DETAIL(state, customerDetail) {
    state.customerDetail = customerDetail;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  REMOVE_CUSTOMER_FROM_LIST(state, customerId) {
    state.customers = state.customers.filter(customer => customer.id !== customerId);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
