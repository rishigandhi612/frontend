<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12">
        <h1 class="text-center">Transactions List</h1>

        <v-data-table
          :headers="headers"
          :items="alltransactions"
          class="elevation-1"
          :items-per-page="10"
          :loading="loading"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
          :footer-props="{
            showFirstLastPage: true,
          }"
        >
          <template v-slot:top>
            <!-- <v-text-field
              v-model="search"
              label="Search transaction"
              prepend-inner-icon="mdi-magnify"
              class="mx-4"
            ></v-text-field> -->
          </template>
          <template v-slot:item="{ item }">
            <tr @click="handleRowClick(item.id)">
              <!-- <td>{{ item._id }}</td> -->
              <td>{{ capitalizeFirstLetter(item?.bankName) }}</td>
              <td>{{ item?.transactionId }}</td>
              <td>{{ item?.totalAmount }}</td>
              <td>{{ (item?.paymentMethod).toUpperCase() }}</td>
              <td>{{ capitalizeFirstLetter(item?.paymentStatus) }}</td>
              <td>{{ formatDate(item?.transactionDate) }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
      <v-col md="2" cols="12">
        <v-row>
          <v-col cols="12">
            <v-btn @click="fetchtransactions" color="primary" block>
              <v-icon>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn color="success" @click="addtransaction" block>
              <v-icon>mdi-plus</v-icon> Add transaction
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
  name: "transactionList",
  data() {
    return {
      sortBy: "name",
      //   search: "",
      sortDesc: false,
      headers: [
        { text: "Bank Name", value: "bankName" },
        { text: "Transaction ID", value: "transactionId" },
        { text: "Amount", value: "totalAmount" },
        { text: "Payment Method", value: "paymentMethod" },
        { text: "Payment Status", value: "paymentStatus" },
        { text: "Transaction Date", value: "transactionDate" },
      ],
      loading: false,
    };
  },
  computed: {
    ...mapGetters("transactions", ["alltransactions", "isLoading"]),
  },
  watch: {
    isLoading(newLoading) {
      this.loading = newLoading;
    },
  },
  created() {
    this.fetchtransactions();
  },
  methods: {
    async fetchtransactions() {
      this.loading = true;
      try {
        await this.$store.dispatch("transactions/fetchtransactions");
      } catch (error) {
        console.error("Error fetching transactions:", error);
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
    handleRowClick(transactionId) {
      console.log("transaction ID:", transactionId); // Debug log
      if (!transactionId) {
        console.error("transaction ID is undefined");
        return;
      }
      this.$router.push("/transaction" + "/" + transactionId);
    },
    addtransaction() {
      this.$router.push("/addtransaction");
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
