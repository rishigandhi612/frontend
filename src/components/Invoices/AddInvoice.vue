// InvoiceForm.vue - Updated with InventoryDialog integration
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
        
        <!-- Invoice Number - Only show input field in edit mode -->
        <v-row class="mt-3" v-if="isEditing">
          <v-col cols="12" md="6" offset-md="3">
            <v-text-field
              v-model="invoiceNumber"
              label="Invoice Number"
              :rules="[rules.required]"
              required
              :disabled="!canEditInvoiceNumber"
              :hint="!canEditInvoiceNumber ? 'Invoice number cannot be modified' : ''"
              persistent-hint
            />
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
          
          <!-- Action Buttons - Updated with new inventory button -->
          <v-row class="mt-3">
            <v-col cols="4" class="d-flex justify-end">
              <v-btn color="primary" @click="addProduct" aria-label="Add Product">
                <v-icon left>mdi-plus</v-icon> Add Product
              </v-btn>
            </v-col>
            <v-col cols="4" class="d-flex justify-center">
              <v-btn color="info" @click="openBatchDialog" aria-label="Batch Add Product">
                <v-icon left>mdi-playlist-plus</v-icon> Batch Add
              </v-btn>
            </v-col>
            <v-col cols="4" class="d-flex justify-start">
              <v-btn color="success" @click="openInventoryDialog" aria-label="Add from Inventory">
                <v-icon left>mdi-warehouse</v-icon> Add from Inventory
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
              :disabled="!valid || invoiceProducts.length === 0 || isSubmitting"
              color="success"
              @click="isEditing ? updateInvoice() : addInvoice()"
              aria-label="Submit Invoice"
            >
              <template v-if="isSubmitting">
                <v-progress-circular
                  indeterminate
                  size="20"
                  width="2"
                  color="white"
                  class="mr-2"
                ></v-progress-circular>
                {{ isEditing ? "Updating..." : "Adding..." }}
              </template>
              <template v-else>
                {{ isEditing ? "Update Invoice" : "Add Invoice" }}
              </template>
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

    <!-- Inventory Dialog Component -->
    <inventory-dialog
      :show="inventoryDialog"
      @update:show="inventoryDialog = $event"
      :all-products="allProducts"
      :rules="rules"
      @inventory-products-added="addInventoryProductsToInvoice"
    />
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapState } from "vuex";
import ProductList from './addInvoiceProductList.vue';
import InvoiceTotals from './InvoiceTotals.vue';
import BatchDialog from './BatchDialog.vue';
import InventoryDialog from './InventoryDialog.vue';

export default {
  components: {
    ProductList,
    InvoiceTotals,
    BatchDialog,
    InventoryDialog
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
      invoiceNumber: '',
      canEditInvoiceNumber: false,
      rules: {
        required: (value) => !!value || "Required.",
        numeric: (value) => !isNaN(value) || "Must be a number.",
      },
      batchDialog: false,
      inventoryDialog: false // New data property for inventory dialog
    };
  },

  computed: {
    ...mapGetters("customers", ["allCustomers"]),
    ...mapGetters("products", ["allProducts"]),
    ...mapState("invoices", {
      isSubmitting: state => state.loadingState.createUpdateInvoice
    }),
    getSelectedCustomerObject() {
      console.log("Selected customer ID:", this.selectedCustomerId);
      
      if (!this.selectedCustomerId) {
        console.log("No customer selected");
        return null;
      }
      
      if (typeof this.selectedCustomerId === 'object' && this.selectedCustomerId !== null) {
        console.log("Selected customer is already an object:", this.selectedCustomerId);
        return this.selectedCustomerId;
      }
      
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
      this.canEditInvoiceNumber = this.checkPermissionToEditInvoiceNumber();
    } else {
      this.invoiceNumber = 'Will be auto-generated';
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

    checkPermissionToEditInvoiceNumber() {
      return true;
    },

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
          this.invoiceNumber = invoice.invoiceNumber || '';
          this.isIntraStateTransaction = invoice.igst === 0;
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

    // New methods for inventory dialog
    openInventoryDialog() {
      this.inventoryDialog = true;
    },
    
    addInventoryProductsToInvoice(inventoryProducts) {
      // Add inventory products to the existing invoice products
      this.invoiceProducts = [...this.invoiceProducts, ...inventoryProducts];
      this.inventoryDialog = false;
      
      // Show success message
      this.$toast?.success?.(
        `Added ${inventoryProducts.length} items from inventory to invoice.`
      );
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
      
      if (!this.isEditing) {
        delete invoicePayload.invoiceNumber;
      }
      
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

    // Fixed prepareInvoicePayload method for InvoiceForm.vue

prepareInvoicePayload() {
  const totalItemsPrice = this.calculateTotalItemsPrice();
  const otherCharges = parseFloat(this.otherCharges) || 0;
  const totalWithOtherCharges = totalItemsPrice + otherCharges;
  
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

  // ✅ FIXED: Properly handle product structure
  const products = this.invoiceProducts.map((product) => {
    // Handle both cases: when productId is a string and when it's an object
    let productReference;
    
    if (typeof product.productId === 'string') {
      // Normal case: productId is just the ID string
      productReference = { _id: product.productId };
    } else if (product.productId && product.productId._id) {
      // From inventory dialog: productId is already an object with _id
      productReference = product.productId;
    } else {
      // Fallback: try to find the product in allProducts
      const foundProduct = this.allProducts.find(p => p._id === product.productId);
      productReference = foundProduct || { _id: product.productId };
    }

    return {
      product: productReference,
      width: parseFloat(product.width || 0),
      quantity: parseFloat(product.quantity),
      unit_price: parseFloat(product.unit_price),
      totalPrice: parseFloat(product.quantity * product.unit_price),
      // Include inventory reference if available
      ...(product.rollId && { rollId: product.rollId }),
      ...(product.inventoryItemId && { inventoryItemId: product.inventoryItemId })
    };
  });

  // ✅ Also collect all rollIds for inventory tracking
  const rollIds = this.invoiceProducts
    .filter(product => product.rollId)
    .map(product => product.rollId);

  return {
    customer: this.selectedCustomerId,
    invoiceNumber: this.invoiceNumber,
    products,
    rollIds: rollIds.length > 0 ? rollIds : undefined, // Only include if there are roll IDs
    otherCharges,
    cgst: cgstAmount,
    sgst: sgstAmount,
    igst: igstAmount,
    grandTotal,
  };
},

    validateInvoicePayload(payload) {
      if (!payload.customer) {
        this.error = "Please select a customer.";
        return false;
      }
      
      if (this.isEditing && !payload.invoiceNumber) {
        this.error = "Invoice number is required.";
        return false;
      }
      
      if (payload.products.length === 0) {
        this.error = "Please add at least one product.";
        return false;
      }
      
      if (payload.products.some(
        (product) =>
          !product.product ||
          isNaN(product.quantity) ||
          isNaN(product.unit_price)
      )) {
        this.error = "Please fill out all product details correctly.";
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