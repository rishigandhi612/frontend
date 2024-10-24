<template>
  <v-container>
    <h1>Product List</h1>
    <v-data-table
      :headers="headers"
      :items="allProducts"
      class="elevation-1"
      :items-per-page="10"
      :loading="loading"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>Products</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn @click="fetchProducts" color="primary" class="mr-2 p-1">Refresh</v-btn>
          <v-btn @click="goToAddProduct" color="success">Add Product</v-btn> <!-- New button for adding product -->
        </v-toolbar>
      </template>

      <template v-slot:item="{ item }">
        <tr @click="handleRowClick(item._id)">
          <td>{{ capitalizeFirstLetter(item.name) }}</td>
          <td>{{ item.quantity }}</td>
          <td>{{ item.hsn_code }}</td>
          <td>{{ formatDate(item.updatedAt) }}</td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "ProductList",
  data() {
    return {
      sortBy: 'name',
      sortDesc: false,
      headers: [
        { text: "Name", value: "name" },
        { text: "Qty", value: "quantity" },
        { text: "HSN Code", value: "hsn_code" },
        { text: "Last Updated", value: "updatedAt" },
      ],
      loading: false,
    };
  },
  computed: {
    ...mapGetters("products", ["allProducts", "isLoading"]),
  },
  watch: {
    isLoading(newLoading) {
      this.loading = newLoading; // Sync the loading state with Vuex
    },
  },
  created() {
    this.fetchProducts();
  },
  methods: {
    async fetchProducts() {
      this.loading = true;
      try {
        await this.$store.dispatch('products/fetchProducts');
      } catch (error) {
        console.error("Error fetching products:", error);
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
    handleRowClick(productId) {
      this.$router.push({ name: 'productDetail', params: { id: productId } });
    },
    goToAddProduct() {
      this.$router.push({ name: 'addProduct' }); // Navigate to the Add Product page
    },
  },
};
</script>

<style scoped>
/* Add any styles specific to this component */
</style>
