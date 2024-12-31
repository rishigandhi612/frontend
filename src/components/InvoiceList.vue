<template>
  <v-container fluid>
    <v-row>
      <v-col md="2" cols="12">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn></v-col
      >
      <v-col md="8" cols="12">
        <h1 class="text-center">Invoice List</h1>

        <v-data-table
          :headers="headers"
          :items="sortedInvoices"
          class="elevation-1"
          :items-per-page="10"
          :loading="loading"
        >
          <template v-slot:item="{ item }">
            <tr
              @click="navigateToInvoiceDetail(item._id)"
              style="cursor: pointer"
            >
              <td>{{ item._id }}</td>
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
            <v-btn @click="fetchInvoices" color="primary" block>
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
          </v-col>
          <v-col md="12" cols="12">
            <!-- Add Invoice Button -->
            <v-btn @click="navigateToAddInvoice" color="success" block>
              <v-icon>mdi-plus</v-icon> Add Invoice
            </v-btn>
          </v-col></v-row
        ></v-col
      >
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "InvoiceList",
  data() {
    return {
      headers: [
        { text: "Invoice ID", value: "_id" },
        { text: "Customer Name", value: "customerName" },
        { text: "Date", value: "date" },
        { text: "Total Amount", value: "totalAmount" },
        { text: "Actions", value: "actions", sortable: false }, // Actions column
      ],
      loading: false,
    };
  },
  computed: {
    ...mapGetters("invoices", ["allInvoices", "isLoading"]),
    sortedInvoices() {
      return [...this.allInvoices].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    },
  },
  watch: {
    isLoading(newLoading) {
      this.loading = newLoading;
    },
  },
  created() {
    this.fetchInvoices();
  },
  methods: {
    async fetchInvoices() {
      this.loading = true;
      try {
        await this.$store.dispatch("invoices/fetchInvoices");
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    calculateTotal(quantity, unit_price) {
      return quantity * unit_price;
    },
    navigateToInvoiceDetail(invoiceId) {
      // Navigate to the invoice detail page
      this.$router.push(`/invoice/${invoiceId}`);
    },
    navigateToEditInvoice(invoiceId) {
      // Navigate to the edit invoice page
      this.$router.push(`/addinvoice/${invoiceId}`);
    },
    navigateToAddInvoice() {
      // Navigate to the add invoice page
      this.$router.push("/addinvoice");
    },
    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
  },
};
</script>

<style scoped>
/* Add any necessary styles here */
</style>
