import apiClient from "./apiClient"; // Import the Axios instance

const state = {
  transactions: [],
  loading: false,
  transactionDetail: null,
};

const getters = {
  alltransactions: (state) => state.transactions,
  isLoading: (state) => state.loading,
  transactionDetail: (state) => state.transactionDetail,
  gettransactionById: (state) => (transactionId) => {
    return (
      state.transactions.find(
        (transaction) => transaction.id === transactionId
      ) || null
    );
  },
};

const actions = {
  async fetchtransactions({ commit }) {
    commit("SET_LOADING", true);
    try {
      const response = await apiClient.get("/transaction");
      commit("SET_transactionS", response.data.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fetchtransactionDetail({ commit }, transactionId) {
    try {
      const response = await apiClient.get(`/transaction/${transactionId}`);
      if (response.data.success) {
        commit("SET_transaction_DETAIL", response.data.data);
      } else {
        throw new Error("Failed to fetch transaction details");
      }
    } catch (error) {
      console.error("Error fetching transaction detail:", error);
      throw error;
    }
  },

  async deletetransactionFromStore({ commit }, transactionId) {
    try {
      await apiClient.delete(`/transaction/${transactionId}`);
      commit("REMOVE_transaction_FROM_LIST", transactionId); // Remove transaction from list
      commit("REMOVE_transaction"); // Clear transaction detail from state
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  },

  // New action to create a transaction
  async createtransaction({ commit }, transactionData) {
    try {
      const response = await apiClient.post("/transaction", transactionData); // API call to create transaction
      if (response.data.success) {
        commit("ADD_transaction", response.data.data); // Add new transaction to the state
      } else {
        throw new Error("Failed to create transaction");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  },

  // New action to update a transaction
  async updatetransaction({ commit }, { transactionId, transactionData }) {
    try {
      // Sending a PUT request to update the transaction by ID
      const response = await apiClient.put(
        `/transaction/${transactionId}`,
        transactionData
      );

      // Check if the request was successful
      if (response.data.success) {
        // Commit the mutation to update the transaction in the state
        commit("UPDATE_transaction", response.data.data);
      } else {
        throw new Error("Failed to update transaction");
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error; // Rethrow error to handle it in the component
    }
  },
};

const mutations = {
  SET_transactionS(state, transactions) {
    state.transactions = transactions;
  },
  SET_transaction_DETAIL(state, transactionDetail) {
    state.transactionDetail = transactionDetail;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  REMOVE_transaction_FROM_LIST(state, transactionId) {
    state.transactions = state.transactions.filter(
      (transaction) => transaction.id !== transactionId
    );
  },
  REMOVE_transaction(state) {
    state.transactionDetail = null; // Clear transaction detail after deletion
  },

  ADD_transaction(state, transaction) {
    state.transactions.push(transaction); // Add new transaction to the array
  },
  // Mutation to update the transaction in the store
  UPDATE_transaction(state, updatedtransaction) {
    // Find and update the transaction in the list
    const index = state.transactions.findIndex(
      (transaction) => transaction.id === updatedtransaction.id
    );
    if (index !== -1) {
      state.transactions.splice(index, 1, updatedtransaction); // Replace old transaction with updated transaction
    }

    // If the updated transaction is the one in the transactionDetail, update it as well
    if (
      state.transactionDetail &&
      state.transactionDetail.id === updatedtransaction.id
    ) {
      state.transactionDetail = updatedtransaction;
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
