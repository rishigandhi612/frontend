// InvoiceForm.vue
<template>
  <v-container fluid>
    <!-- Loader Spinner -->
    <v-row v-if="loading">
      <v-col class="d-flex justify-center align-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    
    <v-row v-if="!loading">
      <v-col md="2" cols="12">
        <v-row>
          <v-col>
            <v-btn @click="goBack" block>
              <v-icon left>mdi-arrow-left</v-icon> Back
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      
      <v-col md="8" cols="12">
        <v-row>
          <v-col>
            <!-- Title centered in the same column -->
            <div class="flex-grow-1 text-center">
              <h1>{{ isEditing ? "Edit Invoice" : "Add Invoice" }}</h1>
            </div>
          </v-col>
        </v-row>
        
        <!-- Form -->
        <v-form ref="form" v-model="valid">
          <v-autocomplete
            v-model="selectedCustomerId"
            :items="allCustomers"
            item-text="name"
            item-value="_id"
            label="Select Customer"
            return-object
            required
          />

          <!-- Products Component -->
          <product-list
            :invoice-products="invoiceProducts"
            :all-products="allProducts"
            :rules="rules"
            @product-removed="removeProduct"
            @product-total-update="updateTotals"
          />
          
          <!-- Action Buttons -->
          <v-row class="mt-3">
            <v-col cols="6" class="d-flex justify-end">
              <v-btn color="primary" @click="addProduct" aria-label="Add Product">
                <v-icon left>mdi-plus</v-icon> Add Product
              </v-btn>
            </v-col>
            <v-col cols="6" class="d-flex justify-start">
              <v-btn color="info" @click="openBatchDialog" aria-label="Batch Add Product">
                <v-icon left>mdi-playlist-plus</v-icon> Batch Add Product
              </v-btn>
            </v-col>
          </v-row>

          <!-- Invoice Totals Component -->
          <invoice-totals
  :invoice-products="invoiceProducts"
  :other-charges="otherCharges"
  :selected-customer="getSelectedCustomerObject"
  @update:other-charges="otherCharges = $event"
  @intra-state-update="handleGstTypeChange"
/>

          <v-col cols="12" class="d-flex justify-end mt-3">
            <v-btn
              :disabled="!valid || invoiceProducts.length === 0"
              color="success"
              @click="isEditing ? updateInvoice() : addInvoice()"
              aria-label="Submit Invoice"
            >
              {{ isEditing ? "Update Invoice" : "Add Invoice" }}
            </v-btn>
          </v-col>
        </v-form>
      </v-col>
      
      <!-- Error Alert -->
      <v-alert v-if="error" type="error" dismissible>
        {{ error }}
      </v-alert>
    </v-row>

    <!-- Batch Dialog Component -->
    <batch-dialog
  :show="batchDialog"
  @update:show="batchDialog = $event"
  :all-products="allProducts"
  :rules="rules"
  @batch-products-added="addBatchProductsToInvoice"
/>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import ProductList from './addInvoiceProductList.vue';
import InvoiceTotals from './InvoiceTotals.vue';
import BatchDialog from './BatchDialog.vue';

