import apiClient from './apiClient';

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
    async fetchUsers({ commit }) {
        commit('SET_LOADING', true); // Set loading to true
        try {
          const response = await apiClient.get('/user'); // API call to fetch users
          if (response && response.data) {
            commit('SET_USERS', response.data); // Commit the user list
          } else {
            throw new Error('Failed to fetch users');
          }
        } catch (error) {
          console.error('Error fetching users:', error);
          commit('SET_LOADING', false); // Ensure loading is stopped on error
          throw error; // Rethrow error for further handling
        } finally {
          commit('SET_LOADING', false); // Set loading to false regardless of success/failure
        }
      },      

  async fetchUserDetail({ commit }, id) {
    commit('SET_LOADING', true); // Set loading to true
    try {
      const response = await apiClient.get(`/users/${id}`); // API call to fetch a user by ID
      if (response.data.success) {
        commit('SET_USER_DETAIL', response.data.data); // Commit the user detail
      } else {
        throw new Error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    } finally {
      commit('SET_LOADING', false); // Set loading to false
    }
  },

  async createUser({ commit }, userData) {
    commit('SET_LOADING', true); // Set loading to true
    try {
      const response = await apiClient.post('/users', userData); // API call to create a user
      if (response.data.success) {
        commit('ADD_USER', response.data.data); // Commit the new user to the state
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      commit('SET_LOADING', false); // Set loading to false
    }
  },

  async updateUser({ commit }, { id, userData }) {
    commit('SET_LOADING', true); // Set loading to true
    try {
      const response = await apiClient.put(`/users/${id}`, userData); // API call to update a user
      if (response.data.success) {
        commit('UPDATE_USER', response.data.data); // Commit the updated user
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      commit('SET_LOADING', false); // Set loading to false
    }
  },

  async deleteUser({ commit }, id) {
    commit('SET_LOADING', true); // Set loading to true
    try {
      const response = await apiClient.delete(`/users/${id}`); // API call to delete a user
      if (response.data.success) {
        commit('REMOVE_USER', id); // Commit the deletion
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    } finally {
      commit('SET_LOADING', false); // Set loading to false
    }
  },
};

const mutations = {
  SET_USERS(state, users) {
    state.users = users; // Set the user list
  },
  SET_USER_DETAIL(state, user) {
    state.userDetail = user; // Set the single user detail
  },
  ADD_USER(state, user) {
    state.users.push(user); // Add a new user to the list
  },
  UPDATE_USER(state, updatedUser) {
    const index = state.users.findIndex((user) => user._id === updatedUser._id); // Find the user to update
    if (index !== -1) {
      state.users.splice(index, 1, updatedUser); // Update the user in the list
    }
    if (state.userDetail && state.userDetail._id === updatedUser._id) {
      state.userDetail = updatedUser; // Update the user detail if it matches
    }
  },
  REMOVE_USER(state, id) {
    state.users = state.users.filter((user) => user._id !== id); // Remove the user from the list
    if (state.userDetail && state.userDetail._id === id) {
      state.userDetail = null; // Clear userDetail if it matches the deleted user
    }
  },
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
