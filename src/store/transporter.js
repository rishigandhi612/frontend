// Enhanced Vuex store module for Transporters with search and pagination
import apiClient from "./apiClient";

const state = {
  // Transporter data
  transporters: [],
  transporterDetail: null, // Object to store details of a single transporter
  loading: false, // Global loading state
  currentTransporter: null,
  // Search and pagination state
  searchResults: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null,
  },

  // Search filters
  lastSearchFilters: {
    search: "",
    name: "",
    city: "",
    state: "",
    page: 1,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  },

  // Loading states
  loadingState: {
    fetchAll: false,
    fetchOne: false,
    search: false,
    create: false,
    update: false,
    delete: false,
    toggleStatus: false,
  },

  // Messages
  successMessage: "",
  errorMessage: "",
};

const getters = {
  allTransporters: (state) => state.transporters || [], // Getter to retrieve all transporters
  // transporterDetail: (state) => state.transporterDetail, // Getter to retrieve single transporter detail
  activeTransporters: (state) =>
    state.transporters.filter((transporter) => transporter.isActive), // Get only active transporters
  currentTransporter: (state) => state.currentTransporter,
  transporterDetail: (state) => state.currentTransporter, // Alias for backward compatibility

  // Search and pagination getters
  searchResults: (state) => state.searchResults,
  pagination: (state) => state.pagination,
  lastSearchFilters: (state) => state.lastSearchFilters,

  // Loading state getters
  isLoading: (state) => (type) => {
    if (type) {
      return state.loadingState[type] || false;
    }
    return Object.values(state.loadingState).some((loading) => loading);
  },

  // Message getters
  successMessage: (state) => state.successMessage,
  errorMessage: (state) => state.errorMessage,

  // Utility getters
  getTransporterById: (state) => (id) => {
    return (
      state.transporters.find((transporter) => transporter._id === id) ||
      state.searchResults.find((transporter) => transporter._id === id)
    );
  },

  // Check if search has active filters
  hasActiveFilters: (state) => {
    const filters = state.lastSearchFilters;
    return !!(filters.search || filters.name || filters.city || filters.state);
  },
};

