import apiClient from "./apiClient"; // Import the Axios instance

const state = {
  banks: [],
  loading: false,
  bankDetail: null,
  transactions: [],
  transactionsPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  transactionsLoading: false,
  totals: null,
  totalsLoading: false,
};

const getters = {
  allBanks: (state) => state.banks,
  isLoading: (state) => state.loading,
  bankDetail: (state) => state.bankDetail,
  getBankById: (state) => (bankId) => {
    return state.banks.find((bank) => bank.id === bankId) || null;
  },
  transactions: (state) => state.transactions,
  transactionsPagination: (state) => state.transactionsPagination,
  transactionsLoading: (state) => state.transactionsLoading,
  totals: (state) => state.totals,
  totalsLoading: (state) => state.totalsLoading,
};

const actions = {
  async fetchBanks({ commit }) {
    commit("SET_LOADING", true);
    try {
      const response = await apiClient.get("/bank");
      commit("SET_BANKS", response.data.data);
    } catch (error) {
      console.error("Error fetching banks:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fetchBankDetail({ commit }, bankId) {
    try {
      const response = await apiClient.get(`/bank/${bankId}`);
      if (response.data.success) {
        commit("SET_BANK_DETAIL", response.data.data);
      } else {
        throw new Error("Failed to fetch bank details");
      }
    } catch (error) {
      console.error("Error fetching bank detail:", error);
      throw error;
    }
  },

  async deleteBankFromStore({ commit }, bankId) {
    try {
      await apiClient.delete(`/bank/${bankId}`);
      commit("REMOVE_BANK_FROM_LIST", bankId);
      commit("REMOVE_BANK");
    } catch (error) {
      console.error("Error deleting bank:", error);
      throw error;
    }
  },

  async createBank({ commit }, bankData) {
    try {
      const response = await apiClient.post("/bank", bankData);
      if (response.data.success) {
        commit("ADD_BANK", response.data.data);
      } else {
        throw new Error("Failed to create bank");
      }
    } catch (error) {
      console.error("Error creating bank:", error);
      throw error;
    }
  },

  async updateBank({ commit }, { bankId, bankData }) {
    try {
      const response = await apiClient.put(`/bank/${bankId}`, bankData);
      if (response.data.success) {
        commit("UPDATE_BANK", response.data.data);
      } else {
        throw new Error("Failed to update bank");
      }
    } catch (error) {
      console.error("Error updating bank:", error);
      throw error;
    }
  },

  /**
   * Fetch paginated transactions for a specific bank.
   * @param {string} bankId  - The bank's ID
   * @param {number} page    - Page number (default: 1)
   * @param {number} limit   - Items per page (default: 10)
   */
  async fetchTransactions({ commit }, { bankId, page = 1, limit = 10 }) {
    commit("SET_TRANSACTIONS_LOADING", true);
    try {
      const response = await apiClient.get(`/bank/${bankId}/transactions`, {
        params: { page, limit },
      });
      if (response.data.success) {
        const payload = response.data || {};
        const pagination = payload.pagination || {};
        const transactions = Array.isArray(payload.data) ? payload.data : [];
        const total =
          pagination.total ?? payload.total ?? transactions.length ?? 0;
        const resolvedLimit = pagination.limit ?? payload.limit ?? limit;
        commit("SET_TRANSACTIONS", transactions);
        commit("SET_TRANSACTIONS_PAGINATION", {
          page: pagination.page ?? payload.page ?? page,
          limit: resolvedLimit,
          total,
          totalPages:
            pagination.totalPages ??
            payload.totalPages ??
            Math.max(1, Math.ceil(total / resolvedLimit)),
        });
      } else {
        throw new Error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    } finally {
      commit("SET_TRANSACTIONS_LOADING", false);
    }
  },

  /**
   * Fetch debit/credit totals for a bank within a date range.
   * @param {string} bankId     - The bank's ID
   * @param {string} startDate  - ISO date string e.g. "2026-01-01"
   * @param {string} endDate    - ISO date string e.g. "2026-05-01"
   */
  async fetchTotals({ commit }, { bankId, startDate, endDate }) {
    commit("SET_TOTALS_LOADING", true);
    try {
      const response = await apiClient.get(`/bank/${bankId}/totals`, {
        params: { startDate, endDate },
      });
      if (response.data.success) {
        commit("SET_TOTALS", response.data.data);
      } else {
        throw new Error("Failed to fetch totals");
      }
    } catch (error) {
      console.error("Error fetching totals:", error);
      throw error;
    } finally {
      commit("SET_TOTALS_LOADING", false);
    }
  },
};

const mutations = {
  SET_BANKS(state, banks) {
    state.banks = banks;
  },
  SET_BANK_DETAIL(state, bankDetail) {
    state.bankDetail = bankDetail;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  REMOVE_BANK_FROM_LIST(state, bankId) {
    state.banks = state.banks.filter((bank) => bank.id !== bankId);
  },
  REMOVE_BANK(state) {
    state.bankDetail = null;
  },
  ADD_BANK(state, bank) {
    state.banks.push(bank);
  },
  UPDATE_BANK(state, updatedBank) {
    const index = state.banks.findIndex((bank) => bank.id === updatedBank.id);
    if (index !== -1) {
      state.banks.splice(index, 1, updatedBank);
    }
    if (state.bankDetail && state.bankDetail.id === updatedBank.id) {
      state.bankDetail = updatedBank;
    }
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  SET_TRANSACTIONS(state, transactions) {
    state.transactions = transactions;
  },
  SET_TRANSACTIONS_PAGINATION(state, pagination) {
    state.transactionsPagination = {
      ...state.transactionsPagination,
      ...pagination,
    };
  },
  SET_TRANSACTIONS_LOADING(state, loading) {
    state.transactionsLoading = loading;
  },

  // ── Totals ────────────────────────────────────────────────────────────────
  SET_TOTALS(state, totals) {
    state.totals = totals;
  },
  SET_TOTALS_LOADING(state, loading) {
    state.totalsLoading = loading;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
