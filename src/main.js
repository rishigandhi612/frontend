import Vue from 'vue';
import App from './App.vue';
import router from './router'; // Import router
import store from './store'; // Import store
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';


Vue.config.productionTip = false;

new Vue({
  router, // Make sure the router is initialized here
  store, // Use the Vuex store
  render: h => h(App),
}).$mount('#app');
