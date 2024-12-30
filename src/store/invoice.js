import apiClient from './apiClient';

const state = {
  invoices: [],
  invoiceDetail: null,
  loading: false,
  loadingState: {
    fetchInvoices: false,
    deleteInvoice: false,
    // other actions...
  },
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
      const response = await apiClient.get('/custprod');
      if (response.data.success) {
        commit('SET_INVOICES', response.data.data);
      } else {
        console.error('Failed to fetch invoices.');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchInvoiceDetail({ commit, dispatch }, id) {
    commit('SET_LOADING', true);
    try {
      // Fetch invoice by ID using a helper action
      const response = await dispatch('fetchInvoiceById', id);

      // Check if the response was successful
      if (response.success) {
        const invoice = response.data;  // Extract invoice data

        // Commit to Vuex store
        commit('SET_INVOICE_DETAIL', invoice);

        // Commit other necessary data such as customer ID and product IDs
        commit('SET_CUSTOMER_ID', invoice.customer ? invoice.customer._id : null);
        invoice.products.forEach(product => {
          commit('SET_PRODUCT_ID', product._id);
        });
      } else {
        throw new Error('Failed to load invoice details.');
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      throw new Error('Failed to fetch invoice details.');
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchInvoiceById(_, id ) {
    try {
      // API call to fetch invoice by ID
      const response = await apiClient.get(`/custprod/${id}`);
      return response.data;  // Return the response data
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw new Error('Failed to load invoice details.');
    } 
  },

  async createInvoiceInStore({ commit }, invoiceData) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.post('/custprod', invoiceData);
      if (response.data.success) {
        commit('ADD_INVOICE', response.data.data);
      } else {
        throw new Error('Invoice creation failed');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateInvoiceInStore({ commit }, { id, data }) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.put(`/custprod/${id}`, data);
      commit('UPDATE_INVOICE', response.data.data);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deleteInvoiceDetail({ commit }, invoiceId) {
    console.log("deleteInvoiceDetail action called with ID:", invoiceId);
    commit("SET_LOADING", true);
    try {
      const response = await apiClient.delete(`/custprod/${invoiceId}`);
      if (response.data.success) {
        commit("REMOVE_INVOICE", invoiceId);
      } else {
        throw new Error("Failed to delete the invoice on the server.");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw new Error(error.response?.data?.message || "Failed to delete the invoice.");
    } finally {
      commit("SET_LOADING", false);
    }
  },
};

const mutations = {
  SET_INVOICES(state, invoices) {
    state.invoices = invoices;
  },
  ADD_INVOICE(state, invoice) {
    state.invoices.push(invoice);
  },
  SET_INVOICE_DETAIL(state, invoice) {
    // Clear the previous detail before setting the new one to avoid stale data
    state.invoiceDetail = { ...invoice };  // Clone the invoice data
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
    // Filter out the deleted invoice from the list
    state.invoices = state.invoices.filter((invoice) => invoice._id !== invoiceId);
  
    // Clear invoiceDetail only if it matches the deleted invoice
    if (state.invoiceDetail && state.invoiceDetail._id === invoiceId) {
      state.invoiceDetail = null;
    }
  },  
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_CUSTOMER_ID(state, customerId) {
    if (state.invoiceDetail) {
      state.invoiceDetail.customerId = customerId;
    }
  },
  SET_PRODUCT_ID(state, productId) {
    if (state.invoiceDetail) {
      if (!state.invoiceDetail.productIds) {
        state.invoiceDetail.productIds = [];
      }
      state.invoiceDetail.productIds.push(productId);
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
