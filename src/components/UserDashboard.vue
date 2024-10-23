<template>
  <v-container>
    <h1>User Dashboard</h1>
    <v-row>
      <v-col v-for="(value, key) in dashboardStats" :key="key" cols="12" sm="6" md="3">
        <v-card class="mx-auto" color="lightgrey">
          <v-card-title>{{ formatTitle(key) }}</v-card-title>
          <v-card-subtitle>{{ value }}</v-card-subtitle>
          <v-card-actions>
            <v-btn color="primary" rounded @click="handleAction(key)">View Details</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <div v-if="!dashboardStats.totalCustomers && !dashboardStats.totalProducts">
      Loading...
    </div>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters('dashboard', ['dashboardStats']),
  },
  created() {
    this.fetchStats();
  },
  methods: {
    fetchStats() {
      this.$store.dispatch('dashboard/fetchDashboardStats');
    },
    formatTitle(key) {
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()); // Format the title from camelCase
    },
    handleAction(key) {
      if (key === 'totalCustomers') {
        this.$router.push('/customer'); // Navigate to /customer
      }
      if (key === 'totalProducts') {
        this.$router.push('/product'); // Navigate to /customer
      }
      // You can add more conditions for other keys if needed
      console.log(`Viewing details for ${key}`);
    },
  },
};
</script>

<style scoped>
/* Add any additional styles here if necessary */
</style>
