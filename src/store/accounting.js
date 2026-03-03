// src/store/accounting.js

import apiClient from "./apiClient"; // Import the Axios instance

const state = {
  receipts: [],
  receiptDetail: null,
  loading: false,
  customerBills: [],
  loadingBills: false,
  loadingState: {
    createReceipt: false,
    fetchBills: false,
  },
  openingBalance: {},
};

const getters = {
  allReceipts: (state) => state.receipts,
  receiptDetail: (state) => state.receiptDetail,
  isLoading: (state) => state.loading,
  customerBills: (state) => state.customerBills,
  isLoadingBills: (state) => state.loadingBills,
  getLoadingState: (state) => state.loadingState,
  getOpeningBalance: (state) => state.openingBalance,
};

const actions = {
  async fetchCustomerBills({ commit }, customerId) {
    commit("SET_LOADING_BILLS", true);
    try {
      const response = await apiClient.get(
        `/accounting/customers/${customerId}/bills`,
      );
      commit("SET_CUSTOMER_BILLS", response.data.data || []);
    } catch (error) {
      console.error("Error fetching customer bills:", error);
      throw error;
    } finally {
      commit("SET_LOADING_BILLS", false);
    }
  },

  async createReceipt({ commit }, receiptData) {
    commit("SET_LOADING_STATE", { type: "createReceipt", value: true });
    try {
      const response = await apiClient.post(
        "/accounting/receipts",
        receiptData,
      );
      if (response.data.success) {
        commit("ADD_RECEIPT", response.data.data);
        return response.data.data;
      } else {
        throw new Error("Failed to create receipt");
      }
    } catch (error) {
      console.error("Error creating receipt:", error);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "createReceipt", value: false });
    }
  },

  async fetchReceipts({ commit }) {
    commit("SET_LOADING", true);
    try {
      const response = await apiClient.get("/accounting/receipts");
      commit("SET_RECEIPTS", response.data.data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fetchReceiptDetail({ commit }, receiptId) {
    try {
      const response = await apiClient.get(`/accounting/receipts/${receiptId}`);
      if (response.data.success) {
        commit("SET_RECEIPT_DETAIL", response.data.data);
      } else {
        throw new Error("Failed to fetch receipt details");
      }
    } catch (error) {
      console.error("Error fetching receipt detail:", error);
      throw error;
    }
  },
  async addOpeningBalance(
    { commit },
    { customerId, amount, asOfDate, narration },
  ) {
    try {
      const response = await apiClient.post(`/accounting/opening-balances`, {
        customerId: customerId,
        amount: amount,
        asOfDate: asOfDate,
        narration: narration,
      });
      if (response.data.success) {
        commit("SET_OPENING_BALANCE", response.data.data);
        // Optionally, you can fetch the updated bills after adding the opening balance
        await this.dispatch("accounting/fetchCustomerBills", customerId);
      } else {
        throw new Error("Failed to add opening balance");
      }
    } catch (error) {
      console.error("Error adding opening balance:", error);
      throw error;
    }
  },

  // Add multiple opening balances by queuing single requests sequentially
  async addOpeningBalances({ dispatch }, openingBalances) {
    try {
      const results = [];
      for (const ob of openingBalances) {
        // Dispatch the single-item action which posts to /accounting/opening-balance
        const res = await dispatch("addOpeningBalance", ob);
        results.push(res);
      }
      return results;
    } catch (error) {
      console.error("Error adding opening balances:", error);
      throw error;
    }
  },
};

const mutations = {
  SET_RECEIPTS(state, receipts) {
    state.receipts = receipts;
  },
  SET_OPENING_BALANCE(state, openingBalance) {
    // This mutation can be used to update the state with the new opening balance if needed
    // For example, you might want to add it to the customerBills or keep it in a separate state variable
    // Here, we will just log it for demonstration purposes
    state.openingBalance = openingBalance; // You can choose to store it in the state if needed
    console.log("New opening balance added:", openingBalance);
  },
  SET_RECEIPT_DETAIL(state, receipt) {
    state.receiptDetail = receipt;
  },

  ADD_RECEIPT(state, receipt) {
    state.receipts.push(receipt);
  },

  SET_LOADING(state, loading) {
    state.loading = loading;
  },

  SET_CUSTOMER_BILLS(state, bills) {
    state.customerBills = bills;
  },

  SET_LOADING_BILLS(state, loading) {
    state.loadingBills = loading;
  },

  SET_LOADING_STATE(state, { type, value }) {
    state.loadingState[type] = value;
  },

  CLEAR_CUSTOMER_BILLS(state) {
    state.customerBills = [];
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
