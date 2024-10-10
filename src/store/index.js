import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    user: null, // Store user data after login
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user; // Set user mutation
    },
    CLEAR_USER(state) {
      state.user = null; // Clear user data
    },
  },
  actions: {
    async loginUser({ commit }, credentials) {
      return axios
        .post("http://localhost:3001/auth/login", credentials)
        .then((response) => {
          // console.log("Login successful:", response.data);
          commit("SET_USER", response.data.user);
          localStorage.setItem("token", response.data.token); // Save token to localStorage
        })
        .catch((error) => {
          console.log("Error logging in:", error);
          throw error; // Rethrow error for handling in the component
        });
    },
    logoutUser({ commit }) {
      localStorage.removeItem("token"); // Clear the token from localStorage
      commit("CLEAR_USER"); // Clear user data
      return Promise.resolve(); // Ensure it's a Promise for easier handling
    },
  },
  getters: {
    currentUser: (state) => state.user,
    isAuthenticated: (state) => !!state.user, // Boolean check for authentication
  },
});
export default store;
