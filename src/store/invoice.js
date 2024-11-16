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
      const response = await apiClient.get('/custprod');
      commit('SET_INVOICES', response.data.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchInvoiceDetail({ dispatch, commit }, id) {
    try {
      // Fetch invoice by ID from API using dispatch to another action
      const response = await dispatch('fetchInvoiceById', id);
      
      // Check if the response was successful
      if (response && response.success) {
        const invoice = response.data;  // Extract invoice data
        
        // Log the invoice data for debugging
        console.log('Invoice Data:', invoice);
        
        // Commit to Vuex store if needed (optional)
        commit('SET_INVOICE_DETAIL', invoice);
        
        // If you want to store some other specific values in the state, commit them as well
        commit('SET_CUSTOMER_ID', invoice.customer._id);  // For example, commit customer ID
        commit('SET_PRODUCT_ID', invoice.product._id);    // Commit product ID
  
      } else {
        throw new Error("Failed to load invoice details for edit.");
      }
    } catch (err) {
      console.error("Error fetching invoice details:", err);
      this.error = "Failed to load invoice details."; // Update this part in the component if needed
    }
  },  
  async fetchInvoiceById(_, id) {
    try {
      // API call to fetch invoice by ID
      const response = await apiClient.get(`/custprod/${id}`);
      
      // Log the response for debugging
      console.log('Fetched Invoice:', response.data);
      
      // Return the response data
      return response.data;
      
    } catch (error) {
      console.error("Error fetching invoice:", error);
      throw new Error("Failed to load invoice details for edit.");
    }
  }
  ,  

  async createInvoiceInStore({ commit }, invoiceData) {
    try {
      const response = await apiClient.post('/custprod', invoiceData);
      if (response.data.success) {
        commit('ADD_INVOICE', response.data.data);
      } else {
        throw new Error('Invoice creation failed');
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  },

  async updateInvoiceInStore({ commit }, { id, data }) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.put(`/custprod/${id}`, data);
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
      await apiClient.delete(`/custprod/${invoiceId}`);
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
  ADD_INVOICE(state, invoice) {
    state.invoices.push(invoice);
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
