// src/store/product.js

import apiClient from './apiClient'; // Import the Axios instance

const state = {
  products: [],
  loading: false,
  productDetail: null,
};

const getters = {
  allProducts: (state) => state.products,
  isLoading: (state) => state.loading,
  productDetail: (state) => state.productDetail,
  getProductById: (state) => (productId) => {
    return state.products.find(product => product.id === productId) || null;
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
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async fetchProductDetail({ commit }, productId) {
    try {
      const response = await apiClient.get(`/product/${productId}`);
      if (response.data.success) {
        commit('SET_PRODUCT_DETAIL', response.data.data);
      } else {
        throw new Error('Failed to fetch product details');
      }
    } catch (error) {
      console.error("Error fetching product detail:", error);
      throw error;
    }
  },

  async createProduct({ commit }, productData) {
    try {
      const response = await apiClient.post('/product', productData);
      if (response.data.success) {
        commit('ADD_PRODUCT', response.data.data);
      } else {
        throw new Error('Failed to create product');
      }
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  async updateProduct({ commit }, { productId, productData }) {
    try {
      const response = await apiClient.put(`/product/${productId}`, productData);
      if (response.data.success) {
        commit('UPDATE_PRODUCT', { productId, productData: response.data.data });
      } else {
        throw new Error('Failed to update product');
      }
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async deleteProductFromStore({ commit }, productId) {
    try {
      await apiClient.delete(`/product/${productId}`);
      commit('REMOVE_PRODUCT_FROM_LIST', productId);  // Remove product from list
      commit('REMOVE_PRODUCT');  // Clear product detail from state
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
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
  UPDATE_PRODUCT(state, { productId, productData }) {
    const index = state.products.findIndex(product => product.id === productId);
    if (index !== -1) {
      state.products.splice(index, 1, productData); // Replace the old product with the updated one
    }
  },
  REMOVE_PRODUCT_FROM_LIST(state, productId) {
    state.products = state.products.filter(product => product.id !== productId);
  },
  REMOVE_PRODUCT(state) {
    state.productDetail = null;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