const actions = {
  // Search transporters with pagination
  async searchTransporters({ commit }, searchParams = {}) {
    commit("SET_LOADING_STATE", { type: "search", value: true });
    commit("CLEAR_MESSAGES");

    try {
      // Prepare search parameters
      const params = {
        page: searchParams.page || 1,
        limit: searchParams.limit || 10,
        sortBy: searchParams.sortBy || "name",
        sortOrder: searchParams.sortOrder || "asc",
        ...searchParams,
      };

      // Remove empty parameters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      console.log("Searching transporters with params:", params);

      const response = await apiClient.get("/transporter/search", { params });

      if (response.data.success) {
        commit("SET_SEARCH_RESULTS", response.data.data);
        commit("SET_PAGINATION", response.data.pagination);
        commit("SET_LAST_SEARCH_FILTERS", {
          ...params,
          ...response.data.filters,
        });

        return {
          data: response.data.data,
          pagination: response.data.pagination,
          success: true,
        };
      } else {
        throw new Error(response.data.message || "Search failed");
      }
    } catch (error) {
      console.error("Error searching transporters:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to search transporters";
      commit("SET_ERROR_MESSAGE", errorMessage);

      // Return empty results on error
      commit("SET_SEARCH_RESULTS", []);
      commit("SET_PAGINATION", {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: searchParams.limit || 10,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
      });

      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "search", value: false });
    }
  },

  // Fetch all transporters (traditional method - kept for backward compatibility)
  async fetchTransporters({ commit }) {
    commit("SET_LOADING_STATE", { type: "fetchAll", value: true });
    commit("CLEAR_MESSAGES");

    try {
      const response = await apiClient.get("/transporter");

      if (response.data.success) {
        commit("SET_TRANSPORTERS", response.data.data);
        commit("SET_SUCCESS_MESSAGE", "Transporters loaded successfully");
      } else {
        throw new Error(
          response.data.message || "Failed to fetch transporters"
        );
      }
    } catch (error) {
      console.error("Error fetching transporters:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load transporters";
      commit("SET_ERROR_MESSAGE", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "fetchAll", value: false });
    }
  },

  // Fetch single transporter by ID
  async fetchTransporterById({ commit }, transporterId) {
    commit("SET_LOADING_STATE", { type: "fetchOne", value: true });
    commit("CLEAR_MESSAGES");

    try {
      console.log(
        "Vuex action - fetching transporter ID:",
        transporterId,
        typeof transporterId
      );

      // Validate the ID is a string
      if (!transporterId || typeof transporterId !== "string") {
        throw new Error(
          "Invalid transporter ID provided to fetchTransporterById"
        );
      }

      const response = await apiClient.get(`/transporter/${transporterId}`);

      if (response.data.success) {
        const transporterData = response.data.data;
        commit("SET_CURRENT_TRANSPORTER", transporterData);
        console.log("Vuex - transporter set in store:", transporterData);
        return transporterData; // Return the data for component use
      } else {
        throw new Error(response.data.message || "Transporter not found");
      }
    } catch (error) {
      console.error("Vuex Error fetching transporter:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load transporter";
      commit("SET_ERROR_MESSAGE", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "fetchOne", value: false });
    }
  },

  // Create new transporter
  async createTransporter({ commit, dispatch }, transporterData) {
    commit("SET_LOADING_STATE", { type: "create", value: true });
    commit("CLEAR_MESSAGES");

    try {
      const response = await apiClient.post("/transporter", transporterData);

      if (response.data.success) {
        commit("SET_SUCCESS_MESSAGE", "Transporter created successfully");

        // Refresh the search results to include the new transporter
        const lastFilters = this.state.transporter.lastSearchFilters;
        if (Object.keys(lastFilters).length > 0) {
          await dispatch("searchTransporters", lastFilters);
        }

        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to create transporter"
        );
      }
    } catch (error) {
      console.error("Error creating transporter:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create transporter";
      commit("SET_ERROR_MESSAGE", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "create", value: false });
    }
  },

  // Update transporter
  async updateTransporter({ commit }, { id, data }) {
    commit("SET_LOADING_STATE", { type: "update", value: true });
    commit("CLEAR_MESSAGES");

    try {
      console.log("Vuex - updating transporter:", id, data);

      const response = await apiClient.put(`/transporter/${id}`, data);

      if (response.data.success) {
        commit("SET_SUCCESS_MESSAGE", "Transporter updated successfully");
        commit("SET_CURRENT_TRANSPORTER", response.data.data);

        // Update in search results if present
        commit("UPDATE_TRANSPORTER_IN_RESULTS", {
          id,
          data: response.data.data,
        });

        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to update transporter"
        );
      }
    } catch (error) {
      console.error("Vuex Error updating transporter:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update transporter";
      commit("SET_ERROR_MESSAGE", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "update", value: false });
    }
  },

  // Delete transporter
  async deleteTransporter({ commit }, transporterId) {
    commit("SET_LOADING_STATE", { type: "delete", value: true });
    commit("CLEAR_MESSAGES");

    try {
      const response = await apiClient.delete(`/transporter/${transporterId}`);

      if (response.data.success) {
        commit("SET_SUCCESS_MESSAGE", "Transporter deleted successfully");

        // Remove from local state
        commit("REMOVE_TRANSPORTER_FROM_RESULTS", transporterId);

        return true;
      } else {
        throw new Error(
          response.data.message || "Failed to delete transporter"
        );
      }
    } catch (error) {
      console.error("Error deleting transporter:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete transporter";
      commit("SET_ERROR_MESSAGE", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "delete", value: false });
    }
  },

  // Toggle transporter status
  async toggleTransporterStatus({ commit }, { id, isActive }) {
    commit("SET_LOADING_STATE", { type: "toggleStatus", value: true });
    commit("CLEAR_MESSAGES");

    try {
      const response = await apiClient.patch(`/transporter/${id}/status`, {
        isActive,
      });

      if (response.data.success) {
        const statusText = isActive ? "activated" : "deactivated";
        commit("SET_SUCCESS_MESSAGE", `Transporter ${statusText} successfully`);

        // Update in local state
        commit("UPDATE_TRANSPORTER_STATUS", { id, isActive });

        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to update transporter status"
        );
      }
    } catch (error) {
      console.error("Error toggling transporter status:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update transporter status";
      commit("SET_ERROR_MESSAGE", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "toggleStatus", value: false });
    }
  },

  // Message actions
  clearMessages({ commit }) {
    commit("CLEAR_MESSAGES");
  },

  setSuccessMessage({ commit }, message) {
    commit("SET_SUCCESS_MESSAGE", message);
  },

  setErrorMessage({ commit }, message) {
    commit("SET_ERROR_MESSAGE", message);
  },
};

