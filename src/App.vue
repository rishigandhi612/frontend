<template>
  <v-app>
    <!-- Top App Bar -->
    <AppBar/>

    <!-- Navigation Drawer (placed below the App Bar) -->
    
     
    
    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import AppBar from './components/AppBar.vue';

export default {
  components: {
    AppBar,
  },
  data() {
    return {};  
  },
};
</script>

<style scoped>
/* Custom styles for app layout */
</style>
