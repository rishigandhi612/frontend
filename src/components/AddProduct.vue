<template>
  <v-container fluid>
    <!-- Loading indicator -->
    <v-row v-if="loading">
      <v-col class="d-flex justify-center align-center">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-col>
    </v-row>
    <v-row v-if="!loading">
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col cols="12" md="8">
        <h1 class="text-center">
          {{ isEditMode ? "Edit Product" : "Add Product" }}
        </h1>
        <v-form ref="productForm" v-model="isFormValid">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                label="Product Name"
                v-model="product.name"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="HSN Code"
                v-model="product.hsn_code"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Quantity"
                v-model="product.quantity"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Price"
                v-model="product.price"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea
                label="Description"
                v-model="product.desc"
                :rules="[rules.required]"
                required
              ></v-textarea>
            </v-col>
          </v-row>

          <v-btn
            :disabled="!isFormValid || isLoading || !hasChanges"
            color="primary"
            @click="saveProduct"
          >
            {{ isEditMode ? "Update Product" : "Create Product" }}
          </v-btn>
        </v-form>
      </v-col>
    </v-row>
    <!-- Show error message if any -->
    <v-alert v-if="error" type="error" dismissible>
      {{ error }}
    </v-alert>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  data() {
    return {
      isFormValid: false,
      product: {
        name: "",
        hsn_code: "",
        quantity: "",
        desc: "",
        price: "",
      },
      initialProduct: null, // To store the initial product data
      productId: this.$route.params.id, // Product ID from route
      isEditMode: !!this.$route.params.id, // True if editing
      rules: {
        required: (value) => !!value || "This field is required",
      },
      error: null, // To store the error message
    };
  },
  computed: {
    ...mapState("products", ["loading"]), // Map loading state from Vuex store
    isLoading() {
      return this.loading;
    },
    hasChanges() {
      // Compare the current product with the initial product
      return JSON.stringify(this.product) !== JSON.stringify(this.initialProduct);
    },
  },
  created() {
    if (this.isEditMode) {
      this.fetchProductDetail(); // Fetch product details for edit mode
    }
  },
  methods: {
    ...mapActions("products", ["saveProductInStore", "fetchProductDetail"]),

    async fetchProductDetail() {
      try {
        const product = await this.$store.dispatch(
          "products/fetchProductDetail",
          this.productId
        );
        this.product = { ...product }; // Populate form with product details
        this.initialProduct = { ...product }; // Store the initial product data
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    },
    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
    async saveProduct() {
      try {
        if (this.isEditMode) {
          await this.$store.dispatch("products/saveProduct", {
            productId: this.productId,
            productData: this.product,
          });
        } else {
          await this.$store.dispatch("products/saveProduct", {
            productId: null,
            productData: this.product,
          });
        }
        this.$router.push("/product"); // Redirect to product list after save
      } catch (err) {
        // Check for duplicate key error (MongoDB E11000)
        if (err.response && err.response.data && err.response.data.error) {
          const errorMessage = err.response.data.error.errorResponse.errmsg;
          this.error = errorMessage || "Error saving product."; // Show the exact error message
        } else {
          this.error = "Error saving product."; // Generic error message
        }
      }
    },
  },
};
</script>

<style scoped>
/* Add any styles specific to this component */
</style>
