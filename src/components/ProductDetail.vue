<template>
  <v-app>
    <v-container fluid>
      <v-alert v-if="!product && isEditMode" type="error" dismissible>
        Failed to load product details. Please try again later.
      </v-alert>
      <!-- Loader Spinner -->
      <v-row v-if="loading">
        <v-col class="d-flex justify-center align-center">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </v-col>
      </v-row>

      <v-row v-if="!loading">
        <v-col class="d-flex justify-center align-center">
          <!-- Header Section with Title and Back Button -->
          <v-row>
            <v-col cols="12" md="2">
              <v-btn @click="goBack" class="ml-2" block>
                <v-icon left>mdi-arrow-left</v-icon> Back
              </v-btn>
            </v-col>
            <v-col cols="12" md="8">
              <v-row>
                <v-col cols="12" md="12">
                  <h1 align="center">About Product</h1>
                </v-col>
                <v-col cols="12" md="12">
                  <v-card v-if="product">
                    <v-card-title>
                      <span class="headline">{{ formattedProductName }}</span>
                    </v-card-title>

                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="6" justify="end">
                          <p>
                            <strong>HSN Code:</strong> {{ product.hsn_code }}
                          </p>
                          <p>
                            <strong>Width:</strong> {{ product.width }}
                            {{ product.width > 70 ? "mm" : '"' }}
                          </p>
                          <p>
                            <strong>Quantity:</strong> {{ product.quantity }}
                          </p>
                        </v-col>
                        <v-col cols="12" md="6">
                          <p><strong>Price:</strong> ₹{{ product.price }}</p>
                          <p>
                            <strong>Created At:</strong>
                            {{ formatDate(product.createdAt) }}
                          </p>
                          <p>
                            <strong>Updated At:</strong>
                            {{ formatDate(product.updatedAt) }}
                          </p>
                        </v-col>
                      </v-row>

                      <p>
                        <strong>Description:</strong>
                        {{ product.desc || "No description available." }}
                      </p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12" md="2">
              <v-row>
                <v-col>
                  <v-btn
                    color="primary"
                    @click="updateProduct"
                    class="w-100 text-uppercase"
                  >
                    <v-icon left>mdi-pencil</v-icon> Update Product
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    color="error"
                    @click="openDeleteConfirmation"
                    class="w-100 text-uppercase"
                  >
                    <v-icon left>mdi-delete</v-icon> Delete Product
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <!-- Error Alert -->
          <v-alert v-if="error" type="error" dismissible class="mb-4">
            {{ error }}
          </v-alert>

          <!-- If no product is found -->
          <v-card v-if="!product" class="mx-auto elevation-4" max-width="800">
            <v-card-text>
              <p class="text-center">No product found.</p>
            </v-card-text>
          </v-card>
        </v-col>
        <!-- Confirmation Dialog for Deleting -->
        <v-dialog v-model="deleteDialog" max-width="400">
          <v-card>
            <v-card-title class="headline">Confirm Deletion</v-card-title>
            <v-card-text>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green" text @click="deleteProduct"
                >Yes, Delete</v-btn
              >
              <v-btn color="red" text @click="deleteDialog = false"
                >Cancel</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>
    </v-container>
  </v-app>
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
        // await this.updateProductInStore({
        //   id: this.productId,
        //   data: this.updatedProductData,
        // });
        console.log(this.productId);
        this.$router.push(`/addproduct/${this.productId}`); // Redirect after update
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
      this.$router.go(-1); // Go back to the previous page
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
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.text-center {
  text-align: center;
}

.v-row {
  margin-bottom: 20px;
}

.v-btn {
  text-transform: none;
}

.v-card-title {
  font-size: 1.5rem;
  font-weight: bold;
}

.v-alert {
  margin-bottom: 20px;
}

.elevation-12 {
  box-shadow: 0 12px 16px rgba(0, 0, 0, 0.2);
}

.elevation-4 {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.text-uppercase {
  text-transform: uppercase;
}
</style>
