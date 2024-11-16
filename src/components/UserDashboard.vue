<template>
  <v-container>
    <h1>User Dashboard</h1>

    <!-- Show loader if dashboardStats are not loaded -->
    <v-row
      v-if="loading"
      class="d-flex justify-center align-center"
      style="height: 80vh;" 
    >
      <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
    </v-row>

    <!-- Show dashboard stats once data is loaded -->
    <v-row v-else>
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

    <!-- Show message when no stats are available (fallback case) -->
    <div v-if="!loading && !dashboardStats.totalCustomers && !dashboardStats.totalProducts">
      No data available.
    </div>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      loading: true, // Initially set loading state to true
    };
  },
  computed: {
    ...mapGetters('dashboard', ['dashboardStats']),
  },
  created() {
    this.fetchStats();
  },
  methods: {
    fetchStats() {
      // Simulate loading state while fetching data
      this.$store.dispatch('dashboard/fetchDashboardStats')
        .then(() => {
          // Once data is fetched, set loading to false
          this.loading = false;
        })
        .catch(() => {
          // Handle error in case of failure
          this.loading = false;
        });
    },
    formatTitle(key) {
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()); // Format the title from camelCase
    },
    handleAction(key) {
      if (key === 'totalCustomers') {
        this.$router.push('/customer'); // Navigate to /customer
      }
      if (key === 'totalProducts') {
        this.$router.push('/product'); // Navigate to /product
      }
      if (key === 'totalCustProd') {
        this.$router.push('/invoice'); // Navigate to /invoice
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
