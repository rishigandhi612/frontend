<template>
  <v-container fluid>
    <v-row>
      <v-col md="2" cols="12">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12">
        <h1 class="text-center">Invoice List</h1>

        <!-- Search field -->
        <v-text-field
          v-model="searchQuery"
          append-icon="mdi-magnify"
          label="Search invoices"
          single-line
          hide-details
          class="mb-4"
        ></v-text-field>

        <v-data-table
          ref="dataTable"
          :headers="headers"
          :items="allInvoices"
          :options.sync="tableOptions"
          :server-items-length="pagination.totalItems"
          :loading="loading"
          :footer-props="{
            'items-per-page-options': [5, 10, 15, 20],
          }"
          @update:options="handleTableOptionsChange"
          class="elevation-1"
        >
          <template v-slot:item="{ item }">
            <tr
              @click="navigateToInvoiceDetail(item._id)"
              style="cursor: pointer"
            >
              <td>{{ item.invoiceNumber ? item.invoiceNumber : "N/A" }}</td>
              <td>{{ item.customer ? item.customer.name : "N/A" }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>₹ {{ item.grandTotal }}</td>
              <td>
                <v-btn small icon @click.stop="navigateToEditInvoice(item._id)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
      <v-col md="2" cols="12">
        <v-row>
          <v-col md="12" cols="12">
            <!-- Refresh Button -->
            <v-btn @click="refreshInvoices" color="primary" block>
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
          </v-col>
          <v-col md="12" cols="12">
            <!-- Add Invoice Button -->
            <v-btn @click="navigateToAddInvoice" color="success" block>
              <v-icon>mdi-plus</v-icon> Add Invoice
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import debounce from "lodash/debounce";

export default {
  name: "InvoiceList",
  data() {
    return {
      headers: [
        { text: "Invoice No.", value: "invoiceNumber" },
        { text: "Customer Name", value: "customerName" },
        { text: "Date", value: "date" },
        { text: "Total Amount", value: "totalAmount" },
        { text: "Actions", value: "actions", sortable: false },
      ],
      loading: false,
      tableOptions: {
        page: 1,
        itemsPerPage: 10,
        sortBy: ["createdAt"],
        sortDesc: [true],
      },
      searchQuery: "",
      fetchInitiated: false, // Flag to prevent duplicate initial fetches
      isTableUpdating: false, // Flag to prevent double calls from table options
    };
  },
  computed: {
    ...mapGetters("invoices", ["allInvoices", "isLoading", "pagination"]),
  },
  created() {
    // Only set up watchers - don't fetch data here
    this.setupWatchers();
  },
  mounted() {
    // Initial data fetch - only do this once
    if (!this.fetchInitiated) {
      this.fetchInitiated = true;
      this.initializeStore();
    }
    
    // Add event listener for debugging
    this.$nextTick(() => {
      if (this.$refs.dataTable) {
        console.log("Data table mounted and available");
      }
    });
  },
  watch: {
    isLoading(newLoading) {
      this.loading = newLoading;
    },
    // Watch for search changes with debounce
    searchQuery: debounce(function(newValue) {
      if (this.fetchInitiated) {
        // Don't trigger on component initialization
        this.$store.dispatch("invoices/setSearch", newValue);
        // Reset to page 1 when searching
        if (this.tableOptions.page !== 1) {
          this.tableOptions.page = 1;
        } else {
          // If already on page 1, manually trigger fetch
          this.fetchInvoices();
        }
      }
    }, 500)
  },
  methods: {
    setupWatchers() {
      // Setting up debounced search here avoids unnecessary initial calls
    },
    
    initializeStore() {
      // Set initial store state without triggering fetch
      this.$store.commit("invoices/SET_PAGE", this.tableOptions.page);
      this.$store.commit("invoices/SET_ITEMS_PER_PAGE", this.tableOptions.itemsPerPage);
      this.$store.commit("invoices/SET_SORTING", {
        sortBy: this.tableOptions.sortBy[0],
        sortDesc: this.tableOptions.sortDesc[0],
      });
      this.$store.commit("invoices/SET_SEARCH", this.searchQuery);
      
      // Now fetch data once
      this.fetchInvoices();
    },

    async fetchInvoices() {
      console.log("Fetching invoices with page:", this.$store.state.invoices.pagination.page);
      this.loading = true;
      try {
        await this.$store.dispatch("invoices/fetchInvoices");
        console.log("Fetch complete, got invoices:", this.allInvoices.length);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        this.loading = false;
      }
    },

    async refreshInvoices() {
      // Reset to first page when refreshing
      this.tableOptions.page = 1;
      await this.fetchInvoices();
    },

    handleTableOptionsChange(options) {
      // Prevent multiple calls by checking if we're already updating
      if (this.isTableUpdating) return;
      
      this.isTableUpdating = true;
      
      // For debugging
      console.log("Table options changed:", options);
      
      // Always proceed if we're initialized to ensure pagination works
      if (this.fetchInitiated) {
        // Update page
        this.$store.commit("invoices/SET_PAGE", options.page);

        // Update items per page
        this.$store.commit("invoices/SET_ITEMS_PER_PAGE", options.itemsPerPage);

        // Update sorting
        if (options.sortBy && options.sortBy.length > 0) {
          this.$store.commit("invoices/SET_SORTING", {
            sortBy: options.sortBy[0],
            sortDesc: options.sortDesc[0],
          });
        }

        // Always fetch data when table options change
        this.fetchInvoices();
      }
      
      // Reset flag after a short delay to ensure we don't miss events
      setTimeout(() => {
        this.isTableUpdating = false;
      }, 50);
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },

    navigateToInvoiceDetail(invoiceId) {
      this.$router.push(`/invoice/${invoiceId}`);
    },

    navigateToEditInvoice(invoiceId) {
      this.$router.push(`/addinvoice/${invoiceId}`);
    },

    navigateToAddInvoice() {
      this.$router.push("/addinvoice");
    },

    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>

<style scoped>
/* Add any necessary styles here */
</style>