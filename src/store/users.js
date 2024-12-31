import apiClient from "./apiClient";

const state = {
  users: [], // Array to store user data
  userDetail: null, // Object to store details of a single user
  loading: false, // Global loading state
};

const getters = {
  allUsers: (state) => state.users || [], // Getter to retrieve all users
  userDetail: (state) => state.userDetail, // Getter to retrieve single user detail
  isLoading: (state) => state.loading, // Getter to check if loading
};

const actions = {
  // Fetch all users
  async fetchUsers({ commit }) {
    commit("SET_LOADING", true); // Set loading to true
    try {
      const response = await apiClient.get("/user"); // API call to fetch users
    //   console.log("Fetched users:", response); // Debug log
      if (response && Array.isArray(response.data.data)) {
        commit("SET_USERS", response.data.data); // Commit the user list
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      commit("SET_LOADING", false); // Ensure loading is stopped on error
      throw error; // Rethrow error for further handling
    } finally {
      commit("SET_LOADING", false); // Set loading to false regardless of success/failure
    }
  },

  // Fetch a single user's details by ID
  async fetchUserDetail({ commit }, id) {
    commit("SET_LOADING", true); // Set loading to true
    try {
      const response = await apiClient.get(`/user/${id}`); // API call to fetch user by ID
      if (response.data) {
        commit("SET_USER_DETAIL", response.data.data); // Commit the user detail to the store
      } else {
        throw new Error("Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      commit("SET_LOADING", false); // Stop the loading spinner on error
      throw error; // Rethrow the error
    } finally {
      commit("SET_LOADING", false); // Set loading to false regardless of success/failure
    }
  },

  // Create a new user
  async createUser({ commit }, userData) {
    commit("SET_LOADING", true); // Set loading to true
    try {
      const response = await apiClient.post("/user/register", userData); // API call to register a user
      if (response.data.success) {
        commit("ADD_USER", response.data.data); // Commit the new user to the state
      } else {
        throw new Error("Failed to register user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      commit("SET_LOADING", false); // Stop the loading spinner on error
      throw error; // Rethrow the error
    } finally {
      commit("SET_LOADING", false); // Set loading to false regardless of success/failure
    }
  },
  // Update a user's details
  async updateUser({ commit }, { userId, userData }) {
    commit("SET_LOADING", true); // Set loading to true
    console.log(`Updating user with ID: ${userId}`); // Log userId to check
    try {
      const response = await apiClient.put(`/user/${userId}`, userData); // API call to update a user
      if (response.data.success) {
        commit("UPDATE_USER", response.data.data); // Commit the updated user to the store
      } else {
        throw new Error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      commit("SET_LOADING", false); // Stop the loading spinner on error
      throw error; // Rethrow the error
    } finally {
      commit("SET_LOADING", false); // Set loading to false regardless of success/failure
    }
  },

  // Delete a user
  async deleteUser({ commit }, id) {
    commit("SET_LOADING", true); // Set loading to true
    try {
      const response = await apiClient.delete(`/user/${id}`); // API call to delete a user
      if (response.data.success) {
        commit("REMOVE_USER", id); // Commit the deletion to the store
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      commit("SET_LOADING", false); // Stop the loading spinner on error
      throw error; // Rethrow the error
    } finally {
      commit("SET_LOADING", false); // Set loading to false regardless of success/failure
    }
  },
};

const mutations = {
  // Set the list of users
  SET_USERS(state, users) {
    state.users = users; // Set the user list
  },

  // Set the details of a single user
  SET_USER_DETAIL(state, user) {
    state.userDetail = user; // Set the user detail
  },

  // Add a new user
  ADD_USER(state, user) {
    state.users.push(user); // Add a new user to the list
  },

  // Update an existing user
  UPDATE_USER(state, updatedUser) {
    const index = state.users.findIndex((user) => user._id === updatedUser._id); // Find the user to update
    if (index !== -1) {
      state.users.splice(index, 1, updatedUser); // Update the user in the list
    }
    if (state.userDetail && state.userDetail._id === updatedUser._id) {
      state.userDetail = updatedUser; // Update the user detail if it matches
    }
  },

  // Remove a user
  REMOVE_USER(state, id) {
    state.users = state.users.filter((user) => user._id !== id); // Remove the user from the list
    if (state.userDetail && state.userDetail._id === id) {
      state.userDetail = null; // Clear the userDetail if it matches the deleted user
    }
  },

  // Set the loading state
  SET_LOADING(state, loading) {
    state.loading = loading; // Set the loading state
  },
};

export default {
  namespaced: true, // Ensure the module is namespaced
  state,
  getters,
  actions,
  mutations,
};
