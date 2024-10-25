<template>
    <v-container>
      <h1>Invoice List</h1>
      <v-data-table
        :headers="headers"
        :items="allInvoices"
        class="elevation-1"
        :items-per-page="10"
        :loading="loading"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Invoices</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn @click="fetchInvoices" color="primary">Refresh</v-btn>
          </v-toolbar>
        </template>
  
        <template v-slot:item="{ item }">
          <tr>
            <td>{{ item._id }}</td>
            <td>{{ item.customer ? item.customer.name : "N/A" }}</td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>{{ calculateTotal(item.quantity, item.unit_price) }}</td>
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
        ],
        loading: false,
      };
    },
    computed: {
      ...mapGetters("invoices", ["allInvoices", "isLoading"]),
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
        const options = { year: "numeric", month: "2-digit", day: "2-digit" };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
      },
      calculateTotal(quantity, unit_price) {
        return quantity * unit_price;
      },
    },
  };
  </script>
  