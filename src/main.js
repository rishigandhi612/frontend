import Vue from 'vue';
import App from './App.vue';
import router from './router'; // Import router
import store from './store'; // Import store
import vuetify from './plugins/vuetify'


Vue.config.productionTip = false;

new Vue({
  // Make sure the router is initialized here
  router,

  // Use the Vuex store
  store,

  vuetify,
  render: h => h(App)
}).$mount('#app');
