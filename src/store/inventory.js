import apiClient from "./apiClient"; // Import the Axios instance

const state = {
  inventory: [],
  loading: false,
  inventoryDetail: null,
  error: null,
  totalCount: 0,
  currentProductId: null,
  availableInventory: [], // For available items (used in invoicing)
  soldInventory: [], // For sold items
  currentFilters: {}, // Track current filters for refresh purposes
};

const getters = {
  allInventory: (state) => state.inventory,
  isLoading: (state) => state.loading,
  inventoryDetail: (state) => state.inventoryDetail,
  availableInventory: (state) => state.availableInventory,
  soldInventory: (state) => state.soldInventory,
  getInventoryById: (state) => (inventoryId) => {
    return state.inventory.find((item) => item.id === inventoryId) || null;
  },
  getTotalCount: (state) => state.totalCount,
  getCurrentProductId: (state) => state.currentProductId,
  getCurrentFilters: (state) => state.currentFilters,
  isFilteredByProduct: (state) => !!state.currentProductId,
};

const actions = {
  // Main inventory fetching action (uses query parameters)
  async fetchInventory({ commit }, params = {}) {
    commit("SET_LOADING", true);
    commit("CLEAR_ERROR");

    try {
      const queryParams = new URLSearchParams();

      // Pagination and sorting
      const page = params.page || 1;
      const limit = params.limit || 10;
      const sortBy = params.sortBy || "createdAt";
      const sortOrder = params.sortOrder || "desc";

      queryParams.append("page", page);
      queryParams.append("limit", limit);
      queryParams.append("sortBy", sortBy);
      queryParams.append("sortOrder", sortOrder);

      // Filters
      if (params.search && params.search.trim()) {
        queryParams.append("search", params.search.trim());
      }
      if (params.status) queryParams.append("status", params.status);
      if (params.type) queryParams.append("type", params.type);
      if (params.rollId) queryParams.append("rollId", params.rollId);
      if (params.productId) queryParams.append("productId", params.productId);

      // Range filters
      if (params.minWeight) queryParams.append("minWeight", params.minWeight);
      if (params.maxWeight) queryParams.append("maxWeight", params.maxWeight);
      if (params.minWidth) queryParams.append("minWidth", params.minWidth);
      if (params.maxWidth) queryParams.append("maxWidth", params.maxWidth);

      const url = `/inventory?${queryParams.toString()}`;
      console.log("Fetching inventory with URL:", url);

      const response = await apiClient.get(url);

      if (response.data.success) {
        const inventoryData = response.data.data || [];
        const totalCount = response.data.total || 0;

        commit("SET_INVENTORY", inventoryData);
        commit("SET_TOTAL_COUNT", totalCount);
        commit("SET_CURRENT_FILTERS", params);
        
        // Set product context if filtering by productId
        commit("SET_CURRENT_PRODUCT_ID", params.productId || null);

        return {
          data: inventoryData,
          total: totalCount,
          pagination: response.data.pagination,
          filters: response.data.filters,
        };
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error fetching inventory.";

      commit("SET_ERROR", errorMessage);
      commit("SET_INVENTORY", []);
      commit("SET_TOTAL_COUNT", 0);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // Dedicated action for fetching inventory by product (uses dedicated endpoint)
  async fetchInventoryForProduct({ commit }, { productId, params = {} }) {
    if (!productId) {
      throw new Error("Product ID is required");
    }

    commit("SET_LOADING", true);
    commit("CLEAR_ERROR");

    try {
      const queryParams = new URLSearchParams();

      // Pagination and sorting
      const page = params.page || 1;
      const limit = params.limit || 10;
      const sortBy = params.sortBy || "createdAt";
      const sortOrder = params.sortOrder || "desc";

      queryParams.append("page", page);
      queryParams.append("limit", limit);
      queryParams.append("sortBy", sortBy);
      queryParams.append("sortOrder", sortOrder);

      // Additional filters
      if (params.search && params.search.trim()) {
        queryParams.append("search", params.search.trim());
      }
      if (params.status) queryParams.append("status", params.status);
      if (params.type) queryParams.append("type", params.type);
      if (params.rollId) queryParams.append("rollId", params.rollId);

      // Range filters
      if (params.minWeight) queryParams.append("minWeight", params.minWeight);
      if (params.maxWeight) queryParams.append("maxWeight", params.maxWeight);
      if (params.minWidth) queryParams.append("minWidth", params.minWidth);
      if (params.maxWidth) queryParams.append("maxWidth", params.maxWidth);

      const url = `/inventory/product/${productId}?${queryParams.toString()}`;
      console.log(`Fetching inventory for product ${productId} with URL:`, url);

      const response = await apiClient.get(url);

      if (response.data.success) {
        const inventoryData = response.data.data || [];
        const totalCount = response.data.total || 0;

        commit("SET_INVENTORY", inventoryData);
        commit("SET_TOTAL_COUNT", totalCount);
        commit("SET_CURRENT_PRODUCT_ID", productId);
        commit("SET_CURRENT_FILTERS", { ...params, productId });

        return {
          data: inventoryData,
          total: totalCount,
          pagination: response.data.pagination,
          product: response.data.product,
          filters: response.data.filters,
        };
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error(`Error fetching inventory for product ${productId}:`, error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        `Error fetching inventory for product ${productId}.`;

      commit("SET_ERROR", errorMessage);
      commit("SET_INVENTORY", []);
      commit("SET_TOTAL_COUNT", 0);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // NEW: Fetch available inventory for a product (for invoicing)
  async fetchAvailableInventoryForProduct({ commit }, { productId, params = {} }) {
    if (!productId) {
      throw new Error("Product ID is required");
    }

    commit("SET_LOADING", true);
    commit("CLEAR_ERROR");

    try {
      const queryParams = new URLSearchParams();

      // Pagination and sorting
      const page = params.page || 1;
      const limit = params.limit || 1000; // High limit for inventory selection
      const sortBy = params.sortBy || "rollId";
      const sortOrder = params.sortOrder || "asc";

      queryParams.append("page", page);
      queryParams.append("limit", limit);
      queryParams.append("sortBy", sortBy);
      queryParams.append("sortOrder", sortOrder);

      const url = `/inventory/product/${productId}/available?${queryParams.toString()}`;
      console.log(`Fetching available inventory for product ${productId}:`, url);

      const response = await apiClient.get(url);

      if (response.data.success) {
        const availableData = response.data.data || [];

        commit("SET_AVAILABLE_INVENTORY", availableData);

        return {
          data: availableData,
          total: response.data.total,
          pagination: response.data.pagination,
          product: response.data.product,
        };
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error(`Error fetching available inventory for product ${productId}:`, error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        `Error fetching available inventory for product ${productId}.`;

      commit("SET_ERROR", errorMessage);
      commit("SET_AVAILABLE_INVENTORY", []);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // NEW: Fetch inventory by status
  async fetchInventoryByStatus({ commit }, { status = {} }) {
    if (!status) {
      throw new Error("Status is required");
    }

    commit("SET_LOADING", true);
    commit("CLEAR_ERROR");

    try {
      const url = `/inventory/status/${status}`;
      console.log(`Fetching inventory with status ${status}:`, url);

      const response = await apiClient.get(url);

      if (response.data.success) {
        const inventoryData = response.data.data || [];

        if (status === 'sold') {
          commit("SET_SOLD_INVENTORY", inventoryData);
        } else {
          commit("SET_INVENTORY", inventoryData);
          commit("SET_TOTAL_COUNT", inventoryData.length);
        }

        return {
          data: inventoryData,
          total: inventoryData.length,
        };
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error(`Error fetching inventory by status ${status}:`, error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        `Error fetching inventory by status ${status}.`;

      commit("SET_ERROR", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // NEW: Fetch sold inventory with pagination
  async fetchSoldInventory({ commit }, params = {}) {
    commit("SET_LOADING", true);
    commit("CLEAR_ERROR");

    try {
      const queryParams = new URLSearchParams();

      const page = params.page || 1;
      const limit = params.limit || 10;

      queryParams.append("page", page);
      queryParams.append("limit", limit);

      const url = `/inventory/sold?${queryParams.toString()}`;
      console.log("Fetching sold inventory:", url);

      const response = await apiClient.get(url);

      if (response.data.success) {
        const soldData = response.data.data || [];
        const totalCount = response.data.total || 0;

        commit("SET_SOLD_INVENTORY", soldData);
        commit("SET_TOTAL_COUNT", totalCount);

        return {
          data: soldData,
          total: totalCount,
          pagination: response.data.pagination,
        };
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error("Error fetching sold inventory:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error fetching sold inventory.";

      commit("SET_ERROR", errorMessage);
      commit("SET_SOLD_INVENTORY", []);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // NEW: Fetch inventory by invoice number
  async fetchInventoryByInvoice({ commit }, invoiceNumber) {
    if (!invoiceNumber) {
      throw new Error("Invoice number is required");
    }

    commit("SET_LOADING", true);
    commit("CLEAR_ERROR");

    try {
      const url = `/inventory/invoice/${invoiceNumber}`;
      console.log(`Fetching inventory for invoice ${invoiceNumber}:`, url);

      const response = await apiClient.get(url);

      if (response.data.success) {
        const inventoryData = response.data.data || [];

        return {
          data: inventoryData,
          total: inventoryData.length,
        };
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error(`Error fetching inventory for invoice ${invoiceNumber}:`, error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        `Error fetching inventory for invoice ${invoiceNumber}.`;

      commit("SET_ERROR", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // NEW: Bulk update inventory status
  async bulkUpdateInventoryStatus({ commit }, { rollIds, status, invoiceNumber = null }) {
    if (!rollIds || !Array.isArray(rollIds) || rollIds.length === 0) {
      throw new Error("Roll IDs array is required");
    }

    if (!status) {
      throw new Error("Status is required");
    }

    commit("SET_LOADING", true);
    commit("CLEAR_ERROR");

    try {
      const payload = {
        rollIds,
        status,
        ...(invoiceNumber && { invoiceNumber }),
      };

      const response = await apiClient.put("/inventory/bulk-update-status", payload);

      if (response.data.success) {
        // Update local state for affected items
        commit("BULK_UPDATE_INVENTORY_STATUS", { rollIds, status, invoiceNumber });

        return {
          updatedCount: response.data.updatedCount,
          message: response.data.message,
        };
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error("Error bulk updating inventory status:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error updating inventory status.";

      commit("SET_ERROR", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // Enhanced search action that maintains context
  async searchInventory({ dispatch, state }, searchParams) {
    if (state.currentProductId) {
      return dispatch("fetchInventoryForProduct", {
        productId: state.currentProductId,
        params: {
          page: 1,
          ...searchParams,
        }
      });
    } else {
      return dispatch("fetchInventory", {
        page: 1,
        ...searchParams,
      });
    }
  },

  // Enhanced filter action that maintains context
  async filterInventory({ dispatch, state }, { field, value, preserveOtherParams = {} }) {
    const params = {
      page: 1,
      ...preserveOtherParams,
      [field]: value,
    };

    if (state.currentProductId) {
      return dispatch("fetchInventoryForProduct", {
        productId: state.currentProductId,
        params: params
      });
    } else {
      return dispatch("fetchInventory", params);
    }
  },

  // Clear all filters
  async clearFilters({ dispatch, state }) {
    const defaultParams = {
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    if (state.currentProductId) {
      return dispatch("fetchInventoryForProduct", {
        productId: state.currentProductId,
        params: defaultParams
      });
    } else {
      return dispatch("fetchInventory", defaultParams);
    }
  },

  // Clear product filter and return to all inventory
  async clearProductFilter({ dispatch }) {
    return dispatch("fetchInventory", {
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  },

  // Refresh current view maintaining context and filters
  async refreshInventory({ dispatch, state }, additionalParams = {}) {
    const params = {
      ...state.currentFilters,
      ...additionalParams,
    };

    if (state.currentProductId) {
      return dispatch("fetchInventoryForProduct", {
        productId: state.currentProductId,
        params: params
      });
    } else {
      return dispatch("fetchInventory", params);
    }
  },

  // Existing CRUD actions remain the same...
  async fetchInventoryDetail({ commit }, inventoryId) {
    commit("SET_LOADING", true);
    try {
      const response = await apiClient.get(`/inventory/${inventoryId}`);
      if (response.data.success) {
        commit("SET_INVENTORY_DETAIL", response.data.data);
        return response.data.data;
      } else {
        throw new Error("Failed to fetch inventory details");
      }
    } catch (error) {
      console.error("Error fetching inventory detail:", error);
      commit("SET_ERROR", "Failed to fetch inventory details.");
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async saveInventory({ commit }, { inventoryId, inventoryData }) {
    commit("SET_LOADING", true);
    try {
      let response;
      if (inventoryId) {
        response = await apiClient.put(`/inventory/${inventoryId}`, inventoryData);
        commit("UPDATE_INVENTORY", response.data.data);
      } else {
        response = await apiClient.post("/inventory", inventoryData);
        commit("ADD_INVENTORY", response.data.data);
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error ${inventoryId ? "updating" : "creating"} inventory:`, error);
      commit("SET_ERROR", `Error ${inventoryId ? "updating" : "creating"} inventory.`);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async deleteInventory({ commit }, inventoryId) {
    commit("SET_LOADING", true);
    try {
      await apiClient.delete(`/inventory/${inventoryId}`);
      commit("REMOVE_INVENTORY_FROM_LIST", inventoryId);
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      commit("SET_ERROR", "Error deleting inventory item.");
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },
};

const mutations = {
  SET_INVENTORY(state, inventory) {
    state.inventory = Array.isArray(inventory) ? inventory : [];
  },
  SET_AVAILABLE_INVENTORY(state, inventory) {
    state.availableInventory = Array.isArray(inventory) ? inventory : [];
  },
  SET_SOLD_INVENTORY(state, inventory) {
    state.soldInventory = Array.isArray(inventory) ? inventory : [];
  },
  SET_INVENTORY_DETAIL(state, inventoryDetail) {
    state.inventoryDetail = inventoryDetail;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_CURRENT_FILTERS(state, filters) {
    state.currentFilters = { ...filters };
  },
  ADD_INVENTORY(state, inventoryItem) {
    state.inventory.push(inventoryItem);
    state.totalCount += 1;
  },
  UPDATE_INVENTORY(state, updatedInventory) {
    const index = state.inventory.findIndex(
      (item) => item.id === updatedInventory.id
    );
    if (index !== -1) {
      state.inventory.splice(index, 1, updatedInventory);
    }
  },
  REMOVE_INVENTORY_FROM_LIST(state, inventoryId) {
    state.inventory = state.inventory.filter((item) => item.id !== inventoryId);
    state.totalCount = Math.max(0, state.totalCount - 1);
  },
  BULK_UPDATE_INVENTORY_STATUS(state, { rollIds, status, invoiceNumber }) {
    state.inventory.forEach((item) => {
      if (rollIds.includes(item.rollId)) {
        item.status = status;
        if (status === 'sold') {
          item.soldAt = new Date().toISOString();
          if (invoiceNumber) {
            item.invoiceNumber = invoiceNumber;
          }
        } else if (status === 'available') {
          item.soldAt = null;
          item.invoiceNumber = null;
        }
      }
    });
  },
  SET_ERROR(state, errorMessage) {
    state.error = errorMessage;
  },
  SET_TOTAL_COUNT(state, count) {
    state.totalCount = parseInt(count) || 0;
  },
  SET_CURRENT_PRODUCT_ID(state, productId) {
    state.currentProductId = productId;
  },
  CLEAR_ERROR(state) {
    state.error = null;
  },
  RESET_STATE(state) {
    state.inventory = [];
    state.availableInventory = [];
    state.soldInventory = [];
    state.loading = false;
    state.inventoryDetail = null;
    state.error = null;
    state.totalCount = 0;
    state.currentProductId = null;
    state.currentFilters = {};
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};