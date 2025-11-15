<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12">
        <h1 class="text-center">Customers List</h1>

        <v-data-table
          :headers="headers"
          :items="allCustomers"
          class="elevation-1"
          :items-per-page="10"
          :search="search"
          :loading="loading"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
        >
          <template v-slot:top>
            <v-text-field
              v-model="search"
              label="Search Customer"
              prepend-inner-icon="mdi-magnify"
              class="mx-4"
            ></v-text-field>
          </template>
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
      </v-col>
      <v-col md="2" cols="12">
        <v-row>
          <v-col cols="12">
            <v-btn @click="fetchCustomers" color="primary" block>
              <v-icon>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
          <v-col cols="12">
            <!-- Add User Button -->
            <v-btn color="success" @click="addCustomer" block>
              <v-icon>mdi-plus</v-icon> Add Customer
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "CustomerList",
  data() {
    return {
      sortBy: "name",
      search: "",
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
    addCustomer() {
      this.$router.push({ name: "addCustomer" });
    },
    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
  },
};
</script>

<style scoped>
/* Add any styles specific to this component */
</style>
