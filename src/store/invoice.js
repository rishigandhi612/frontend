//  Updated Vuex store module for invoices with pagination
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
  pagination: {
    page: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  },
  sortBy: 'createdAt',
  sortDesc: true,
  search: ''
};

const getters = {
  allInvoices: (state) => state.invoices,
  invoiceDetail: (state) => state.invoiceDetail,
  isLoading: (state) => state.loading,
  pagination: (state) => state.pagination,
  sortBy: (state) => state.sortBy,
  sortDesc: (state) => state.sortDesc,
  search: (state) => state.search
};

const actions = {
  // Modified to accept a skipFetch parameter to prevent automatic data fetching
  setPage({ commit }, page) {
    commit('SET_PAGE', page);
  },
  
  setItemsPerPage({ commit }, itemsPerPage) {
    commit('SET_ITEMS_PER_PAGE', itemsPerPage);
    commit('SET_PAGE', 1); // Reset to first page when changing items per page
  },
  
  setSorting({ commit }, { sortBy, sortDesc }) {
    commit('SET_SORTING', { sortBy, sortDesc });
  },
  
  setSearch({ commit }, search) {
    commit('SET_SEARCH', search);
    commit('SET_PAGE', 1); // Reset to first page when searching
  },

  async fetchInvoices({ commit, state }) {
    commit('SET_LOADING', true);
    try {
      // Build query parameters for pagination and sorting
      const params = {
        page: state.pagination.page,
        itemsPerPage: state.pagination.itemsPerPage,
        sortBy: state.sortBy,
        sortDesc: state.sortDesc
      };
      
      // Only add search parameter if it's not empty
      if (state.search && state.search.trim() !== '') {
        params.search = state.search.trim();
      }
      
      // Convert params object to query string
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      console.log('Fetching with query:', queryString);
      
      const response = await apiClient.get(`/custprod?${queryString}`);
      
      if (response.data.success) {
        commit('SET_INVOICES', response.data.data);
        commit('SET_PAGINATION', response.data.pagination);
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

  // Keep existing actions...
  async fetchInvoiceDetail({ commit, dispatch }, id) {
    commit('SET_LOADING', true);
    try {
      const response = await dispatch('fetchInvoiceById', id);

      if (response.success) {
        const invoice = response.data;
        commit('SET_INVOICE_DETAIL', invoice);
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
      const response = await apiClient.get(`/custprod/${id}`);
      return response.data;
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
  }
};

const mutations = {
  SET_INVOICES(state, invoices) {
    state.invoices = invoices;
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = pagination;
  },
  SET_PAGE(state, page) {
    state.pagination.page = page;
  },
  SET_ITEMS_PER_PAGE(state, itemsPerPage) {
    state.pagination.itemsPerPage = itemsPerPage;
  },
  SET_SORTING(state, { sortBy, sortDesc }) {
    state.sortBy = sortBy;
    state.sortDesc = sortDesc;
  },
  SET_SEARCH(state, search) {
    state.search = search;
  },
  ADD_INVOICE(state, invoice) {
    state.invoices.push(invoice);
  },
  SET_INVOICE_DETAIL(state, invoice) {
    state.invoiceDetail = { ...invoice };
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
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};