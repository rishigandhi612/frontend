<template>
  <v-container>
    <v-row>
      <v-col cols="6">
        <v-row>
          <v-col> <h1>Customers List</h1>

          </v-col>
        </v-row>
       
      </v-col>
      <v-col justify="end" align="end" cols="6">
        <v-btn @click="fetchCustomers" color="primary">
          <v-icon>mdi-refresh</v-icon>
          Refresh
        </v-btn>
        <!-- Add User Button -->
        <v-btn
          color="success"
          class="ml-2 mt-2 mb-2">
          <v-icon>mdi-plus</v-icon> Add Customer
        </v-btn>
      </v-col>
    </v-row>

    <v-data-table
      :headers="headers"
      :items="allCustomers"
      class="elevation-1"
      :items-per-page="10"
      :loading="loading"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
    >
      <template v-slot:item="{ item }">
        <tr @click="handleRowClick(item._id)">
          <td>{{ capitalizeFirstLetter(item.name) }}</td>
          <td>{{ item.email_id }}</td>
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
      sortBy: "name",
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
        await this.$store.dispatch("customers/fetchCustomers");
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0"); // Ensure 2 digits
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = date.getFullYear(); // Full year (yyyy)
  return `${day}/${month}/${year}`; // Format as dd/mm/yyyy
},
    capitalizeFirstLetter(string) {
      if (!string) return "";
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    handleRowClick(customerId) {
      this.$router.push({ name: "customerDetail", params: { id: customerId } });
    },
  },
};
</script>

<style scoped>
/* Add any styles specific to this component */
</style>
