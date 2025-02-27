<template>
  <v-container fluid>
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
      <v-row v-if="!loading">
        <v-col>

      <!-- Title centered in the same column -->
      <div class="flex-grow-1 text-center">
        <h1>
              {{ isEditing ? "Edit Invoice" : "Add Invoice" }}
       </h1>
      </div>
      </v-col>
      </v-row>
         <!-- Form -->
         <v-form ref="form" v-model="valid">
        <v-select
          v-model="selectedCustomerId"
          :items="allCustomers"
          item-text="name"
          item-value="_id"
          label="Select Customer"
          return-object
          required
        />

        <!-- Product List Section -->
        <v-row v-for="(product, index) in invoiceProducts" :key="index">
          <!-- Product Selection Column -->
          <v-col cols="12" md="3" class="pa-n ma-n">
            <v-select
              v-model="product.productId"
              :items="allProducts"
              item-text="name"
              item-value="_id"
              label="Select Product"
              return-object
              required
            />
          </v-col>

          <!-- Width Column -->
          <v-col cols="12" md="2" class="mt-0 py-0 pa-n ma-n">
            <v-text-field
              v-model="product.width"
              label="Width"
              :rules="[rules.required, rules.numeric]"
              required
              type="number"
              min="1"
            />
          </v-col>

          <!-- Quantity Column -->
          <v-col cols="12" md="2" class="mt-0 py-0 pa-n ma-n">
            <v-text-field
              v-model="product.quantity"
              label="Quantity"
              :rules="[rules.required, rules.numeric]"
              required
              type="number"
              min="1"
            />
          </v-col>

          <!-- Unit Price Column -->
          <v-col cols="12" md="2" class="mt-0 py-0 pa-n ma-n">
            <v-text-field
              v-model="product.unit_price"
              label="Unit Price"
              :rules="[rules.required, rules.numeric]"
              required
              type="number"
              min="0"
            />
          </v-col>

          <!-- Total Price Column -->
          <v-col cols="12" md="2" class="mt-0 py-0 pa-n ma-n">
            <v-text-field
              :value="getTotalPrice(index)"
              label="Total Price"
              readonly
            />
          </v-col>

          <!-- Remove Product Button -->
          <v-col
            cols="12"
            md="1"
            class="d-flex align-center justify-start pl-n1 pa-n ma-n"
          >
            <v-btn
              color="error"
              @click="removeProduct(index)"
              icon
              aria-label="Remove Product"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <!-- Add Product and Batch Add Product Buttons -->
        <v-row class="mt-3">
          <v-col cols="6" class="d-flex justify-end">
            <v-btn
              color="primary"
              @click="addProduct"
              aria-label="Add Product"
            >
              <v-icon left>mdi-plus</v-icon> Add Product
            </v-btn>
          </v-col>
          <v-col cols="6" class="d-flex justify-start">
            <v-btn
              color="info"
              @click="openBatchDialog"
              aria-label="Batch Add Product"
            >
              <v-icon left>mdi-playlist-plus</v-icon> Batch Add Product
            </v-btn>
          </v-col>

          <!-- Total Row -->
          <v-row class="mt-3">
            <!-- Total Items Price -->
            <v-col cols="12" md="3">
              <v-text-field
                :value="calculateTotalItemsPrice()"
                label="Total Items Price"
                readonly
              />
            </v-col>

            <!-- Other Charges -->
            <v-col cols="12" md="3">
              <v-text-field
                v-model="otherCharges"
                label="Other Charges"
                type="number"
                min="0"
              />
            </v-col>

            <!-- Total CGST -->
            <v-col cols="12" md="3">
              <v-text-field
                :value="calculateTax(0.09)"
                label="Total CGST (9%)"
                readonly
              />
            </v-col>

            <!-- Total SGST -->
            <v-col cols="12" md="3">
              <v-text-field
                :value="calculateTax(0.09)"
                label="Total SGST (9%)"
                readonly
              />
            </v-col>

            <!-- Total IGST -->
            <v-col cols="12" md="3">
              <v-text-field
                :value="calculateTax(0.18)"
                label="Total IGST (18%)"
                readonly
              />
            </v-col>
            <!-- Grand Total -->
            <v-col cols="12" md="4" class="mt-3">
              <v-text-field
                :value="calculateGrandTotal()"
                label="Grand Total"
                readonly
              />
            </v-col>
          </v-row>

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
        </v-row>
      </v-form>
       </v-col>
      <!-- Error Alert -->
      <v-alert v-if="error" type="error" dismissible>
        {{ error }}
      </v-alert>
    </v-row>

    <!-- Batch Add Dialog -->
    <v-dialog v-model="batchDialog" max-width="800px">
      <v-card>
        <v-card-title class="headline">Batch Add Product</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="batchProduct.productId"
                :items="allProducts"
                item-text="name"
                item-value="_id"
                label="Select Product"
                return-object
                required
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="batchProduct.unit_price"
                label="Unit Price"
                type="number"
                :rules="[rules.required, rules.numeric]"
                required
                min="0"
              />
            </v-col>
          </v-row>
          
          <!-- Batch Items Table -->
          <v-simple-table>
            <template v-slot:default>
              <thead>
                <tr>
                  <th>Width</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in batchItems" :key="i">
                  <td>
                    <v-text-field
                      v-model="item.width"
                      type="number"
                      dense
                      min="1"
                      hide-details
                      :rules="[rules.required, rules.numeric]"
                    />
                  </td>
                  <td>
                    <v-text-field
                      v-model="item.quantity"
                      type="number" 
                      dense
                      min="1"
                      hide-details
                      :rules="[rules.required, rules.numeric]"
                    />
                  </td>
                  <td>
                    {{ calculateBatchItemTotal(item) }}
                  </td>
                  <td>
                    <v-btn 
                      icon 
                      color="error" 
                      @click="removeBatchItem(i)"
                      small
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
          
          <v-row class="mt-3">
            <v-col cols="12" class="d-flex justify-center">
              <v-btn color="primary" @click="addBatchItem">
                <v-icon left>mdi-plus</v-icon> Add Item
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="closeBatchDialog">
            Cancel
          </v-btn>
          <v-btn 
            color="primary" 
            @click="addBatchProducts" 
            :disabled="!isBatchValid"
          >
            Add to Invoice
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      otherCharges: 0, // Ensure this is initialized
      rules: {
        required: (value) => !!value || "Required.",
        numeric: (value) => !isNaN(value) || "Must be a number.",
      },
      // Batch add dialog data
      batchDialog: false,
      batchProduct: {
        productId: null,
        unit_price: 0
      },
      batchItems: []
    };
  },

  computed: {
    ...mapGetters("customers", ["allCustomers"]),
    ...mapGetters("products", ["allProducts"]),
    isBatchValid() {
      return this.batchProduct.productId && 
             this.batchProduct.unit_price > 0 && 
             this.batchItems.length > 0 &&
             !this.batchItems.some(item => 
               !item.width || isNaN(item.width) || 
               !item.quantity || isNaN(item.quantity)
             );
    }
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
        const response = await this.$store.dispatch(
          "invoices/fetchInvoiceById",
          id
        );
        if (response && response.success) {
          const invoice = response.data;

          // Set customer details
          this.selectedCustomerId = invoice.customer._id;

          // Map products properly to ensure unit price and total price are calculated
          this.invoiceProducts = invoice.products.map((product) => ({
            productId: product.product._id,
            width: product.width,
            quantity: product.quantity,
            unit_price: product.unit_price || 0,
            totalPrice: (product.unit_price * product.quantity).toFixed(2), // Calculate total price
          }));
          this.otherCharges = invoice.otherCharges || 0; // Set otherCharges
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
      return (product.quantity * product.unit_price).toFixed(2);
    },

    addProduct() {
      this.invoiceProducts.push({
        productId: null,
        width: 0,
        quantity: 1, // Default quantity to 1
        unit_price: 0,
        totalPrice: 0, // This will be dynamically updated
      });
    },

    removeProduct(index) {
      this.invoiceProducts.splice(index, 1);
    },
    
    calculateTotalItemsPrice() {
      return this.invoiceProducts
        .reduce((sum, product) => {
          const totalPrice =
            parseFloat(product.quantity * product.unit_price) || 0;
          return sum + totalPrice;
        }, 0)
        .toFixed(2); // Calculate total items price and format to 2 decimal places
    },
    
    calculateGrandTotal() {
      const totalItemsPrice = this.invoiceProducts.reduce((sum, product) => {
        const totalPrice =
          parseFloat(product.quantity * product.unit_price) || 0;
        return sum + totalPrice;
      }, 0);

      const otherCharges = parseFloat(this.otherCharges) || 0;
      const totalWithOtherCharges = totalItemsPrice + otherCharges;

      const cgst = totalWithOtherCharges * 0.09;
      const sgst = totalWithOtherCharges * 0.09;

      return Math.round(totalWithOtherCharges + cgst + sgst); // Use Math.round for rounding
    },
    
    calculateTax(rate) {
      const totalItemsPrice = parseFloat(this.calculateTotalItemsPrice());
      const totalWithOtherCharges =
        totalItemsPrice + (parseFloat(this.otherCharges) || 0);
      return (totalWithOtherCharges * rate).toFixed(2); // Calculate tax on total including other charges
    },

    // Batch dialog methods
    openBatchDialog() {
      this.batchProduct = {
        productId: null,
        unit_price: 0
      };
      this.batchItems = [
        { width: 0, quantity: 1 } // Start with one item
      ];
      this.batchDialog = true;
    },
    
    closeBatchDialog() {
      this.batchDialog = false;
    },
    
    addBatchItem() {
      this.batchItems.push({ width: 0, quantity: 1 });
    },
    
    removeBatchItem(index) {
      this.batchItems.splice(index, 1);
    },
    
    calculateBatchItemTotal(item) {
      const width = parseFloat(item.width) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(this.batchProduct.unit_price) || 0;
      return (width * quantity * unitPrice).toFixed(2);
    },
    
    addBatchProducts() {
      if (!this.batchProduct.productId || this.batchItems.length === 0) {
        return;
      }
      
      // Add each batch item as a separate product entry
      this.batchItems.forEach(item => {
        this.invoiceProducts.push({
          productId: this.batchProduct.productId,
          width: parseFloat(item.width),
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(this.batchProduct.unit_price),
          // The totalPrice will be calculated by getTotalPrice method
        });
      });
      
      this.closeBatchDialog();
    },

    async addInvoice() {
      this.error = null;

      // Calculate CGST, SGST, and grand total
      const totalItemsPrice = this.invoiceProducts.reduce((sum, product) => {
        const totalPrice =
          parseFloat(product.quantity * product.unit_price) || 0;
        return sum + totalPrice;
      }, 0);

      const otherCharges = parseFloat(this.otherCharges) || 0;
      const totalWithOtherCharges = totalItemsPrice + otherCharges;

      const cgst = totalWithOtherCharges * 0.09;
      const sgst = totalWithOtherCharges * 0.09;
      const grandTotal = Math.round(totalWithOtherCharges + cgst + sgst);

      // Prepare the payload
      const payload = {
        customer: this.selectedCustomerId,
        products: this.invoiceProducts.map((product, index) => ({
          product: product.productId,
          width: parseFloat(product.width),
          quantity: parseFloat(product.quantity),
          unit_price: parseFloat(product.unit_price),
          totalPrice: parseFloat(this.getTotalPrice(index)), // Calculate totalPrice
        })),
        otherCharges, // Include other charges
        cgst: cgst, // Include rounded CGST
        sgst: sgst, // Include rounded SGST
        grandTotal, // Include the rounded grand total
      };

      // Validation check for required fields
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
        return;
      }

      try {
        await this.createInvoiceInStore(payload); // Send the payload to the store
        this.$router.push("/invoice");
      } catch (err) {
        console.error("API Error:", err);
        this.error = "Error adding invoice.";
      }
    },

    async updateInvoice() {
      this.error = null;

      // The same calculations as addInvoice
      const totalItemsPrice = this.invoiceProducts.reduce((sum, product) => {
        const totalPrice =
          parseFloat(product.quantity * product.unit_price) || 0;
        return sum + totalPrice;
      }, 0);

      const otherCharges = parseFloat(this.otherCharges) || 0;
      const totalWithOtherCharges = totalItemsPrice + otherCharges;
      const cgst = totalWithOtherCharges * 0.09;
      const sgst = totalWithOtherCharges * 0.09;
      const grandTotal = Math.round(totalWithOtherCharges + cgst + sgst);

      const payload = {
        customer: this.selectedCustomerId,
        products: this.invoiceProducts.map((product, index) => ({
          product: product.productId,
          width: parseFloat(product.width).toFixed(2), // Round to 2 decimals if needed
          quantity: parseFloat(product.quantity).toFixed(3), // Round to 3 decimals if needed
          unit_price: parseFloat(product.unit_price).toFixed(2), // Ensure 2 decimal places
          totalPrice: parseFloat(this.getTotalPrice(index)).toFixed(2), // Round total price to 2 decimals
        })),
        otherCharges: otherCharges.toFixed(2), // Round other charges
        cgst: cgst.toFixed(2), // Round CGST
        sgst: sgst.toFixed(2), // Round SGST
        grandTotal: grandTotal, // Already rounded
      };

      console.log(payload);

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
        return;
      }

      // Prevent update if no changes detected
      if (JSON.stringify(payload) === JSON.stringify(this.originalInvoice)) {
        this.error = "No changes detected.";
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
      this.$router.go(-1); // Go back to the previous page
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
  transition: background-color 0.3s ease;
}

.back-btn:hover {
  background-color: #bdbdbd !important; 
}

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.v-btn {
  transition: background-color 0.2s ease;
}

.v-text-field[readonly] {
  background-color: #f5f5f5;
}
</style>