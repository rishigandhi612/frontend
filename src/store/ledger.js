import apiClient from "./apiClient";

const state = {
  ledgerEntries: [],
  outStandingInvoices: [],
  outstandingBills: [],
  // holds the last fetched customer ledger response
  customerLedger: null,
};

const getters = {
  ledgerEntries: (state) => state.ledgerEntries,
  customerLedger: (state) => state.customerLedger,
  outStandingInvoices: (state) => state.outStandingInvoices,
};

const actions = {
  async fetchLedgerEntries({ commit }) {
    try {
      const response = await apiClient.get("/ledger");
      commit("SET_LEDGER_ENTRIES", response.data);
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
      throw error;
    }
  },
  async fetchOutstandingInvoiceEntries({ commit }) {
    try {
      const response = await apiClient.get("/reports/outstanding");
      commit("SET_OUTSTANDING_INVOICE_ENTRIES", response.data);
    } catch (error) {
      console.error("Error fetching outstanding invoice entries:", error);
      throw error;
    }
  },
  async fetchCustomerLedger({ commit }, { customerId, params = {} } = {}) {
    try {
      if (!customerId) throw new Error("customerId is required");
      const query = {
        financialYear: params.financialYear || "current",
        sortOrder: params.sortOrder || "asc",
        page: params.page || 1,
        limit: params.limit || 50,
        ...params,
      };
      const response = await apiClient.get(`/reports/ledger/${customerId}`, {
        params: query,
      });
      // response.data is expected to be the whole payload
      commit("SET_CUSTOMER_LEDGER", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching customer ledger:", error);
      throw error;
    }
  },
};

const mutations = {
  SET_LEDGER_ENTRIES(state, entries) {
    state.ledgerEntries = entries;
  },
  SET_OUTSTANDING_INVOICE_ENTRIES(state, entries) {
    state.outStandingInvoices = entries;
  },
  SET_CUSTOMER_LEDGER(state, payload) {
    state.customerLedger = payload;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
