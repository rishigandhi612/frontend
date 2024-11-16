<template>
  <v-container>
    <!-- Row to hold Back Button and Header -->
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <!-- Back Button with Grey Background -->
        <v-btn icon @click="goBack" class="back-btn">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <!-- Title centered in the same column -->
        <div class="flex-grow-1 text-center">
          <h1>
            {{ isEditing ? "Edit Invoice" : "Add Invoice" }}
          </h1>
        </div>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" dismissible>
      {{ error }}
    </v-alert>

    <!-- Loader Spinner -->
    <v-row v-if="loading" justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate color="primary" size="64" width="6"></v-progress-circular>
      </v-col>
    </v-row>

    <!-- Form -->
    <v-form ref="form" v-model="valid" v-if="!loading">
      <div>
        <v-select
          v-model="selectedCustomerId"
          :items="allCustomers"
          item-text="name"
          item-value="_id"
          label="Select Customer"
          return-object
        />
      </div>

      <!-- Product List Section -->
      <v-row v-for="(product, index) in invoiceProducts" :key="index">
        <v-col cols="12" md="3">
          <v-select
            v-model="product.productId"
            :items="allProducts"
            item-text="name"
            item-value="_id"
            label="Select Product"
            return-object
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-text-field
            v-model="product.quantity"
            label="Quantity"
            :rules="[rules.required, rules.numeric]"
            required
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-text-field
            v-model="product.unitPrice"
            label="Unit Price"
            :rules="[rules.required, rules.numeric]"
            required
            type="number"
            min="0"
          />
        </v-col>

        <v-col cols="12" md="2">
          <v-text-field
            :value="getTotalPrice(index)" 
            label="Total Price"
            readonly
          />
        </v-col>

        <v-col cols="12" md="1" class="d-flex align-center justify-center">
          <v-btn color="error" @click="removeProduct(index)" icon>
            <v-icon>mdi-delete</v-icon> Remove
          </v-btn>
        </v-col>
      </v-row>

      <!-- Add Product and Submit Button -->
      <v-row class="mt-3">
        <v-col cols="12" class="d-flex justify-center">
          <v-btn color="primary" @click="addProduct" icon>
            <v-icon>mdi-plus</v-icon> Add Product
          </v-btn>
        </v-col>

        <v-col cols="12" class="d-flex justify-end mt-3">
          <v-btn :disabled="!valid || invoiceProducts.length === 0" color="success" @click="isEditing ? updateInvoice() : addInvoice()">
            {{ isEditing ? "Update Invoice" : "Add Invoice" }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  data() {
    return {
      selectedCustomerId: null,
      invoiceProducts: [],
      error: null,
      valid: false,
      isEditing: false,
      invoiceId: null,
      originalInvoice: null,
      loading: false, // Loader state
      rules: {
        required: (value) => !!value || "Required.",
        numeric: (value) => !isNaN(value) || "Must be a number.",
      },
    };
  },

  computed: {
    ...mapGetters("customers", ["allCustomers"]),
    ...mapGetters("products", ["allProducts"]),
  },

  async created() {
    this.loading = true; // Start loader when the component is created
    await this.fetchCustomersAndProducts(); // Fetch customers and products on created

    if (this.$route.params.id) {
      this.isEditing = true;
      this.invoiceId = this.$route.params.id;
      await this.fetchInvoiceDetail(this.invoiceId); // Fetch existing invoice data
    }
    this.loading = false; // Stop loader once data is fetched
  },

  methods: {
    ...mapActions("invoices", [
      "createInvoiceInStore",
      "fetchInvoiceById",
      "updateInvoiceInStore",
    ]),
    ...mapActions("customers", ["fetchCustomers"]),
    ...mapActions("products", ["fetchProducts"]),

    async fetchCustomersAndProducts() {
      try {
        await Promise.all([this.fetchCustomers(), this.fetchProducts()]);
      } catch (error) {
        console.error("Error fetching customers or products:", error);
        this.error = "Failed to load customer or product data.";
      }
    },

    async fetchInvoiceDetail(id) {
      try {
        const response = await this.$store.dispatch("invoices/fetchInvoiceById", id);
        if (response && response.success) {
          const invoice = response.data;

          // Set customer details
          this.selectedCustomerId = invoice.customer._id;

          // Map products properly to ensure unit price and total price are calculated
          this.invoiceProducts = invoice.products.map((product) => ({
            productId: product.product._id,
            quantity: product.quantity,
            unitPrice: product.unit_price,
            totalPrice: (product.unit_price * product.quantity).toFixed(2), // Calculate total price
          }));

          this.originalInvoice = { ...invoice }; // Save the original invoice data for comparison
        } else {
          throw new Error("Failed to load invoice details for edit.");
        }
      } catch (err) {
        console.error("Error fetching invoice details:", err);
        this.error = "Failed to load invoice details.";
      }
    },

    getTotalPrice(index) {
      const product = this.invoiceProducts[index];
      return (product.quantity * product.unitPrice).toFixed(2);
    },

    addProduct() {
      this.invoiceProducts.push({
        productId: null,
        quantity: 1, // Default quantity to 1
        unitPrice: 0,
        totalPrice: 0, // This will be dynamically updated
      });
    },

    removeProduct(index) {
      this.invoiceProducts.splice(index, 1);
    },

    async addInvoice() {
      this.error = null;

      const payload = {
        customer: this.selectedCustomerId,
        products: this.invoiceProducts.map((product, index) => ({
          product: product.productId,
          quantity: parseInt(product.quantity),
          unitPrice: parseFloat(product.unitPrice),
          totalPrice: parseFloat(this.getTotalPrice(index)), // Calculate totalPrice
        })),
      };

      // Validation check for required fields
      if (
        !payload.customer ||
        payload.products.some(
          (product) => !product.product || isNaN(product.quantity) || isNaN(product.unitPrice)
        )
      ) {
        this.error = "Please fill out all required fields correctly.";
        return;
      }

      try {
        await this.createInvoiceInStore(payload);
        this.$router.push("/invoice");
      } catch (err) {
        console.error("API Error:", err);
        this.error = "Error adding invoice.";
      }
    },

    async updateInvoice() {
      this.error = null;

      const payload = {
        customer: this.selectedCustomerId,
        products: this.invoiceProducts.map((product, index) => ({
          product: product.productId,
          quantity: parseInt(product.quantity),
          unitPrice: parseFloat(product.unitPrice),
          totalPrice: parseFloat(this.getTotalPrice(index)), // Calculate totalPrice
        })),
      };

      // Validation check for required fields
      if (
        !payload.customer ||
        payload.products.some(
          (product) => !product.product || isNaN(product.quantity) || isNaN(product.unitPrice)
        )
      ) {
        this.error = "Please fill out all required fields correctly.";
        return;
      }

      try {
        await this.updateInvoiceInStore({ id: this.invoiceId, data: payload });
        this.$router.push("/invoice");
      } catch (err) {
        console.error("API Error:", err);
        this.error = "Error updating invoice.";
      }
    },

    goBack() {
      this.$router.push("/invoice"); // Navigate back to the invoice list page
    },
  },
};
</script>

<style scoped>
.v-container {
  margin-top: 20px;
}

.text-center {
  text-align: center;
}

.back-btn {
  background-color: #e0e0e0; /* Grey background */
  color: #000; /* Black icon for visibility */
  border-radius: 50%; /* Make the button circular */
  padding: 10px; /* Add padding for better clickability */
}

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  text-align: center;
}
</style>
