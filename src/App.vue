<template>
  <v-app>
    <!-- Top App Bar -->
    <AppBar @toggleDrawer="drawer = !drawer"/>

    <!-- Navigation Drawer (placed below the App Bar) -->
    
    <v-navigation-drawer
      app
      temporary
      v-if="isAuthenticated"
      v-model="drawer"
      bottom
    >
      <v-list>
        <v-list-item class="px-2">
          <v-list-item-avatar>
            <v-img
              alt="Holo Logo"
              class=""
              contain
              src='../src/assets/HoloLogo.png'
              transition="scale-transition"
              width="55"
            />
          </v-list-item-avatar>
        </v-list-item>

        <v-list-item link >
          <v-list-item-content>
            <v-list-item-title class="text-h6">Sandra Adams</v-list-item-title>
            <v-list-item-subtitle>sandra_a88@gmail.com</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list nav dense>
        <v-list-item link @click="$router.push('/customer')" >
          <v-list-item-icon>
            <v-icon>mdi-account-multiple</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Customers</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="$router.push('/product')">
          <v-list-item-icon>
            <v-icon>mdi-pi-box</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Products</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="$router.push('/invoice')"> 
          <v-list-item-icon>
            <v-icon>mdi-star</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Invoices</v-list-item-title>
        </v-list-item>
        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-account</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Users</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    
    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { mapGetters } from "vuex";
import AppBar from './components/AppBar.vue';


export default {
  components: {
    AppBar,
  },
  data() {
    return {
      drawer: false,
    };  
  },
  computed: {
    ...mapGetters(["isAuthenticated"]), // Get the isAuthenticated state from Vuex
  },
};
</script>

<style scoped>
/* Custom styles for app layout */
</style>
