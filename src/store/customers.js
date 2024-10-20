import axios from 'axios';
const token = localStorage.getItem('token'); // Make sure you have a token
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
  getCustomerDetail: (state) => state.customerDetail,
};

const actions = {
  async fetchCustomers({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('http://localhost:3001/customer', {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in the Authorization header
        },
      });
      commit('SET_CUSTOMERS', response.data.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error; // Re-throw error to handle it in the component
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async fetchCustomerDetail({ commit }, customerId) {
    console.log(`Fetching details for customer ID: ${customerId}`);
    try {
        const response = await axios.get(`http://localhost:3001/customer/${customerId}`, {
            headers: {
                Authorization: `Bearer ${token}`, // Include the token in the request headers
            },
            
        });
        if (response.data.success) {
            commit('SET_CUSTOMER_DETAIL', response.data.data); // Accessing the data property
        } else {
            throw new Error('Failed to fetch customer details');
        }
        console.log("Customer details fetched:", response.data);
    } catch (error) {
        console.error("Error fetching customer detail:", error);
        throw error; // Re-throw error to handle it in the component
    }
},
async deleteCustomerFromStore({ commit }, customerId) {
    try {
      await axios.delete(`http://localhost:3001/customer/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}` // Include the token
        },
      });
      commit('REMOVE_CUSTOMER_FROM_LIST', customerId); // Commit a mutation to remove the customer from the list
      commit('REMOVE_CUSTOMER'); // Clear customer detail from state
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error; // Re-throw the error for the component to handle
    }
  },
  
  
};

const mutations = {
  SET_CUSTOMERS(state, customers) {
    state.customers = customers;
  },
  SET_CUSTOMER_DETAIL(state, customerDetail) { // Add this mutation
    state.customerDetail = customerDetail; // Assuming customerDetail is part of the state
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  REMOVE_CUSTOMER_FROM_LIST(state, customerId) {
    state.customers = state.customers.filter(customer => customer.id !== customerId);
  },
  
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
