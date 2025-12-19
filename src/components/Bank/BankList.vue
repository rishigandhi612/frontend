<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12">
        <h1 class="text-center">Banks List</h1>

        <v-data-table
          :headers="headers"
          :items="allBanks"
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
              label="Search Bank"
              prepend-inner-icon="mdi-magnify"
              class="mx-4"
            ></v-text-field>
          </template>
          <template v-slot:item="{ item }">
            <tr @click="handleRowClick(item._id)">
              <!-- <td>{{ item._id }}</td> -->
              <td>{{ capitalizeFirstLetter(item.name) }}</td>
              <td>{{ item.email_id }}</td>
              <td>{{ item.phone_no }}</td>
              <td>{{ item.account_no }}</td>
              <td>{{ capitalizeFirstLetter(item.branch.name) }}</td>
              <td>{{ formatDate(item.updatedAt) }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
      <v-col md="2" cols="12">
        <v-row>
          <v-col cols="12">
            <v-btn @click="fetchBanks" color="primary" block>
              <v-icon>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn color="success" @click="addBank" block>
              <v-icon>mdi-plus</v-icon> Add Bank
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
  name: "BankList",
  data() {
    return {
      // sortBy: "name",
      search: "",
      sortDesc: false,
      headers: [
        { text: "Name", value: "name" },
        { text: "Email", value: "email_id" },
        { text: "Phone", value: "phone_no" },
        { text: "Account Number", value: "account_no" },
        { text: "Branch", value: "branch.name" },
        { text: "Last Updated", value: "updatedAt" },
      ],
      loading: false,
    };
  },
  computed: {
    ...mapGetters("banks", ["allBanks", "isLoading"]),
  },
  watch: {
    isLoading(newLoading) {
      this.loading = newLoading;
    },
  },
  created() {
    this.fetchBanks();
  },
  methods: {
    async fetchBanks() {
      this.loading = true;
      try {
        await this.$store.dispatch("banks/fetchBanks");
      } catch (error) {
        console.error("Error fetching banks:", error);
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
    capitalizeFirstLetter(string) {
      if (!string) return "";
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    handleRowClick(bankId) {
      console.log("Bank ID:", bankId); // Debug log
      if (!bankId) {
        console.error("Bank ID is undefined");
        return;
      }
      this.$router.push({ name: "bankDetail", params: { id: bankId } });
    },
    addBank() {
      this.$router.push({ name: "addBank" });
    },
    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>

<style scoped>
/* Add any styles specific to this component */
</style>
