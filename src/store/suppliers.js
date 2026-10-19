import apiClient from "./apiClient"; // Import the Axios instance

const state = {
  suppliers: [],
  loading: false,
  supplierDetail: null,
  supplierInvoices: null,
  loadingSupplierInvoices: false,
};

const getters = {
  allSuppliers: (state) => state.suppliers,
  isLoading: (state) => state.loading,
  supplierDetail: (state) => state.supplierDetail,
  getSupplierById: (state) => (supplierId) => {
    return (
      state.suppliers.find((supplier) => supplier.id === supplierId) || null
    );
  },
  supplierInvoices: (state) => state.supplierInvoices,
  isLoadingSupplierInvoices: (state) => state.loadingSupplierInvoices,
};

const actions = {
  async fetchSuppliers({ commit }) {
    commit("SET_LOADING", true);
    try {
      const response = await apiClient.get("/suppliers");
      commit("SET_SUPPLIERS", response.data.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fetchSupplierDetail({ commit }, supplierId) {
    try {
      const response = await apiClient.get(`/suppliers/${supplierId}`);
      if (response.data.success) {
        commit("SET_SUPPLIER_DETAIL", response.data.data);
      } else {
        throw new Error("Failed to fetch supplier details");
      }
    } catch (error) {
      console.error("Error fetching supplier detail:", error);
      throw error;
    }
  },

  async deleteSupplierFromStore({ commit }, supplierId) {
    try {
      await apiClient.delete(`/suppliers/${supplierId}`);
      commit("REMOVE_SUPPLIER_FROM_LIST", supplierId); // Remove supplier from list
      commit("REMOVE_SUPPLIER"); // Clear supplier detail from state
    } catch (error) {
      console.error("Error deleting supplier:", error);
      throw error;
    }
  },

  // New action to create a supplier
  async createSupplier({ commit }, supplierData) {
    try {
      const response = await apiClient.post("/suppliers", supplierData); // API call to create supplier
      if (response.success) {
        commit("ADD_SUPPLIER", response.data); // Add new supplier to the state
      } else {
        throw new Error("Failed to create supplier");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      throw error;
    }
  },

  // New action to update a supplier
  async updateSupplier({ commit }, { supplierId, supplierData }) {
    try {
      // Sending a PUT request to update the supplier by ID
      const response = await apiClient.put(
        `/suppliers/${supplierId}`,
        supplierData,
      );

      // Check if the request was successful
      if (response.data.success) {
        // Commit the mutation to update the supplier in the state
        commit("UPDATE_SUPPLIER", response.data.data);
      } else {
        throw new Error("Failed to update supplier");
      }
    } catch (error) {
      console.error("Error updating supplier:", error);
      throw error; // Rethrow error to handle it in the component
    }
  },
  async fetchSupplierInvoicesByFY({ commit }, params) {
    const {
      supplierId,
      financialYear = "current",
      page = 1,
      itemsPerPage = 10,
      sortBy = "createdAt",
      sortDesc = true,
      search = "",
    } = params;

    commit("SET_LOADING_SUPPLIER_INVOICES", true);
    try {
      // Build query parameters
      const queryParams = {
        financialYear,
        page,
        itemsPerPage,
        sortBy,
        sortDesc,
      };

      // Only add search parameter if it's not empty
      if (search && search.trim() !== "") {
        queryParams.search = search.trim();
      }

      // Convert params object to query string
      const queryString = Object.keys(queryParams)
        .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
        .join("&");

      const response = await apiClient.get(
        `/suppliers/${supplierId}/invoices?${queryString}`,
      );

      if (response.data.success) {
        commit("SET_SUPPLIER_INVOICES", response.data);
        return response.data;
      } else {
        throw new Error("Failed to fetch supplier invoices");
      }
    } catch (error) {
      console.error("Error fetching supplier invoices by FY:", error);
      throw error;
    } finally {
      commit("SET_LOADING_SUPPLIER_INVOICES", false);
    }
  },

  clearSupplierInvoices({ commit }) {
    commit("SET_SUPPLIER_INVOICES", null);
  },
};

const mutations = {
  SET_SUPPLIERS(state, suppliers) {
    console.log("Setting suppliers in state:", suppliers); // Debugging log
    state.suppliers = suppliers;
  },
  SET_SUPPLIER_DETAIL(state, supplierDetail) {
    state.supplierDetail = supplierDetail;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  REMOVE_SUPPLIER_FROM_LIST(state, supplierId) {
    state.suppliers = state.suppliers.filter(
      (supplier) => supplier.id !== supplierId,
    );
  },
  REMOVE_SUPPLIER(state) {
    state.supplierDetail = null; // Clear supplier detail after deletion
  },

  ADD_SUPPLIER(state, supplier) {
    state.customers.push(supplier); // Add new supplier to the array
  },
  // Mutation to update the supplier in the store
  UPDATE_SUPPLIER(state, updatedSupplier) {
    // Find and update the supplier in the list
    const index = state.customers.findIndex(
      (supplier) => supplier.id === updatedSupplier.id,
    );
    if (index !== -1) {
      state.customers.splice(index, 1, updatedSupplier); // Replace old supplier with updated supplier
    }

    // If the updated supplier is the one in the supplierDetail, update it as well
    if (
      state.supplierDetail &&
      state.supplierDetail.id === updatedSupplier.id
    ) {
      state.supplierDetail = updatedSupplier;
    }
  },
  SET_SUPPLIER_INVOICES(state, data) {
    state.supplierInvoices = data;
  },

  SET_LOADING_SUPPLIER_INVOICES(state, loading) {
    state.loadingSupplierInvoices = loading;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
