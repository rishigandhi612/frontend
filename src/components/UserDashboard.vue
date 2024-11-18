<template>
  <v-container>
    <h1 class="text-center my-4">User Dashboard</h1>

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
      <v-col v-for="(value, key) in dashboardStats" :key="key" cols="12" sm="6" md="4" lg="3">
        <v-card 
          class="mx-auto my-4" 
          :color="getCardColor(key)" 
          dark
          outlined
          tile
          elevation="4"
          hover
        >
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" :color="getCardIconColor(key)">
              {{ getCardIcon(key) }}
            </v-icon>
            {{ key === 'totalCustProd' ? 'Total Invoices' : formatTitle(key) }}
          </v-card-title>

          <v-card-subtitle class="text-h6 font-weight-bold">
            {{ value }}
          </v-card-subtitle>

          <v-card-actions class="justify-end">
            <v-btn color="primary" rounded @click="handleAction(key)" elevation="2">
              View Details
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Show message when no stats are available (fallback case) -->
    <div v-if="!loading && (!dashboardStats.totalCustomers && !dashboardStats.totalProducts && !dashboardStats.totalCustProd)">
      <v-alert type="error" border="left" colored-border>
        No data available.
      </v-alert>
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
      console.log(`Viewing details for ${key}`);
    },
    getCardColor(key) {
      if (key === 'totalCustProd') return 'indigo';
      if (key === 'totalCustomers') return 'green';
      if (key === 'totalProducts') return 'blue';
      return 'grey';
    },
    getCardIconColor(key) {
      if (key === 'totalCustProd') return 'yellow';
      if (key === 'totalCustomers') return 'white';
      if (key === 'totalProducts') return 'white';
      return 'white';
    },
    getCardIcon(key) {
      if (key === 'totalCustProd') return 'mdi-invoice-list'; // New icon for invoices
      if (key === 'totalCustomers') return 'mdi-account-group';
      if (key === 'totalProducts') return 'mdi-cube';
      return 'mdi-account-multiple';
    }
  },
};
</script>

<style scoped>
/* Additional styling to enhance UI */
.v-card {
  transition: transform 0.3s ease;
}

.v-card:hover {
  transform: translateY(-5px);
}

.v-btn {
  transition: background-color 0.2s ease;
}

.v-btn:hover {
  background-color: #3f51b5 !important; /* On hover, make the button slightly more pronounced */
}

.v-row {
  justify-content: center;
}
</style>
