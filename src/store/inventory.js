import apiClient from './apiClient'; // Import the Axios instance

const state = {
  inventory: [],
  loading: false,
  inventoryDetail: null,
  error: null,
  totalCount: 0, // Track total number of items for pagination
};

const getters = {
  allInventory: (state) => state.inventory,
  isLoading: (state) => state.loading,
  inventoryDetail: (state) => state.inventoryDetail,
  getInventoryById: (state) => (inventoryId) => {
    return state.inventory.find((item) => item.id === inventoryId) || null;
  },
  getTotalCount: (state) => state.totalCount,
};

const actions = {
  async fetchInventory({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      // Build query parameters for server-side pagination and sorting
      const queryParams = new URLSearchParams();
      
      // Set default values if not provided
      const page = params.page || 1;
      const limit = params.limit || 10;
      const sortBy = params.sortBy || 'rollId';
      const sortOrder = params.sortOrder || 'asc';
      
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);
      
      // Add any additional filters if provided
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      
      // Make the API call with query parameters
      const queryString = queryParams.toString();
      const url = `/inventory?${queryString}`;
      
      const response = await apiClient.get(url);
      
      // Handle different response structures
      let inventoryData = [];
      let totalCount = 0;
      
      if (response.data.success && response.data.data) {
        // If API returns success wrapper
        inventoryData = Array.isArray(response.data.data) ? response.data.data : response.data.data.items || [];
        totalCount = response.data.total || response.data.data.total || inventoryData.length;
      } else if (Array.isArray(response.data)) {
        // If API returns array directly
        inventoryData = response.data;
        totalCount = response.headers['x-total-count'] || inventoryData.length;
      } else {
        // If API returns object with items array
        inventoryData = response.data.items || response.data.data || [];
        totalCount = response.data.total || response.data.totalCount || inventoryData.length;
      }
      
      // Set the inventory data and total count
      commit('SET_INVENTORY', inventoryData);
      commit('SET_TOTAL_COUNT', totalCount);
      
    } catch (error) {
      console.error("Error fetching inventory:", error);
      commit('SET_ERROR', 'Error fetching inventory.');
      
      // Set empty data on error
      commit('SET_INVENTORY', []);
      commit('SET_TOTAL_COUNT', 0);
      
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchInventoryDetail({ commit }, inventoryId) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.get(`/inventory/${inventoryId}`);
      if (response.data.success) {
        commit('SET_INVENTORY_DETAIL', response.data.data);
        return response.data.data; // Return data for direct use
      } else {
        throw new Error('Failed to fetch inventory details');
      }
    } catch (error) {
      console.error('Error fetching inventory detail:', error);
      commit('SET_ERROR', 'Failed to fetch inventory details.');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async saveInventory({ commit }, { inventoryId, inventoryData }) {
    commit('SET_LOADING', true);
    try {
      let response;
      if (inventoryId) {
        response = await apiClient.put(`/inventory/${inventoryId}`, inventoryData);
        commit('UPDATE_INVENTORY', response.data.data);
      } else {
        response = await apiClient.post('/inventory', inventoryData);
        commit('ADD_INVENTORY', response.data.data);
      }
      return response.data.data; // Return the updated/created inventory item
    } catch (error) {
      console.error(`Error ${inventoryId ? 'updating' : 'creating'} inventory:`, error);
      commit('SET_ERROR', `Error ${inventoryId ? 'updating' : 'creating'} inventory.`);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deleteInventory({ commit }, inventoryId) {
    commit('SET_LOADING', true);
    try {
      await apiClient.delete(`/inventory/${inventoryId}`);
      commit('REMOVE_INVENTORY_FROM_LIST', inventoryId);
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      commit('SET_ERROR', 'Error deleting inventory item.');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Action to refresh current page
  async refreshInventory({ dispatch }, currentOptions) {
    return dispatch('fetchInventory', currentOptions);
  },
};

const mutations = {
  SET_INVENTORY(state, inventory) {
    state.inventory = Array.isArray(inventory) ? inventory : [];
  },
  SET_INVENTORY_DETAIL(state, inventoryDetail) {
    state.inventoryDetail = inventoryDetail;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  ADD_INVENTORY(state, inventoryItem) {
    state.inventory.push(inventoryItem);
    state.totalCount += 1;
  },
  UPDATE_INVENTORY(state, updatedInventory) {
    const index = state.inventory.findIndex((item) => item.id === updatedInventory.id);
    if (index !== -1) {
      state.inventory.splice(index, 1, updatedInventory);
    }
  },
  REMOVE_INVENTORY_FROM_LIST(state, inventoryId) {
    state.inventory = state.inventory.filter((item) => item.id !== inventoryId);
    state.totalCount = Math.max(0, state.totalCount - 1);
  },
  SET_ERROR(state, errorMessage) {
    state.error = errorMessage;
  },
  RESET_STATE(state) {
    state.inventory = [];
    state.loading = false;
    state.inventoryDetail = null;
    state.error = null;
    state.totalCount = 0;
  },
  SET_TOTAL_COUNT(state, count) {
    state.totalCount = parseInt(count) || 0;
  },
  CLEAR_ERROR(state) {
    state.error = null;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};