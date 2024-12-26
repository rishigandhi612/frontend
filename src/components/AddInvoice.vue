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
    <v-row v-if="loading" justify="center" align="center">
      <v-col cols="auto">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          width="6"
        ></v-progress-circular>
      </v-col>
    </v-row>

    <!-- Form -->
    <v-form ref="form" v-model="valid" v-if="!loading">
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
            v-model="product.unitPrice"
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
      <!-- Add Product and Submit Button -->
      <v-row class="mt-3">
        <v-col cols="12" class="d-flex justify-center">
          <v-btn
            color="primary"
            @click="addProduct"
            icon
            aria-label="Add Product"
          >
            <v-icon>mdi-plus</v-icon> Add Product
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
        width: 0,
        quantity: 1, // Default quantity to 1
        unitPrice: 0,
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
            parseFloat(product.quantity * product.unitPrice) || 0;
          return sum + totalPrice;
        }, 0)
        .toFixed(2); // Calculate total items price and format to 2 decimal places
    },
    calculateGrandTotal() {
      const totalItemsPrice = this.invoiceProducts.reduce((sum, product) => {
        const totalPrice =
          parseFloat(product.quantity * product.unitPrice) || 0;
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

    async addInvoice() {
  this.error = null;

  // Calculate CGST, SGST, and grand total
  const totalItemsPrice = this.invoiceProducts.reduce((sum, product) => {
    const totalPrice = parseFloat(product.quantity * product.unitPrice) || 0;
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
      width: parseInt(product.width),
      quantity: parseInt(product.quantity),
      unitPrice: parseFloat(product.unitPrice),
      totalPrice: parseFloat(this.getTotalPrice(index)), // Calculate totalPrice
    })),
    otherCharges, // Include other charges
    cgst: Math.round(cgst), // Include rounded CGST
    sgst: Math.round(sgst), // Include rounded SGST
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
        isNaN(product.unitPrice)
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

  // The same calculations as in addInvoice
  const totalItemsPrice = this.invoiceProducts.reduce((sum, product) => {
    const totalPrice = parseFloat(product.quantity * product.unitPrice) || 0;
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
      width: parseInt(product.width),
      quantity: parseInt(product.quantity),
      unitPrice: parseFloat(product.unitPrice),
      totalPrice: parseFloat(this.getTotalPrice(index)), // Calculate totalPrice
    })),
    otherCharges, // Include other charges
    cgst: Math.round(cgst), // Include rounded CGST
    sgst: Math.round(sgst), // Include rounded SGST
    grandTotal, // Include the rounded grand total
  };

  if (
    !payload.customer ||
    payload.products.some(
      (product) =>
        !product.product ||
        isNaN(product.width) ||
        isNaN(product.quantity) ||
        isNaN(product.unitPrice)
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
  background-color: #bdbdbd !important; /* Slightly darker grey when hovered */
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
