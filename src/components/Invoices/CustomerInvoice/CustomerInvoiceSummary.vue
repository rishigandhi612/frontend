<template>
  <v-container fluid>
    <v-row>
      <!-- Back Button -->
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>

      <!-- Main Content -->
      <v-col cols="12" md="8">
        <h1 class="text-center mb-4">Customer Invoice History</h1>

        <!-- Customer Selection Card -->
        <v-card class="mb-4" elevation="2">
          <v-card-title class="primary white--text">
            <v-icon left color="white">mdi-account-search</v-icon>
            Select Customer & Financial Year
          </v-card-title>
          <v-card-text class="pt-4">
            <v-row>
              <!-- Customer Autocomplete -->
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="selectedCustomerId"
                  :items="allCustomers"
                  :loading="isLoadingCustomers"
                  :search-input.sync="customerSearch"
                  item-text="name"
                  item-value="_id"
                  label="Select Customer"
                  prepend-icon="mdi-account"
                  clearable
                  outlined
                  dense
                  :disabled="loadingInvoices"
                >
                  <template v-slot:item="{ item }">
                    <v-list-item-content>
                      <v-list-item-title>{{ item.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ item.email_id }} | {{ item.phone_no }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </template>
                  <template v-slot:selection="{ item }">
                    <span>{{ item.name }}</span>
                  </template>
                </v-autocomplete>
              </v-col>

              <!-- Financial Year Selection -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedFinancialYear"
                  :items="financialYearOptions"
                  label="Financial Year"
                  prepend-icon="mdi-calendar"
                  outlined
                  dense
                  :disabled="!selectedCustomerId || loadingInvoices"
                ></v-select>
              </v-col>
            </v-row>

            <!-- Fetch Button -->
            <v-row>
              <v-col cols="12" class="text-center">
                <v-btn
                  color="primary"
                  :disabled="!selectedCustomerId || loadingInvoices"
                  :loading="loadingInvoices"
                  @click="fetchCustomerInvoices"
                  large
                >
                  <v-icon left>mdi-magnify</v-icon>
                  View Invoices
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Summary Card (shown when data is loaded) -->
        <v-card v-if="customerInvoicesData" class="mb-4" elevation="2">
          <v-card-title class="success white--text">
            <v-icon left color="white">mdi-chart-box</v-icon>
            Financial Year Summary
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-subtitle>Customer</v-list-item-subtitle>
                    <v-list-item-title class="text-h6">
                      {{ customerInvoicesData.customer.name }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
              <v-col cols="12" md="2">
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-subtitle>Total Invoices</v-list-item-subtitle>
                    <v-list-item-title class="text-h6">
                      {{ customerInvoicesData.summary.totalInvoices }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
              <v-col cols="12" md="3">
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-subtitle>Period Total</v-list-item-subtitle>
                    <v-list-item-title class="text-h6 success--text">
                      ₹
                      {{
                        formatCurrency(customerInvoicesData.summary.grandTotal)
                      }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
              <v-col cols="12" md="3">
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-subtitle>Selected Total</v-list-item-subtitle>
                    <v-list-item-title class="text-h6 primary--text">
                      ₹ {{ formatCurrency(selectedInvoicesTotal) }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
            </v-row>
            <v-divider class="my-2"></v-divider>
            <v-row>
              <v-col cols="12" md="4">
                <v-list-item dense>
                  <v-list-item-content>
                    <v-list-item-subtitle>Period</v-list-item-subtitle>
                    <v-list-item-title>
                      {{
                        formatDate(customerInvoicesData.financialYear.startDate)
                      }}
                      -
                      {{
                        formatDate(customerInvoicesData.financialYear.endDate)
                      }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
              <v-col cols="12" md="4">
                <v-list-item dense>
                  <v-list-item-content>
                    <v-list-item-subtitle
                      >Total Amount (excl. tax)</v-list-item-subtitle
                    >
                    <v-list-item-title>
                      ₹
                      {{
                        formatCurrency(customerInvoicesData.summary.totalAmount)
                      }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
              <v-col cols="12" md="4">
                <v-list-item dense>
                  <v-list-item-content>
                    <v-list-item-subtitle
                      >Selected Invoices</v-list-item-subtitle
                    >
                    <v-list-item-title>
                      {{ selectedInvoices.length }} selected
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Selection Actions Bar -->
        <v-card
          v-if="customerInvoicesData && selectedInvoices.length > 0"
          class="mb-4"
          color="blue lighten-5"
          elevation="2"
        >
          <v-card-text class="py-2">
            <v-row align="center">
              <v-col cols="12" md="8">
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2"
                    >mdi-checkbox-marked-circle</v-icon
                  >
                  <span class="text-h6 primary--text">
                    {{ selectedInvoices.length }} invoice(s) selected - Total: ₹
                    {{ formatCurrency(selectedInvoicesTotal) }}
                  </span>
                </div>
              </v-col>
              <v-col cols="12" md="4" class="text-right">
                <v-btn color="error" small outlined @click="clearSelection">
                  <v-icon left small>mdi-close</v-icon>
                  Clear Selection
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Search Field -->
        <v-text-field
          v-if="
            (customerInvoicesData && customerInvoicesData.data.length > 0) ||
            searchQuery
          "
          v-model="searchQuery"
          append-icon="mdi-magnify"
          label="Search invoices"
          single-line
          hide-details
          clearable
          outlined
          class="mb-4"
        ></v-text-field>

        <!-- Invoices Data Table -->
        <v-data-table
          v-if="customerInvoicesData"
          v-model="selectedInvoices"
          :headers="headers"
          :items="customerInvoicesData.data"
          :options.sync="tableOptions"
          :server-items-length="customerInvoicesData.pagination.totalItems"
          :loading="loadingInvoices"
          :footer-props="{
            'items-per-page-options': [5, 10, 15, 20, 50],
          }"
          show-select
          item-key="_id"
          @update:options="handleTableOptionsChange"
          class="elevation-1"
        >
          <template v-slot:item="{ item, isSelected, select }">
            <tr>
              <td>
                <v-checkbox
                  :input-value="isSelected"
                  @change="select($event)"
                  color="primary"
                  hide-details
                  class="ma-0"
                ></v-checkbox>
              </td>
              <td
                @click="navigateToInvoiceDetail(item._id)"
                style="cursor: pointer"
              >
                {{ item.invoiceNumber || "N/A" }}
              </td>
              <td
                @click="navigateToInvoiceDetail(item._id)"
                style="cursor: pointer"
              >
                {{ formatDate(item.createdAt) }}
              </td>
              <td
                @click="navigateToInvoiceDetail(item._id)"
                style="cursor: pointer"
              >
                ₹ {{ formatCurrency(item.totalAmount) }}
              </td>
              <td
                @click="navigateToInvoiceDetail(item._id)"
                style="cursor: pointer"
              >
                <strong>₹ {{ formatCurrency(item.grandTotal) }}</strong>
              </td>
              <!-- <td
                @click="navigateToInvoiceDetail(item._id)"
                style="cursor: pointer"
              >
                <v-chip
                  :color="getDeliveryStatusColor(item.deliveryStatus)"
                  small
                  dark
                >
                  {{ item.deliveryStatus || "pending" }}
                </v-chip>
              </td> -->
              <td>
                <v-btn small icon @click.stop="navigateToEditInvoice(item._id)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  small
                  icon
                  @click.stop="navigateToInvoiceDetail(item._id)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </td>
            </tr>
          </template>
          <template v-slot:no-data>
            <v-alert type="info" text class="my-4">
              {{
                selectedCustomerId
                  ? "No invoices found for the selected period."
                  : "Please select a customer to view invoices."
              }}
            </v-alert>
          </template>
        </v-data-table>
      </v-col>

      <!-- Action Buttons -->
      <v-col cols="12" md="2">
        <v-row>
          <v-col cols="12">
            <v-btn
              @click="refreshData"
              color="primary"
              block
              :disabled="loadingInvoices"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn
              @click="selectAllInvoices"
              color="info"
              block
              :disabled="
                !customerInvoicesData || customerInvoicesData.data.length === 0
              "
            >
              <v-icon>mdi-checkbox-multiple-marked</v-icon> Select All
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn
              @click="exportToCSV"
              color="success"
              block
              :disabled="
                !customerInvoicesData || customerInvoicesData.data.length === 0
              "
            >
              <v-icon>mdi-file-excel</v-icon> Export
            </v-btn>
          </v-col>
          <v-col cols="12" v-if="selectedInvoices.length > 0">
            <v-btn @click="exportSelectedToCSV" color="orange" dark block>
              <v-icon>mdi-file-export</v-icon> Export Selected
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import debounce from "lodash/debounce";

export default {
  name: "CustomerInvoiceHistory",
  data() {
    return {
      selectedCustomerId: null,
      selectedFinancialYear: "current",
      customerSearch: "",
      searchQuery: "",
      loadingInvoices: false,
      selectedInvoices: [],
      headers: [
        { text: "Invoice No.", value: "invoiceNumber" },
        { text: "Date", value: "createdAt" },
        { text: "Amount", value: "totalAmount" },
        { text: "Grand Total", value: "grandTotal" },
        // { text: "DeliveStatus", value: "deliveryStatus", sortable: false },
        { text: "Actions", value: "actions", sortable: false },
      ],
      tableOptions: {
        page: 1,
        itemsPerPage: 10,
        sortBy: ["createdAt"],
        sortDesc: [true],
      },
      customerInvoicesData: null,
      snackbar: false,
      snackbarMessage: "",
      snackbarColor: "info",
    };
  },
  computed: {
    ...mapGetters("customers", {
      allCustomers: "allCustomers",
      isLoadingCustomers: "isLoading",
    }),
    financialYearOptions() {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const currentFYStart = currentMonth < 3 ? currentYear - 1 : currentYear;
      const currentFYEnd = currentFYStart + 1;

      const options = [
        {
          text: `Current FY (${currentFYStart}-${String(currentFYEnd).slice(
            2
          )})`,
          value: "current",
        },
        {
          text: `Previous FY (${currentFYStart - 1}-${String(
            currentFYEnd - 1
          ).slice(2)})`,
          value: "previous",
        },
      ];

      for (let i = 2; i <= 6; i++) {
        const startYear = currentFYStart - i;
        const endYear = startYear + 1;
        options.push({
          text: `FY ${startYear}-${String(endYear).slice(2)}`,
          value: `${startYear}-${String(endYear).slice(2)}`,
        });
      }

      return options;
    },
    selectedInvoicesTotal() {
      return this.selectedInvoices.reduce((total, invoice) => {
        return total + (invoice.grandTotal || 0);
      }, 0);
    },
  },
  watch: {
    searchQuery: debounce(function () {
      if (this.customerInvoicesData) {
        this.tableOptions.page = 1;
        this.fetchCustomerInvoices();
      }
    }, 500),
    selectedInvoices(newVal) {
      console.log(
        `${newVal.length} invoice(s) selected, Total: ₹${this.formatCurrency(
          this.selectedInvoicesTotal
        )}`
      );
    },
  },
  created() {
    this.fetchCustomers();
  },
  methods: {
    async fetchCustomers() {
      try {
        await this.$store.dispatch("customers/fetchCustomers");
      } catch (error) {
        console.error("Error fetching customers:", error);
        this.showSnackbar("Failed to load customers", "error");
      }
    },
    showSnackbar(message, color = "info") {
      this.snackbarMessage = message;
      this.snackbarColor = color;
      this.snackbar = true;
    },
    async fetchCustomerInvoices() {
      if (!this.selectedCustomerId) return;

      this.loadingInvoices = true;
      this.selectedInvoices = [];

      try {
        const response = await this.$store.dispatch(
          "customers/fetchCustomerInvoicesByFY",
          {
            customerId: this.selectedCustomerId,
            financialYear: this.selectedFinancialYear,
            page: this.tableOptions.page,
            itemsPerPage: this.tableOptions.itemsPerPage,
            sortBy: this.tableOptions.sortBy[0] || "createdAt",
            sortDesc: this.tableOptions.sortDesc[0] || true,
            search: this.searchQuery,
          }
        );

        this.customerInvoicesData = response;
        this.showSnackbar("Successfully loaded customer invoices", "success");
      } catch (error) {
        console.error("Error fetching customer invoices:", error);
        this.showSnackbar("Failed to load invoices", "error");
        this.customerInvoicesData = null;
      } finally {
        this.loadingInvoices = false;
      }
    },
    handleTableOptionsChange() {
      if (this.customerInvoicesData) {
        this.fetchCustomerInvoices();
      }
    },
    refreshData() {
      if (this.selectedCustomerId) {
        this.fetchCustomerInvoices();
      }
      this.fetchCustomers();
    },
    selectAllInvoices() {
      if (this.customerInvoicesData && this.customerInvoicesData.data) {
        this.selectedInvoices = [...this.customerInvoicesData.data];
      }
    },
    clearSelection() {
      this.selectedInvoices = [];
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);
    },
    // getDeliveryStatusColor(status) {
    //   const colors = {
    //     pending: "orange",
    //     in_transit: "blue",
    //     delivered: "green",
    //     cancelled: "red",
    //   };
    //   return colors[status] || "grey";
    // },
    navigateToInvoiceDetail(invoiceId) {
      this.$router.push(`/invoice/${invoiceId}`);
    },
    navigateToEditInvoice(invoiceId) {
      this.$router.push(`/addinvoice/${invoiceId}`);
    },
    exportToCSV() {
      if (
        !this.customerInvoicesData ||
        !this.customerInvoicesData.data.length
      ) {
        this.showSnackbar("No data to export", "warning");

        return;
      }

      const rows = this.customerInvoicesData.data.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        date: this.formatDate(inv.createdAt),
        amount: inv.totalAmount,
        grandTotal: inv.grandTotal,
        // status: inv.deliveryStatus,
      }));

      this.downloadCSV(rows, "Customer_Invoices.csv");
    },
    exportSelectedToCSV() {
      if (this.selectedInvoices.length === 0) {
        this.showSnackbar("No invoices selected", "error");
        return;
      }

      const rows = this.selectedInvoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        date: this.formatDate(inv.createdAt),
        amount: inv.totalAmount,
        grandTotal: inv.grandTotal,
        // status: inv.deliveryStatus,
      }));

      this.downloadCSV(rows, "Selected_Invoices.csv");
    },
    downloadCSV(data, filename) {
      if (!data || !data.length) return;

      const headers = Object.keys(data[0]).join(",") + "\n";

      const csvRows = data
        .map((row) =>
          Object.values(row)
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

      const csvContent = headers + csvRows;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>

<style scoped>
.v-card__title {
  word-break: break-word;
}
</style>
