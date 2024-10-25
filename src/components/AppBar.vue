<template>
  <v-card class="mx-auto overflow-hidden">
 
    <!-- 
    <v-app-bar app color="white" rounded >
     
     
      <v-spacer></v-spacer>
     
    </v-app-bar> -->

    <v-app-bar
      color="orange accent-4"
      dark
      :height="60"
      width="100vw"
      rounded
      v-if="isAuthenticated"
    >
      <v-app-bar-nav-icon @click="toggleDrawer"></v-app-bar-nav-icon>

      <v-btn color="transparent" elevation="0" @click="redirecthome">Dashboard</v-btn>
      <v-spacer></v-spacer>

      <!-- <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-filter</v-icon>
      </v-btn> -->

      <v-btn
        color="error"
        depressed
        @click="logout"
        elevation="2"
        :style="{
          transition: 'box-shadow 0.3s',
          padding: '20px',
          margin: '5px',
        }"
      >
        <span class="mr-2">LOG OUT</span>
        <v-icon>mdi-export</v-icon>
      </v-btn>
    </v-app-bar>
  </v-card>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
export default {
  name: "AppBar",
  data() {
    return {
      drawer: true, 
       // Assign the imported logo to data
    };
  },
  computed: {
    ...mapGetters(["isAuthenticated"]), // Get the isAuthenticated state from Vuex
  },
  methods: {
    toggleDrawer() {
      this.$emit("toggleDrawer"); // Emit an event to toggle the drawer
      console.log('Drawer Pressed')
    },
    ...mapActions(["logoutUser"]),
    logout() {
      this.logoutUser()
        .then(() => {
          // Redirect to the home page after logout
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
}

  },
};
</script>

<style scoped>

</style>