const mutations = {
  // Basic data mutations
  SET_TRANSPORTERS(state, transporters) {
    state.transporters = transporters || [];
  },

  SET_CURRENT_TRANSPORTER(state, transporter) {
    state.currentTransporter = transporter;
    // Also set transporterDetail for backward compatibility if needed
    state.transporterDetail = transporter;
  },

  // Search and pagination mutations
  SET_SEARCH_RESULTS(state, results) {
    state.searchResults = results || [];
  },

  SET_PAGINATION(state, paginationData) {
    state.pagination = { ...state.pagination, ...paginationData };
  },

  SET_LAST_SEARCH_FILTERS(state, filters) {
    state.lastSearchFilters = { ...state.lastSearchFilters, ...filters };
  },

  // Loading state mutations]
  SET_LOADING_STATE(state, { type, value }) {
    if (Object.prototype.hasOwnProperty.call(state.loadingState, type)) {
      state.loadingState[type] = value;
    }
  },

  // Message mutations
  SET_SUCCESS_MESSAGE(state, message) {
    state.successMessage = message;
    state.errorMessage = "";
  },

  SET_ERROR_MESSAGE(state, message) {
    state.errorMessage = message;
    state.successMessage = "";
  },

  CLEAR_MESSAGES(state) {
    state.successMessage = "";
    state.errorMessage = "";
  },

  // Update mutations for maintaining state consistency
  UPDATE_TRANSPORTER_IN_RESULTS(state, { id, data }) {
    // Update in search results
    const searchIndex = state.searchResults.findIndex((t) => t._id === id);
    if (searchIndex !== -1) {
      state.searchResults.splice(searchIndex, 1, data);
    }

    // Update in main transporters array
    const transporterIndex = state.transporters.findIndex((t) => t._id === id);
    if (transporterIndex !== -1) {
      state.transporters.splice(transporterIndex, 1, data);
    }
  },

  UPDATE_TRANSPORTER_STATUS(state, { id, isActive }) {
    // Update in search results
    const searchResult = state.searchResults.find((t) => t._id === id);
    if (searchResult) {
      searchResult.isActive = isActive;
    }

    // Update in main transporters array
    const transporter = state.transporters.find((t) => t._id === id);
    if (transporter) {
      transporter.isActive = isActive;
    }

    // Update current transporter if it matches
    if (state.currentTransporter && state.currentTransporter._id === id) {
      state.currentTransporter.isActive = isActive;
    }
  },

  REMOVE_TRANSPORTER_FROM_RESULTS(state, id) {
    // Remove from search results
    state.searchResults = state.searchResults.filter((t) => t._id !== id);

    // Remove from main transporters array
    state.transporters = state.transporters.filter((t) => t._id !== id);

    // Clear current transporter if it matches
    if (state.currentTransporter && state.currentTransporter._id === id) {
      state.currentTransporter = null;
    }

    // Update pagination count
    if (state.pagination.totalCount > 0) {
      state.pagination.totalCount -= 1;
    }
  },

  // Reset mutations
  RESET_SEARCH_STATE(state) {
    state.searchResults = [];
    state.pagination = {
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage: null,
      prevPage: null,
    };
    state.lastSearchFilters = {
      search: "",
      name: "",
      city: "",
      state: "",
      page: 1,
      limit: 10,
      sortBy: "name",
      sortOrder: "asc",
    };
  },

  RESET_LOADING_STATES(state) {
    Object.keys(state.loadingState).forEach((key) => {
      state.loadingState[key] = false;
    });
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
