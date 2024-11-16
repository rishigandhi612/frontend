<template>
    <v-container>
      <h1 class="text-center">
        {{ isEditing ? "Edit Invoice" : "Add Invoice" }}
      </h1>
  
      <v-alert v-if="error" type="error" dismissible>
        {{ error }}
      </v-alert>
  
      <v-form ref="form" v-model="valid">
        <div>
          <v-select
            v-model="selectedCustomerId"
            :items="allCustomers"
            item-text="name"
            item-value="_id"
            label="Select Customer"
            return-object
          />
          <v-select
            v-model="selectedProductId"
            :items="allProducts"
            item-text="name"
            item-value="_id"
            label="Select Product"
            return-object
          />
        </div>
  
        <v-text-field
          v-model="quantity"
          label="Quantity"
          :rules="[rules.required, rules.numeric]"
          required
        ></v-text-field>
  
        <v-text-field
          v-model="unitPrice"
          label="Unit Price"
          :rules="[rules.required, rules.numeric]"
          required
        ></v-text-field>
  
        <v-btn
          :disabled="!valid"
          color="success"
          @click="isEditing ? updateInvoice() : addInvoice()"
        >
          {{ isEditing ? "Update Invoice" : "Add Invoice" }}
        </v-btn>
      </v-form>
    </v-container>
  </template>
  
  <script>
  import { mapActions, mapGetters } from "vuex";
  
  export default {
    data() {
      return {
        selectedCustomerId: null, // Changed from customerId
        selectedProductId: null, // Changed from productId
        quantity: "",
        unitPrice: "",
        error: null,
        valid: false,
        isEditing: false, // Flag for edit mode
        invoiceId: null, // To store the invoice ID when editing
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
      await this.fetchCustomersAndProducts(); // Fetch customers and products on created
  
      if (this.$route.params.id) {
        this.isEditing = true;
        this.invoiceId = this.$route.params.id;
        await this.fetchInvoiceDetail(this.invoiceId); // Fetch existing invoice data
      }
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
          ); // Call the correct action
          if (response && response.success) {
            const invoice = response.data;
            this.selectedCustomerId = invoice.customer._id; // Set preselected customer ID
            this.selectedProductId = invoice.product._id; // Set preselected product ID
            this.quantity = invoice.quantity;
            this.unitPrice = invoice.unit_price;
          } else {
            throw new Error("Failed to load invoice details for edit.");
          }
        } catch (err) {
          console.error("Error fetching invoice details:", err);
          this.error = "Failed to load invoice details.";
        }
      },
  
      async addInvoice() {
        this.error = null;
  
        const payload = {
          customer: this.selectedCustomerId,
          product: this.selectedProductId,
          quantity: parseInt(this.quantity),
          unit_price: parseInt(this.unitPrice),
        };
  
        if (
          !payload.customer ||
          !payload.product ||
          isNaN(payload.quantity) ||
          isNaN(payload.unit_price)
        ) {
          this.error = "Please fill out all required fields correctly.";
          return;
        }
  
        if (payload.unit_price <= 0) {
          this.error = "Unit Price must be a valid positive number.";
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
          product: this.selectedProductId,
          quantity: parseInt(this.quantity),
          unit_price: parseFloat(this.unitPrice),
        };
  
        if (
          !payload.customer ||
          !payload.product ||
          isNaN(payload.quantity) ||
          isNaN(payload.unit_price)
        ) {
          this.error = "Please fill out all required fields correctly.";
          return;
        }
  
        if (payload.unit_price <= 0) {
          this.error = "Unit Price must be a valid positive number.";
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
    },
  };
  </script>
  
  <style scoped>
  .v-container {
    margin-top: 20px;
  }
  </style>
  