// Vuex module for global snackbar notifications
const state = {
  visible: false,
  message: "",
  color: "info",
  timeout: 3000,
};

const mutations = {
  SHOW_SNACKBAR(state, { message, color = "info", timeout = 3000 }) {
    state.message = message;
    state.color = color;
    state.timeout = timeout;
    state.visible = true;
  },
  HIDE_SNACKBAR(state) {
    state.visible = false;
  },
};

const actions = {
  showSnackbar({ commit }, payload) {
    commit("SHOW_SNACKBAR", payload);
  },
  hideSnackbar({ commit }) {
    commit("HIDE_SNACKBAR");
  },
};

const getters = {
  snackbarState: (state) => state,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
