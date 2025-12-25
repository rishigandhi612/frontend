<template>
  <v-container>
    <h1 class="text-center my-4">User Dashboard</h1>

    <!-- Loading Spinner -->
    <v-row
      v-if="loading"
      class="d-flex justify-center align-center"
      style="height: 80vh"
    >
      <v-progress-circular indeterminate color="primary" size="50" />
    </v-row>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Dashboard Stats Cards -->
      <v-row>
        <v-col
          v-for="(value, key) in dashboardStats"
          :key="key"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="mx-auto my-4"
            :color="config[key]?.color || 'grey'"
            dark
            outlined
            tile
            elevation="4"
            hover
          >
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" :color="config[key]?.iconColor || 'white'">
                {{ config[key]?.icon || "mdi-help-circle-outline" }}
              </v-icon>
              {{ config[key]?.title || formatTitle(key) }}
            </v-card-title>

            <v-card-subtitle class="text-h6 font-weight-bold">
              {{ value }}
            </v-card-subtitle>

            <v-card-actions class="justify-end">
              <v-btn
                color="primary"
                rounded
                @click="handleAction(key)"
                elevation="2"
              >
                {{ config[key]?.buttonText || "View Details" }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Send PO Card -->
        <v-col cols="12" sm="6" md="4" lg="3">
          <v-card
            class="mx-auto my-4"
            color="pink"
            dark
            outlined
            tile
            elevation="4"
            hover
          >
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" color="white"> mdi-email-send </v-icon>
              Send Purchase Order
            </v-card-title>

            <v-card-subtitle class="text-h6 font-weight-bold">
              Create & Send PO
            </v-card-subtitle>

            <v-card-actions class="justify-end">
              <v-btn
                color="primary"
                rounded
                @click="$router.push('/SendPurchaseOrder')"
                elevation="2"
              >
                Send PO
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      <!-- No Data Message -->
      <v-alert v-if="hasNoData" type="error" border="left" colored-border>
        No data available.
      </v-alert>

      <!-- Error Message -->
      <v-alert v-if="error" type="error" border="left" colored-border>
        Error loading dashboard stats: {{ error }}. Please try again later.
      </v-alert>
    </div>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      loading: true,
      error: null,
      config: {
        totalCustProd: {
          title: "Total Invoices",
          icon: "mdi-invoice-list",
          iconColor: "yellow",
          color: "indigo",
          buttonText: "View Invoices",
          route: "/invoice",
        },
        totalCustomers: {
          title: "Total Customers",
          icon: "mdi-account-group",
          iconColor: "white",
          color: "green",
          buttonText: "View Customers",
          route: "/customer",
        },
        totalProducts: {
          title: "Total Products",
          icon: "mdi-cube",
          iconColor: "white",
          color: "blue",
          buttonText: "View Products",
          route: "/product",
        },
        totalUsers: {
          title: "Total Users",
          icon: "mdi-account-multiple-check",
          iconColor: "white",
          color: "deep-orange",
          buttonText: "View Users",
          route: "/user",
        },
        totalInventory: {
          title: "Total Inventory",
          icon: "mdi-store",
          iconColor: "white",
          color: "purple",
          buttonText: "View Inventory",
          route: "/inventory",
        },
        totalTransactions: {
          title: "Total Transactions",
          icon: "mdi-transfer",
          iconColor: "white",
          color: "cyan",
          buttonText: "View Transactions",
          route: "/transaction",
        },
        totalTransporters: {
          title: "Total Transporters",
          icon: "mdi-truck",
          iconColor: "white",
          color: "teal",
          buttonText: "View Transporters",
          route: "/transporter",
        },
        totalBanks: {
          title: "Total Banks",
          icon: "mdi-bank",
          iconColor: "white",
          color: "light-blue darken-2",
          buttonText: "View Banks",
          route: "/bank",
        },
        availableInventory: {
          title: "Available Inventory",
          icon: "mdi-store-check",
          iconColor: "white",
          color: "green",
          buttonText: "View Available Inventory",
          route: "/inventory",
        },
        reservedInventory: {
          title: "Reserved Inventory",
          icon: "mdi-store-clock",
          iconColor: "white",
          color: "orange",
          buttonText: "View Reserved Inventory",
          route: "/inventory",
        },
        damagedInventory: {
          title: "Damaged Inventory",
          icon: "mdi-store-remove",
          iconColor: "white",
          color: "red",
          buttonText: "View Damaged Inventory",
          route: "/inventory",
        },
      },
    };
  },
  computed: {
    ...mapGetters("dashboard", ["dashboardStats"]),
    hasNoData() {
      return (
        Object.keys(this.dashboardStats).length &&
        Object.values(this.dashboardStats).every((val) => val === 0)
      );
    },
  },
  created() {
    this.fetchStats();
  },
  methods: {
    async fetchStats() {
      try {
        await this.$store.dispatch("dashboard/fetchDashboardStats");
      } catch (error) {
        this.error = error.message || "Unable to fetch stats";
      } finally {
        this.loading = false;
      }
    },
    formatTitle(key) {
      return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
    },
    handleAction(key) {
      const route = this.config[key]?.route;
      if (route) {
        if (this.$route.path !== route) {
          this.$router.push(route).catch((err) => {
            if (err.name !== "NavigationDuplicated") {
              console.error(`Navigation error: ${err.message}`);
            }
          });
        }
      } else {
        console.warn(`No route defined for key: ${key}`);
      }
    },
  },
};
</script>

<style scoped>
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
  background-color: #3f51b5 !important;
}
</style>
