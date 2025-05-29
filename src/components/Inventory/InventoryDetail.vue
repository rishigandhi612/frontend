<template>
  <v-app>
    <v-row v-if="loading">
      <v-col class="d-flex justify-center align-center">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-if="!loading">
      <!-- Left Column -->
      <v-col md="2" cols="12">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>

      <!-- Main Content -->
      <v-col cols="12" md="8">
        <v-container class="pt-5">
          <v-row v-if="inventoryItem">
            <v-col cols="12">
              <v-card>
                <!-- Title -->
                <v-row>
                  <v-col cols="12" class="d-flex justify-center align-center">
                    <h2>{{ capitalizeFirstLetter(productName) }} Details</h2>
                  </v-col>
                </v-row>
                <v-divider class="mt-2"></v-divider>

                <!-- ID Section -->
                <v-card-subtitle>
                  <v-row>
                    <v-col cols="12" md="8" class="d-flex justify-start">
                      <h2>Roll ID : {{ inventoryItem.rollId || "N/A" }}</h2>
                    </v-col>
                    <v-col cols="12" md="4" class="d-flex justify-end">
                      <h3>
                        Product ID : {{ inventoryItem.productId || "N/A" }}
                      </h3>
                    </v-col>
                  </v-row>
                </v-card-subtitle>

                <!-- Attributes Grid -->
                <v-card-text>
                  <v-row>
                    <v-col
                      cols="12"
                      sm="6"
                      v-for="(value, label) in itemDetails"
                      :key="label"
                    >
                      <v-list-item>
                        <v-list-item-content>
                          <v-list-item-subtitle>{{
                            label
                          }}</v-list-item-subtitle>
                          <v-list-item-title class="font-weight-bold">{{
                            value
                          }}</v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-row v-if="!inventoryItem" class="d-flex justify-center">
            <v-alert type="info"
              >Inventory item details are unavailable.</v-alert
            >
          </v-row>
        </v-container>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" md="2" sm="12" class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-btn color="primary" @click="editInventory" block>
              <v-icon left>mdi-pencil</v-icon> Update Item
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-btn color="success" @click="showSticker = true" block>
              <v-icon left>mdi-printer</v-icon> Print Sticker
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-btn color="error" @click="confirmDelete = true" block>
              <v-icon left>mdi-delete</v-icon> Delete Item
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="confirmDelete" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this inventory item?
        </v-card-text>
        <v-card-actions>
          <v-btn color="grey" text @click="confirmDelete = false">Cancel</v-btn>
          <v-btn color="error" text @click="deleteInventory">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sticker Dialog -->
    <v-dialog v-model="showSticker" max-width="800">
      <v-card>
        <v-card-title class="text-h5">Inventory Sticker Preview</v-card-title>
        <v-card-text>
          <InventorySticker
            v-if="inventoryItem && showSticker"
            :inventoryItem="inventoryItem"
            :productName="productName"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="grey" text @click="showSticker = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import InventorySticker from "../Printables/InventorySticker.vue";

export default {
  components: {
    InventorySticker,
  },
  props: {},
  data() {
    return {
      confirmDelete: false,
      showSticker: false,
      loading: false,
      inventoryItem: null,
      products: [],
      error: null,
    };
  },
  computed: {
    itemDetails() {
      return {
        Width: this.inventoryItem?.width || "N/A",
        Micron: this.inventoryItem?.micron || "N/A",
        "Net Weight": this.inventoryItem?.netWeight || "N/A",
        "Gross Weight": this.inventoryItem?.grossWeight || "N/A",
        "Meters (MTR)": this.inventoryItem?.mtr || "N/A",
        Status: this.inventoryItem?.status || "N/A",
        Type: this.inventoryItem?.type || "N/A",
        "Last Updated": this.formatDate(this.inventoryItem?.updatedAt),
      };
    },
    productName() {
      if (!this.inventoryItem || !this.inventoryItem.productId) {
        return "Unknown Product";
      }

      // Try multiple ways to access products from store
      let allProducts = [];

      // Try different possible store structures
      if (this.$store.getters["products/getAllProducts"]) {
        allProducts = this.$store.getters["products/getAllProducts"];
      } else if (
        this.$store.state.products &&
        this.$store.state.products.products
      ) {
        allProducts = this.$store.state.products.products;
      } else if (
        this.$store.state.products &&
        this.$store.state.products.data
      ) {
        allProducts = this.$store.state.products.data;
      } else if (
        this.$store.state.products &&
        Array.isArray(this.$store.state.products)
      ) {
        allProducts = this.$store.state.products;
      } else if (this.products && Array.isArray(this.products)) {
        allProducts = this.products;
      }

      const product = allProducts.find(
        (p) => p._id === this.inventoryItem.productId
      );
      const productName = product
        ? product.name
        : `Unknown Product (ID: ${this.inventoryItem.productId})`;
      return String(productName);
    },
  },
  methods: {
    capitalizeFirstLetter(text) {
      return text?.charAt(0).toUpperCase() + text?.slice(1) || "";
    },
    formatDate(dateString) {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },
    async fetchInventoryItem() {
      try {
        this.loading = true;
        const id = this.$route.params.id;
        const response = await this.$store.dispatch(
          "inventory/fetchInventoryDetail",
          id
        );
        this.inventoryItem = response;
      } catch (err) {
        this.error = "Failed to load inventory item.";
        console.error("Error fetching inventory item:", err);
      } finally {
        this.loading = false;
      }
    },
    async fetchProducts() {
      try {
        const response = await this.$store.dispatch("products/fetchProducts");
        // Store products in local data as fallback
        if (response && response.data && Array.isArray(response.data)) {
          this.products = response.data;
        } else if (response && Array.isArray(response)) {
          this.products = response;
        } else {
          // Try to get from store state after dispatch
          if (this.$store.state.products) {
            this.products =
              this.$store.state.products.data ||
              this.$store.state.products.products ||
              this.$store.state.products;
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        this.products = [];
        // Show user-friendly error message
        this.$toast?.error?.(
          "Failed to load products. Product names may not display correctly."
        );
      }
    },
    editInventory() {
      this.$router.push(`/addinventory/${this.inventoryItem.id}`);
    },
    async deleteInventory() {
      try {
        await this.$store.dispatch(
          "inventory/deleteInventory",
          this.inventoryItem._id
        );
        this.$router.push("/inventory");
      } catch (err) {
        this.error = "Failed to delete inventory item.";
        console.error("Error deleting inventory item:", err);
      } finally {
        this.confirmDelete = false;
      }
    },
    goBack() {
      this.$router.go(-1);
    },
  },
  async mounted() {
    this.loading = true;
    await Promise.all([this.fetchInventoryItem(), this.fetchProducts()]);
    this.loading = false;
  },
};
</script>

<style scoped>
.font-weight-bold {
  font-weight: bold;
}
</style>
