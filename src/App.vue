<template>
  <v-app>
    <!-- Top App Bar -->

    <v-app-bar v-if="isAuthenticated" app elevation="0" shaped
      ><AppBar @toggleDrawer="drawer = !drawer" />
    </v-app-bar>
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
              src="../src/assets/HoloLogo.png"
              transition="scale-transition"
              width="55"
            />
          </v-list-item-avatar>
        </v-list-item>

        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title class="text-h6">Rishi Gandhi</v-list-item-title>
            <v-list-item-subtitle
              >rishigandhi021@gmail.com</v-list-item-subtitle
            >
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list nav dense>
        <v-list-item link @click="$router.push('/customer')">
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
            <v-icon>mdi-invoice-list-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Invoices</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="$router.push('/user')">
          <v-list-item-icon>
            <v-icon>mdi-account</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Users</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="$router.push('/inventory')">
          <v-list-item-icon>
            <v-icon>mdi-store-check</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Inventory</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="$router.push('/transporter')">
          <v-list-item-icon>
            <v-icon>mdi-truck</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Transporters</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="$router.push('/SendPurchaseOrder')">
          <v-list-item-icon>
            <v-icon>mdi-order-numeric-ascending</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Purchase Order</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="$router.push('/monthlysummary')">
          <v-list-item-icon>
            <v-icon>mdi-chart-histogram</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Sales Summary</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="$router.push('/visualdata')">
          <v-list-item-icon>
            <v-icon>mdi-google-analytics</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Data Analytics</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="$router.push('/customer-invoices')">
          <v-list-item-icon>
            <v-icon>mdi-google-analytics</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Customer Invoices</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="pt-16">
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { mapGetters } from "vuex";
import AppBar from "./components/AppBar.vue";

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
