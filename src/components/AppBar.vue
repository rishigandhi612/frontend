<template>
  <v-app-bar app color="orange accent-4" dark elevation="2" flat>
    <!-- Navigation Icon -->
    <v-app-bar-nav-icon @click="toggleDrawer" />

    <!-- Title or Logo -->
    <v-btn color="white" outlined elevation="0" rounded class="app-bar-title" @click="redirecthome">
      <v-icon class="mr-2">mdi-view-dashboard</v-icon> <span>Dashboard</span>
    </v-btn>

    <!-- Spacer -->
    <v-spacer />

    <!-- Logout Button -->
    <v-btn
      color="white"
      outlined
      @click="logout"
      class="logout-btn"
    >
      <span>Log Out</span>
      <v-icon class="ml-2">mdi-export</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
export default {
  name: "AppBar",
  data() {
    return {
      drawer: true,
    };
  },
  computed: {
    ...mapGetters(["isAuthenticated"]),
  },
  methods: {
    toggleDrawer() {
      this.$emit("toggleDrawer");
    },
    ...mapActions(["logoutUser"]),
    logout() {
      this.logoutUser()
        .then(() => {
          this.$router.push("/");
        })
        .catch((error) => {
          console.log("Logout failed:", error);
        });
    },
    redirecthome() {
      if (this.$route.path !== "/dashboard") {
        this.$router.push("/dashboard");
      }
    },
  },
};
</script>

<style scoped>
.app-bar-title {
  font-size: 18px;
  font-weight: 500;
  text-transform: uppercase;
}

.logout-btn {
  transition: all 0.3s ease-in-out;
  padding: 10px 20px;
}

.logout-btn:hover {
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
}
</style>
