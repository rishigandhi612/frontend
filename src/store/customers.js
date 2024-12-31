import apiClient from './apiClient'; // Import the Axios instance

const state = {
  customers: [],
  loading: false,
  customerDetail: null,
};

const getters = {
  allCustomers: (state) => state.customers,
  isLoading: (state) => state.loading,
  customerDetail: (state) => state.customerDetail,
  getCustomerById: (state) => (customerId) => {
    return state.customers.find(customer => customer.id === customerId) || null;
  },
};

const actions = {
  async fetchCustomers({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.get('/customer');
      commit('SET_CUSTOMERS', response.data.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchCustomerDetail({ commit }, customerId) {
    try {
      const response = await apiClient.get(`/customer/${customerId}`);
      if (response.data.success) {
        commit('SET_CUSTOMER_DETAIL', response.data.data);
      } else {
        throw new Error('Failed to fetch customer details');
      }
    } catch (error) {
      console.error("Error fetching customer detail:", error);
      throw error;
    }
  },

  async deleteCustomerFromStore({ commit }, customerId) {
    try {
      await apiClient.delete(`/customer/${customerId}`);
      commit('REMOVE_CUSTOMER_FROM_LIST', customerId);  // Remove customer from list
      commit('REMOVE_CUSTOMER');  // Clear customer detail from state
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },

  // New action to create a customer
  async createCustomer({ commit }, customerData) {
    try {
      const response = await apiClient.post('/customer', customerData); // API call to create customer
      if (response.data.success) {
        commit('ADD_CUSTOMER', response.data.data); // Add new customer to the state
      } else {
        throw new Error('Failed to create customer');
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },

  // New action to update a customer
  async updateCustomer({ commit }, { customerId, customerData }) {
    try {
      // Sending a PUT request to update the customer by ID
      const response = await apiClient.put(`/customer/${customerId}`, customerData); 

      // Check if the request was successful
      if (response.data.success) {
        // Commit the mutation to update the customer in the state
        commit('UPDATE_CUSTOMER', response.data.data); 
      } else {
        throw new Error('Failed to update customer');
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error; // Rethrow error to handle it in the component
    }
  },
};

const mutations = {
  SET_CUSTOMERS(state, customers) {
    state.customers = customers;
  },
  SET_CUSTOMER_DETAIL(state, customerDetail) {
    state.customerDetail = customerDetail;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  REMOVE_CUSTOMER_FROM_LIST(state, customerId) {
    state.customers = state.customers.filter(customer => customer.id !== customerId);
  },
  REMOVE_CUSTOMER(state) {
    state.customerDetail = null; // Clear customer detail after deletion
  },
  
  ADD_CUSTOMER(state, customer) {
    state.customers.push(customer); // Add new customer to the array
  },
  // Mutation to update the customer in the store
  UPDATE_CUSTOMER(state, updatedCustomer) {
    // Find and update the customer in the list
    const index = state.customers.findIndex(customer => customer.id === updatedCustomer.id);
    if (index !== -1) {
      state.customers.splice(index, 1, updatedCustomer); // Replace old customer with updated customer
    }

    // If the updated customer is the one in the customerDetail, update it as well
    if (state.customerDetail && state.customerDetail.id === updatedCustomer.id) {
      state.customerDetail = updatedCustomer;
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
