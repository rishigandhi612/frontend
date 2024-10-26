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

  async fetchInvoiceDetail(id) {
    try {
      const response = await this.$store.dispatch('invoices/fetchInvoiceById', id); // Call the correct action
      if (response && response.success) {
        const invoice = response.data; // Get the invoice data directly
        this.customerId = invoice.customer._id; // Access customer ID correctly
        this.productId = invoice.product._id;   // Access product ID correctly
        this.quantity = invoice.quantity;
        this.unitPrice = invoice.unit_price;
      } else {
        throw new Error("Failed to load invoice details for edit.");
      }
    } catch (err) {
      console.error("Error fetching invoice details:", err);
      this.error = "Failed to load invoice details.";
    }
  },  
  async fetchInvoiceById(_, id) { // Updated here
    try {
      const response = await apiClient.get(`/custprod/${id}`);
      return response.data; // Return the response for further processing in the component
    } catch (error) {
      console.error("Error fetching invoice:", error);
      throw new Error("Failed to load invoice details for edit.");
    }
  },  

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
