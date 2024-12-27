<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Invoice List</h1>
      </v-col>
      <v-col justify="end" align="end">
        <!-- Refresh Button -->
        <v-btn @click="fetchInvoices" color="primary">
          <v-icon>mdi-refresh</v-icon> Refresh
        </v-btn>

        <!-- Add Invoice Button -->
        <v-btn @click="navigateToAddInvoice" color="success" class="ml-2 mt-2 mb-2">
          <v-icon>mdi-plus</v-icon> Add Invoice
        </v-btn>
      </v-col>
    </v-row>

    <v-data-table
      :headers="headers"
      :items="sortedInvoices"
      class="elevation-1"
      :items-per-page="10"
      :loading="loading"
    >

      <template v-slot:item="{ item }">
        <tr @click="navigateToInvoiceDetail(item._id)" style="cursor: pointer">
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
  },
};
</script>

<style scoped>
/* Add any necessary styles here */
</style>
