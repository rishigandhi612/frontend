<template>
  <v-app-bar app color="white" rounded v-if="isAuthenticated">
    <v-img
      alt="Holo Logo"
      class="shrink mr-2"
      contain
      src='../assets/HoloLogo.png'
      transition="scale-transition"
      width="55"
    />
    <v-divider class="mx-2" vertical />
    <v-spacer></v-spacer>
    <v-btn
      color="error"
      depressed
      @click="logout"
      elevation="2"
      :style="{ transition: 'box-shadow 0.3s' }"
    >
      <span class="mr-2">LOG OUT</span>
      <v-icon>mdi-export</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'AppBar',
  computed: {
    ...mapGetters(['isAuthenticated']), // Get the isAuthenticated state from Vuex
  },
  methods: {
    ...mapActions(['logoutUser']),
    logout() {
      this.logoutUser()
        .then(() => {
          // Redirect to the home page after logout
          this.$router.push('/');
        })
        .catch((error) => {
          console.log('Logout failed:', error);
        });
    },
  },
};
</script>

<style scoped>
/* Add any additional styles for the app bar here */
</style>
