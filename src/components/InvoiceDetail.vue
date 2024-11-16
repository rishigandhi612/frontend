<template>
  <v-container>
    <h1 class="text-center">Invoice Detail</h1>

    <!-- Show loader while fetching invoice details -->
    <v-row v-if="loading" class="d-flex justify-center align-center" style="height: 80vh;">
      <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
    </v-row>

    <!-- Show error message if there's an error -->
    <v-alert v-if="error" type="error" dismissible>
      {{ error }}
    </v-alert>

    <!-- Show the "Back" button -->
    <v-btn v-if="!loading" color="grey" @click="goBack" class="mb-4">
      <v-icon left>mdi-arrow-left</v-icon>Invoices
    </v-btn>

    <!-- Show invoice details once loaded -->
    <v-card v-if="!loading && invoice" class="mx-auto" max-width="600">
      <v-card-title>
        <span class="headline">Invoice for {{ invoice.product.name }}</span>
      </v-card-title>
      <v-card-text>
        <!-- Product Details -->
        <h3>Product Information</h3>
        <p><strong>Product:</strong> {{ invoice.product.name }}</p>
        <p><strong>Description:</strong> {{ invoice.product.desc }}</p>
        <p><strong>HSN Code:</strong> {{ invoice.product.hsn_code }}</p>
        <p><strong>Quantity:</strong> {{ invoice.quantity }}</p>
        <p><strong>Unit Price:</strong> {{ invoice.unit_price }}</p>
        <p>
          <strong>Total Price:</strong>
          {{ invoice.quantity * invoice.unit_price }}
        </p>
        <p>
          <strong>Created At:</strong>
          {{ new Date(invoice.createdAt).toLocaleDateString() }}
        </p>

        <!-- Customer Details -->
        <h3>Customer Information</h3>
        <p>
          <strong>Customer Name:</strong>
          {{ invoice.customer ? invoice.customer.name : "N/A" }}
        </p>
        <p>
          <strong>Customer Address:</strong>
          {{ formatAddress(invoice.customer?.address) }}
        </p>
        <p><strong>GSTIN:</strong> {{ invoice.customer?.gstin || "N/A" }}</p>
        <p><strong>Email:</strong> {{ invoice.customer?.email_id || "N/A" }}</p>
        <p><strong>Phone:</strong> {{ invoice.customer?.phone_no || "N/A" }}</p>
      </v-card-text>
      <v-card-actions>
        <v-btn color="blue" @click="editInvoice">Update Invoice</v-btn>
        <v-btn color="red" @click="deleteDialog = true">Delete Invoice</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Show message if no invoice found, only if data is loaded -->
    <v-card v-if="!loading && !invoice" class="mx-auto" max-width="600">
      <v-card-text>
        <p class="text-center">No invoice found</p>
      </v-card-text>
    </v-card>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete this invoice? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green" text @click="deleteInvoice">Yes, Delete</v-btn>
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
      error: null,
      deleteDialog: false,
      loading: true,  // Set loading to true initially
    };
  },
  computed: {
    ...mapState("invoices", {
      invoice: (state) => state.invoiceDetail,
    }),
  },
  methods: {
    ...mapActions("invoices", ["fetchInvoiceDetail", "deleteInvoiceFromStore"]),

    async loadInvoiceDetail() {
      try {
        await this.$store.dispatch(
          "invoices/fetchInvoiceDetail",
          this.$route.params.id
        );
        this.loading = false;  // Set loading to false once data is fetched
      } catch (err) {
        console.error("Failed to load invoice details", err);
        this.error = "Error loading invoice details.";
        this.loading = false;  // Hide the loader even if there's an error
      }
    },

    async deleteInvoice() {
      try {
        await this.deleteInvoiceFromStore(this.invoice._id); // Ensure you're deleting the correct invoice
        this.$router.push("/invoice"); // Redirect after delete
      } catch (err) {
        this.error = "Error deleting invoice.";
      }
    },
    goBack() {
      this.$router.push('/invoice'); // Navigate back to the /invoice page
    },
    editInvoice() {
      // Redirecting to the edit page with the invoice ID
      this.$router.push({ path: `/addinvoice/${this.invoice._id}` });
    },

    formatAddress(address) {
      if (!address) return "N/A";
      const city = address.city.charAt(0).toUpperCase() + address.city.slice(1);
      const state =
        address.state.charAt(0).toUpperCase() + address.state.slice(1);
      return `${address.line1}\n${city}, ${state} - ${address.pincode}`;
    },
  },
  created() {
    this.loadInvoiceDetail();
  },
};
</script>

<style scoped>
.v-card {
  margin-bottom: 20px;
}
</style>
