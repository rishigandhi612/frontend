<template>
  <v-container>
    <!-- Loader Spinner -->
    <v-row v-if="loading" justify="center">
      <v-col cols="auto">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          width="6"
        ></v-progress-circular>
      </v-col>
    </v-row>

    <!-- Header Section with Title and Back Button -->
    <v-row class="d-flex align-center">
      <v-col cols="auto">
        <!-- Back Button aligned left, same style as other buttons -->
        <v-btn color="grey" @click="goBack">
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col class="text-center">
        <!-- Title centered -->
        <h1>Product Detail</h1>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" dismissible>
      {{ error }}
    </v-alert>

    <!-- Product Details Card (Visible after data is loaded) -->
    <v-card v-if="!loading && product" class="mx-auto" max-width="600">
      <v-card-title>
        <span class="headline">{{ formattedProductName }}</span>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <p><strong>HSN Code:</strong> {{ product.hsn_code }}</p>
            <p><strong>Quantity:</strong> {{ product.quantity }}</p>
          </v-col>
          <v-col cols="12" md="6">
            <p><strong>Price:</strong> ₹{{ product.price }}</p>
            <p>
              <strong>Created At:</strong> {{ formatDate(product.createdAt) }}
            </p>
            <p>
              <strong>Updated At:</strong> {{ formatDate(product.updatedAt) }}
            </p>
          </v-col>
        </v-row>

        <p><strong>Description:</strong> {{ product.desc }}</p>
      </v-card-text>

      <v-card-actions>
        <v-btn color="primary" @click="updateProduct">
          <v-icon left>mdi-pencil</v-icon> 
          Update
        </v-btn>
        <v-btn color="red" @click="openDeleteConfirmation">
          <v-icon left>mdi-delete</v-icon>
          Delete
          </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>

    <!-- If no product is found -->
    <v-card v-if="!loading && !product" class="mx-auto" max-width="600">
      <v-card-text>
        <p class="text-center">No product found</p>
      </v-card-text>
    </v-card>

    <!-- Confirmation Dialog for Deleting -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete this product? This action cannot be
          undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green" text @click="deleteProduct">Yes, Delete</v-btn>
          <v-btn color="red" text @click="deleteDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  data() {
    return {
      productId: this.$route.params.id,
      error: null, // Error state
      deleteDialog: false, // State for delete confirmation dialog
      loading: true, // Loading flag to control spinner visibility
      updatedProductData: {
        name: "",
        hsn_code: "",
        quantity: "",
        price: "",
        desc: "",
      },
    };
  },
  computed: {
    ...mapState("products", ["productDetail"]),
    product() {
      return this.productDetail;
    },
    formattedProductName() {
      return this.product ? this.product.name.toUpperCase() : "";
    },
  },
  methods: {
    ...mapActions("products", [
      "fetchProductDetail",
      "updateProductInStore",
      "deleteProductFromStore",
    ]),

    async loadProductDetail() {
      try {
        this.loading = true; // Start loading spinner
        await this.fetchProductDetail(this.productId);
        if (this.product) {
          this.updatedProductData = { ...this.product }; // Shallow copy for editing
        }
      } catch (err) {
        this.error = "Error fetching product details.";
      } finally {
        this.loading = false; // Hide the spinner after data is fetched
      }
    },

    async updateProduct() {
      try {
        await this.updateProductInStore({
          id: this.productId,
          data: this.updatedProductData,
        });
        this.$router.push("/product"); // Redirect after update
      } catch (err) {
        this.error = "Error updating product.";
      }
    },

    openDeleteConfirmation() {
      this.deleteDialog = true; // Open the confirmation dialog
    },

    async deleteProduct() {
      try {
        await this.deleteProductFromStore(this.productId);
        this.$router.push("/product"); // Redirect after delete
      } catch (err) {
        this.error = "Error deleting product.";
      } finally {
        this.deleteDialog = false; // Close the dialog after delete attempt
      }
    },

    goBack() {
      this.$router.push("/product");
    },

    formatDate(dateString) {
      const options = { year: "numeric", month: "2-digit", day: "2-digit" };
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, options);
    },
  },
  created() {
    this.loadProductDetail();
  },
};
</script>

<style scoped>
.v-card {
  margin-bottom: 20px;
}

.text-center {
  text-align: center;
}

.v-row {
  margin-bottom: 20px;
}
</style>