export default {
  components: {
    ProductList,
    InvoiceTotals,
    BatchDialog
  },
  
  data() {
    return {
      selectedCustomerId: null,
      invoiceProducts: [],
      error: null,
      valid: false,
      isEditing: false,
      invoiceId: null,
      originalInvoice: null,
      loading: false,
      otherCharges: 0,
      isIntraStateTransaction: true, 
      cgst: 0,
      sgst: 0,
      igst: 0,
      rules: {
        required: (value) => !!value || "Required.",
        numeric: (value) => !isNaN(value) || "Must be a number.",
      },
      batchDialog: false
    };
  },

  computed: {
    ...mapGetters("customers", ["allCustomers"]),
    ...mapGetters("products", ["allProducts"]),
    getSelectedCustomerObject() {
      console.log("Selected customer ID:", this.selectedCustomerId);
      
      if (!this.selectedCustomerId) {
        console.log("No customer selected");
        return null;
      }
      
      // If using return-object in v-select, this might be the full object already
      if (typeof this.selectedCustomerId === 'object' && this.selectedCustomerId !== null) {
        console.log("Selected customer is already an object:", this.selectedCustomerId);
        return this.selectedCustomerId;
      }
      
      // Otherwise find the customer by ID
      const customer = this.allCustomers.find(c => c._id === this.selectedCustomerId);
      console.log("Found customer:", customer);
      return customer;
    }
  },

  async created() {
    this.loading = true;
    await this.fetchCustomersAndProducts();

    if (this.$route.params.id) {
      this.isEditing = true;
      this.invoiceId = this.$route.params.id;
      await this.fetchInvoiceDetail(this.invoiceId);
    }
    this.loading = false;
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
          this.selectedCustomerId = invoice.customer._id;
          this.invoiceProducts = invoice.products.map((product) => ({
            productId: product.product._id,
            width: product.width,
            quantity: product.quantity,
            unit_price: product.unit_price || 0,
            totalPrice: (product.unit_price * product.quantity).toFixed(2),
          }));
          this.otherCharges = invoice.otherCharges || 0;
          this.originalInvoice = { ...invoice };
        } else {
          throw new Error("Failed to load invoice details for edit.");
        }
      } catch (err) {
        console.error("Error fetching invoice details:", err);
        this.error = "Failed to load invoice details.";
      }
    },

    addProduct() {
      this.invoiceProducts.push({
        productId: null,
        width: 0,
        quantity: 1,
        unit_price: 0,
        totalPrice: 0,
      });
    },
    removeProduct(index) {
      this.invoiceProducts.splice(index, 1);
    },

    openBatchDialog() {
      this.batchDialog = true;
    },
    
    addBatchProductsToInvoice(batchProducts) {
      this.invoiceProducts = [...this.invoiceProducts, ...batchProducts];
      this.batchDialog = false;
    },

    updateTotals() {
      // This method can be called when needed to update any dependent calculations
    },
    handleGstTypeChange(isIntraState) {
      console.log("GST Type Changed:", isIntraState ? "CGST+SGST" : "IGST");
      this.isIntraStateTransaction = isIntraState;
    },
    async addInvoice() {
      this.error = null;
      
      const invoicePayload = this.prepareInvoicePayload();
      
      if (!this.validateInvoicePayload(invoicePayload)) {
        return;
      }

      try {
        await this.createInvoiceInStore(invoicePayload);
        this.$router.push("/invoice");
      } catch (err) {
        console.error("API Error:", err);
        this.error = "Error adding invoice.";
      }
    },

    async updateInvoice() {
      this.error = null;
      
      const invoicePayload = this.prepareInvoicePayload();
      
      if (!this.validateInvoicePayload(invoicePayload)) {
        return;
      }

      // Prevent update if no changes detected
      if (JSON.stringify(invoicePayload) === JSON.stringify(this.originalInvoice)) {
        this.error = "No changes detected.";
        return;
      }

      try {
        await this.updateInvoiceInStore({ id: this.invoiceId, data: invoicePayload });
        this.$router.push("/invoice");
      } catch (err) {
        console.error("API Error:", err);
        this.error = "Error updating invoice.";
      }
    },

    prepareInvoicePayload() {
      const totalItemsPrice = this.calculateTotalItemsPrice();
      const otherCharges = parseFloat(this.otherCharges) || 0;
      const totalWithOtherCharges = totalItemsPrice + otherCharges;
      
      // Calculate taxes based on intra/inter state
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      
      if (this.isIntraStateTransaction) {
        cgstAmount = totalWithOtherCharges * 0.09;
        sgstAmount = totalWithOtherCharges * 0.09;
      } else {
        igstAmount = totalWithOtherCharges * 0.18;
      }
      
      const grandTotal = Math.round(totalWithOtherCharges + cgstAmount + sgstAmount + igstAmount);

      return {
        customer: this.selectedCustomerId,
        products: this.invoiceProducts.map((product) => ({
          product: product.productId,
          width: parseFloat(product.width),
          quantity: parseFloat(product.quantity),
          unit_price: parseFloat(product.unit_price),
          totalPrice: parseFloat(product.quantity * product.unit_price),
        })),
        otherCharges,
        cgst: cgstAmount,
        sgst: sgstAmount,
        igst: igstAmount,
        grandTotal,
      };
    },

    validateInvoicePayload(payload) {
      if (
        !payload.customer ||
        payload.products.some(
          (product) =>
            !product.product ||
            isNaN(product.width) ||
            isNaN(product.quantity) ||
            isNaN(product.unit_price)
        )
      ) {
        this.error = "Please fill out all required fields correctly.";
        return false;
      }
      return true;
    },

    calculateTotalItemsPrice() {
      return this.invoiceProducts.reduce((sum, product) => {
        const totalPrice = parseFloat(product.quantity * product.unit_price) || 0;
        return sum + totalPrice;
      }, 0);
    },
    goBack() {
      this.$router.go(-1);
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

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.v-btn {
  transition: background-color 0.2s ease;
}
</style>