import apiClient from "./apiClient"; // Import the Axios instance

const state = {
  banks: [],
  loading: false,
  bankDetail: null,
};

const getters = {
  allBanks: (state) => state.banks,
  isLoading: (state) => state.loading,
  bankDetail: (state) => state.bankDetail,
  getBankById: (state) => (bankId) => {
    return state.banks.find((bank) => bank.id === bankId) || null;
  },
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
      commit("REMOVE_BANK_FROM_LIST", bankId); // Remove bank from list
      commit("REMOVE_BANK"); // Clear bank detail from state
    } catch (error) {
      console.error("Error deleting bank:", error);
      throw error;
    }
  },

  // New action to create a bank
  async createBank({ commit }, bankData) {
    try {
      const response = await apiClient.post("/bank", bankData); // API call to create bank
      if (response.data.success) {
        commit("ADD_BANK", response.data.data); // Add new bank to the state
      } else {
        throw new Error("Failed to create bank");
      }
    } catch (error) {
      console.error("Error creating bank:", error);
      throw error;
    }
  },

  // New action to update a bank
  async updateBank({ commit }, { bankId, bankData }) {
    try {
      // Sending a PUT request to update the bank by ID
      const response = await apiClient.put(`/bank/${bankId}`, bankData);

      // Check if the request was successful
      if (response.data.success) {
        // Commit the mutation to update the bank in the state
        commit("UPDATE_BANK", response.data.data);
      } else {
        throw new Error("Failed to update bank");
      }
    } catch (error) {
      console.error("Error updating bank:", error);
      throw error; // Rethrow error to handle it in the component
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
    state.bankDetail = null; // Clear bank detail after deletion
  },

  ADD_BANK(state, bank) {
    state.banks.push(bank); // Add new bank to the array
  },
  // Mutation to update the bank in the store
  UPDATE_BANK(state, updatedBank) {
    // Find and update the bank in the list
    const index = state.banks.findIndex((bank) => bank.id === updatedBank.id);
    if (index !== -1) {
      state.banks.splice(index, 1, updatedBank); // Replace old bank with updated bank
    }

    // If the updated bank is the one in the bankDetail, update it as well
    if (state.bankDetail && state.bankDetail.id === updatedBank.id) {
      state.bankDetail = updatedBank;
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
