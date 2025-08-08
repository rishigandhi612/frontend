import apiClient from "./apiClient";

const state = {
  transporters: [], // Array to store transporter data
  transporterDetail: null, // Object to store details of a single transporter
  loading: false, // Global loading state
};

const getters = {
  allTransporters: (state) => state.transporters || [], // Getter to retrieve all transporters
  transporterDetail: (state) => state.transporterDetail, // Getter to retrieve single transporter detail
  isLoading: (state) => state.loading, // Getter to check if loading
  activeTransporters: (state) => state.transporters.filter(transporter => transporter.isActive), // Get only active transporters
};

const actions = {
  // Fetch all transporters
  async fetchTransporters({ commit }) {
    commit("SET_LOADING", true); // Set loading to true
    try {
      const response = await apiClient.get("/transporter"); // API call to fetch transporters
      console.log("Fetched transporters:", response); // Debug log
      if (response && Array.isArray(response.data.data)) {
        commit("SET_TRANSPORTERS", response.data.data); // Commit the transporter list
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching transporters:", error);
      commit("SET_LOADING", false); // Ensure loading is stopped on error
      throw error; // Rethrow error for further handling
    } finally {
      commit("SET_LOADING", false); // Set loading to false regardless of success/failure
    }
  },

  // Fetch a single transporter's details by ID
  async fetchTransporterDetail({ commit }, id) {
    commit("SET_LOADING", true); // Set loading to true
    try {
      const response = await apiClient.get(`/transporter/${id}`); // API call to fetch transporter by ID
      console.log("Fetched transporter detail:", response); // Debug log
      if (response.data) {
        commit("SET_TRANSPORTER_DETAIL", response.data.data); // Commit the transporter detail to the store
      } else {
        throw new Error("Failed to fetch transporter details");
      }
    } catch (error) {
      console.error("Error fetching transporter details:", error);
      commit("SET_LOADING", false); // Stop the loading spinner on error
      throw error; // Rethrow the error
    } finally {
      commit("SET_LOADING", false); // Set loading to false regardless of success/failure
    }
  },

  // Create a new transporter
  async createTransporter({ commit }, transporterData) {
    commit("SET_LOADING", true); // Set loading to true
    try {
      const response = await apiClient.post("/transporter", transporterData); // API call to create a transporter
      console.log("Created transporter:", response); // Debug log
      if (response.data.success) {
        commit("ADD_TRANSPORTER", response.data.data); // Commit the new transporter to the state
      } else {
        throw new Error("Failed to create transporter");
      }
    } catch (error) {
      console.error("Error creating transporter:", error);
      commit("SET_LOADING", false); // Stop the loading spinner on error
      throw error; // Rethrow the error
    } finally {
      commit("SET_LOADING", false); // Set loading to false regardless of success/failure
    }
  },

  // Update a transporter's details
  async updateTransporter({ commit }, { transporterId, transporterData }) {
    commit("SET_LOADING", true); // Set loading to true
    console.log(`Updating transporter with ID: ${transporterId}`); // Log transporterId to check
    try {
      const response = await apiClient.put(`/transporter/${transporterId}`, transporterData); // API call to update a transporter
      console.log("Updated transporter:", response); // Debug log
      if (response.data.success) {
        commit("UPDATE_TRANSPORTER", response.data.data); // Commit the updated transporter to the store
      } else {
        throw new Error("Failed to update transporter");
      }
    } catch (error) {
      console.error("Error updating transporter:", error);
      commit("SET_LOADING", false); // Stop the loading spinner on error
      throw error; // Rethrow the error
    } finally {
      commit("SET_LOADING", false); // Set loading to false regardless of success/failure
    }
  },

  // Delete a transporter
  async deleteTransporter({ commit }, id) {
    try {
      const response = await apiClient.delete(`/transporter/${id}`); // API call
      console.log("Deleted transporter:", response); // Debug log
      if (response.data.success) {
        commit("REMOVE_TRANSPORTER", id); // Update state
      } else {
        throw new Error("Failed to delete transporter");
      }
    } catch (error) {
      console.error("Error in deleteTransporter Vuex action:", error);
      throw error; // Rethrow to propagate error
    }
  },

  // Toggle transporter active status
  async toggleTransporterStatus({ commit }, { id, isActive }) {
    try {
      const response = await apiClient.put(`/transporter/${id}`, { isActive }); // API call to update status
      console.log("Toggled transporter status:", response); // Debug log
      if (response.data.success) {
        commit("UPDATE_TRANSPORTER", response.data.data); // Commit the updated transporter to the store
      } else {
        throw new Error("Failed to update transporter status");
      }
    } catch (error) {
      console.error("Error toggling transporter status:", error);
      throw error; // Rethrow the error
    }
  },
};

const mutations = {
  // Set the list of transporters
  SET_TRANSPORTERS(state, transporters) {
    state.transporters = transporters; // Set the transporter list
  },

  // Set the details of a single transporter
  SET_TRANSPORTER_DETAIL(state, transporter) {
    state.transporterDetail = transporter; // Set the transporter detail
  },

  // Add a new transporter
  ADD_TRANSPORTER(state, transporter) {
    state.transporters.push(transporter); // Add a new transporter to the list
  },

  // Update an existing transporter
  UPDATE_TRANSPORTER(state, updatedTransporter) {
    const index = state.transporters.findIndex((transporter) => transporter._id === updatedTransporter._id); // Find the transporter to update
    if (index !== -1) {
      state.transporters.splice(index, 1, updatedTransporter); // Update the transporter in the list
    }
    if (state.transporterDetail && state.transporterDetail._id === updatedTransporter._id) {
      state.transporterDetail = updatedTransporter; // Update the transporter detail if it matches
    }
  },

  // Remove a transporter
  REMOVE_TRANSPORTER(state, id) {
    state.transporters = state.transporters.filter((transporter) => transporter._id !== id); // Remove the transporter from the list
    if (state.transporterDetail && state.transporterDetail._id === id) {
      state.transporterDetail = null; // Clear the transporterDetail if it matches the deleted transporter
    }
  },

  // Set the loading state
  SET_LOADING(state, loading) {
    state.loading = loading; // Set the loading state
  },

  // Clear transporter detail (useful for cleanup)
  CLEAR_TRANSPORTER_DETAIL(state) {
    state.transporterDetail = null; // Clear the transporter detail
  },
};

export default {
  namespaced: true, // Ensure the module is namespaced
  state,
  getters,
  actions,
  mutations,
};