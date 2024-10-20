<template>
    <v-container>
      <h1>Customer List</h1>
      <v-data-table
        :headers="headers"
        :items="allCustomers"
        class="elevation-1"
        :items-per-page="10"
        :loading="loading"
              :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Customers</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn @click="fetchCustomers" color="primary">Refresh</v-btn>
          </v-toolbar>
        </template>
  
        <template v-slot:item="{ item }">
          <tr @click="handleRowClick(item._id)">
            <td>{{ capitalizeFirstLetter(item.name) }}</td>
            <td>{{ capitalizeFirstLetter(item.email_id) }}</td>
            <td>{{ item.phone_no }}</td>
            <td>{{ item.gstin }}</td>
            <td>{{ capitalizeFirstLetter(item.address.city) }}</td>
            <td>{{ formatDate(item.updatedAt) }}</td>
          </tr>
        </template>
      </v-data-table>
    </v-container>
  </template>
  
  <script>
  import { mapGetters } from "vuex";
  
  export default {
    name: "CustomerList",
    data() {
      return {
        sortBy: 'name',
      sortDesc: false,
        headers: [
          { text: "Name", value: "name" },
          { text: "Email", value: "email_id" },
          { text: "Phone", value: "phone_no" },
          { text: "GSTIN", value: "gstin" },
          { text: "City", value: "address.city" },
          { text: "Last Updated", value: "updatedAt" },
        ],
        loading: false,
      };
    },
    computed: {
      ...mapGetters("customers", ["allCustomers", "isLoading"]),
    },
    watch: {
      isLoading(newLoading) {
        this.loading = newLoading; // Sync the loading state with Vuex
      },
    },
    created() {
      this.fetchCustomers();
    },
    methods: {
      async fetchCustomers() {
        this.loading = true;
        try {
          await this.$store.dispatch('customers/fetchCustomers');
        } catch (error) {
          console.error("Error fetching customers:", error);
        } finally {
          this.loading = false;
        }
      },
      formatDate(dateString) {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
      },
      capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
      },
      handleRowClick(customerId) {
        this.$router.push({ name: 'customerDetail', params: { id: customerId } });
      },
    },
  };
  </script>
  
  <style scoped>
  /* Add any styles specific to this component */
  </style>
  