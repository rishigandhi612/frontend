import apiClient from './apiClient'; // Import the Axios instance

const state = {
  products: [],
  loading: false,
  productDetail: null,
  error: null,  // Add error state
};

const getters = {
  allProducts: (state) => state.products,
  isLoading: (state) => state.loading,
  productDetail: (state) => state.productDetail,
  getProductById: (state) => (productId) => {
    return state.products.find((product) => product.id === productId) || null;
  },
};

const actions = {
  async fetchProducts({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.get('/product');
      commit('SET_PRODUCTS', response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      commit('SET_ERROR', 'Error fetching products.');  // Set error message
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchProductDetail({ commit }, productId) {
    commit('SET_LOADING', true);
    try {
      const response = await apiClient.get(`/product/${productId}`);
      if (response.data.success) {
        commit('SET_PRODUCT_DETAIL', response.data.data);
        return response.data.data; // Return data for direct use
      } else {
        throw new Error('Failed to fetch product details');
      }
    } catch (error) {
      console.error('Error fetching product detail:', error);
      commit('SET_ERROR', 'Failed to fetch product details.'); // Set error message
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async saveProduct({ commit }, { productId, productData }) {
    commit('SET_LOADING', true);
    try {
      let response;
      if (productId) {
        response = await apiClient.put(`/product/${productId}`, productData);
        commit('UPDATE_PRODUCT', response.data.data);
      } else {
        response = await apiClient.post('/product', productData);
        commit('ADD_PRODUCT', response.data.data);
      }
      return response.data.data; // Optionally return the updated/created product
    } catch (error) {
      console.error(`Error ${productId ? 'updating' : 'creating'} product:`, error);
      commit('SET_ERROR', `Error ${productId ? 'updating' : 'creating'} product.`); // Set error message
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async deleteProduct({ commit }, productId) {
    commit('SET_LOADING', true);
    try {
      await apiClient.delete(`/product/${productId}`);
      commit('REMOVE_PRODUCT_FROM_LIST', productId);
    } catch (error) {
      console.error("Error deleting product:", error);
      commit('SET_ERROR', 'Error deleting product.'); // Set error message
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
};

const mutations = {
  SET_PRODUCTS(state, products) {
    state.products = products;
  },
  SET_PRODUCT_DETAIL(state, productDetail) {
    state.productDetail = productDetail;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  ADD_PRODUCT(state, product) {
    state.products.push(product);
  },
  UPDATE_PRODUCT(state, updatedProduct) {
    const index = state.products.findIndex((product) => product.id === updatedProduct.id);
    if (index !== -1) {
      state.products.splice(index, 1, updatedProduct);
    }
  },
  REMOVE_PRODUCT_FROM_LIST(state, productId) {
    state.products = state.products.filter((product) => product.id !== productId);
  },
  SET_ERROR(state, errorMessage) {
    state.error = errorMessage;  // Commit error message
  },
  RESET_STATE(state) {
    state.products = [];
    state.loading = false;
    state.productDetail = null;
    state.error = null;  // Reset error state
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
