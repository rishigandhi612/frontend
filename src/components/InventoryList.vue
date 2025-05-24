<template>
  <v-container fluid>
    <v-row>
      <v-col md="2" cols="12">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12">
        <v-row>
          <v-col>
            <h1 class="text-center">Inventory List</h1>
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="inventoryWithProductNames"
          :options.sync="options"
          :loading="isTableLoading"
          :server-items-length="totalItems"
          class="elevation-1"
          @update:options="handleTableOptions"
        >
          <template v-slot:item="{ item }">
            <tr @click="handleRowClick(item.id)">
              <td>{{ item.rollId }}</td>
              <td>{{ item.productName || "Unknown Product" }}</td>
              <td>{{ item.width }}</td>
              <td>{{ item.netWeight }}</td>
              <td>{{ item.type }}</td>
              <td>{{ item.status }}</td>
            </tr>
          </template>

          <template v-slot:no-data>
            <v-alert type="info" dense> No inventory data available </v-alert>
          </template>
        </v-data-table>
      </v-col>
      <v-col md="2" cols="12">
        <v-row>
          <v-col cols="12" md="12">
            <v-btn @click="refreshInventory" color="primary" block>
              <v-icon>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
          <v-col cols="12" md="12">
            <v-btn @click="goToAddInventory" color="success" block>
              <v-icon>mdi-plus</v-icon> Add Inventory
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
  name: "InventoryList",
  data() {
    return {
      options: {
        page: 1,
        itemsPerPage: 10,
        sortBy: ["rollId"],
        sortDesc: [false],
      },
      headers: [
        { text: "Roll ID", value: "rollId", sortable: true },
        { text: "Product", value: "productName", sortable: true },
        { text: "Width", value: "width", sortable: true },
        { text: "Net Weight", value: "netWeight", sortable: true },
        { text: "Type", value: "type", sortable: true },
        { text: "Status", value: "status", sortable: true },
      ],
    };
  },
  computed: {
    ...mapGetters("inventory", ["allInventory", "isLoading", "getTotalCount"]),
    ...mapGetters("products", ["allProducts"]),
    totalItems() {
      return this.getTotalCount || 0;
    },
    inventoryWithProductNames() {
      return this.allInventory.map((item) => {
        const productId = item.productId;
        const product = this.allProducts.find((p) => p._id === productId);
        return {
          ...item,
          productName: product
            ? product.name
            : `Unknown Product (ID: ${productId})`,
        };
      });
    },
    isTableLoading() {
      return (
        this.isLoading ||
        (this.allProducts.length === 0 && this.allInventory.length > 0)
      );
    },
  },
  async created() {
    try {
      // First fetch products to have the product names available
      await this.fetchProducts();
      // Then load inventory items
      await this.loadItems();
    } catch (error) {
      console.error("Error in created hook:", error);
    }
  },
  methods: {
    async fetchProducts() {
      try {
        await this.$store.dispatch("products/fetchProducts");
      } catch (error) {
        console.error("Error fetching products:", error);
        // Show user-friendly error message
        this.$toast?.error?.(
          "Failed to load products. Product names may not display correctly."
        );
      }
    },
    async loadItems() {
      try {
        // Create a query object based on current options
        const params = {
          page: this.options.page,
          limit: this.options.itemsPerPage,
          sortBy: this.options.sortBy[0] || "rollId",
          sortOrder: this.options.sortDesc[0] ? "desc" : "asc",
        };
        // Dispatch action to fetch inventory with pagination/sorting
        await this.$store.dispatch("inventory/fetchInventory", params);
      } catch (error) {
        console.error("Error loading inventory items:", error);
      }
    },
    handleTableOptions(options) {
      this.options = options;
      this.loadItems();
    },
    refreshInventory() {
      // Reset pagination to first page when refreshing
      this.options.page = 1;
      this.loadItems();
    },
    formatDate(dateString) {
      if (!dateString) return "N/A";
      const options = { year: "numeric", month: "2-digit", day: "2-digit" };
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, options);
    },
    handleRowClick(inventoryId) {
      this.$router.push({
        name: "inventoryDetail",
        params: { id: inventoryId },
      });
    },
    goToAddInventory() {
      this.$router.push({ name: "addInventory" });
    },
    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>

<style scoped>
tr {
  cursor: pointer;
}
tr:hover {
  background-color: #f5f5f5;
}
</style>
