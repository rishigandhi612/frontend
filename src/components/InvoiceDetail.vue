<template>
  <v-container v-if="!isLoading" class="pa-5">
    <!-- Loader when data is loading -->
    <v-row v-if="isLoading" class="d-flex justify-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>

    <!-- Invoice Details Section -->
    <v-row v-else>
      <v-col cols="12">
        <v-card v-if="invoiceDetail">
          <v-row>
            <!-- Back Button Section -->
            <v-col cols="12" md="3" class="d-flex justify-start align-center">
              <v-btn color="grey" @click="goBack" class="ml-2">
                <v-icon left>mdi-arrow-left</v-icon> Back
              </v-btn>
            </v-col>

            <!-- Invoice Title Section -->
            <v-col cols="12" md="6" class="d-flex justify-center align-center">
              <h1>Invoice Details</h1>
            </v-col>
          </v-row>

          <!-- Invoice Header -->
          <v-card-subtitle>
            <v-row>
              <!-- Invoice Number (Left Aligned) -->
              <v-col cols="12" md="8" class="d-flex justify-start">
                <h2>Invoice #{{ invoiceDetail._id }}</h2>
              </v-col>

              <!-- Date (Right Aligned) -->
              <v-col cols="12" md="4" class="d-flex justify-end">
                <h2>Date: {{ formatDate(invoiceDetail.createdAt) }}</h2>
              </v-col>
            </v-row>
          </v-card-subtitle>

          <!-- Customer Details -->
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <p>
                  <strong>Name:</strong>
                  {{ invoiceDetail.customer?.name || "N/A" }}
                </p>
                <p>
                  <strong>Email:</strong>
                  {{ invoiceDetail.customer?.email_id || "N/A" }}
                </p>
                <p>
                  <strong>Phone No:</strong>
                  {{ invoiceDetail.customer?.phone_no || "N/A" }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <p><strong>Address:</strong></p>
                <p>{{ invoiceDetail.customer?.address?.line1 || "N/A" }}</p>
                <p>
                  {{
                    capitalizeFirstLetter(
                      invoiceDetail.customer?.address?.city || "N/A"
                    )
                  }},
                  {{
                    capitalizeFirstLetter(
                      invoiceDetail.customer?.address?.state || "N/A"
                    )
                  }}
                  |
                  <strong> Pin: </strong>
                  {{ invoiceDetail.customer?.address?.pincode || "N/A" }}
                </p>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Products Section -->
          <v-card-text>
            <h3>Received the following goods in order and condition</h3>
            <v-list>
              <v-list-item-group
                v-for="product in invoiceDetail.products"
                :key="product._id"
              >
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title
                      ><strong>Product Name:</strong>
                      {{ product.name }}</v-list-item-title
                    >
                    <v-list-item-subtitle>
                      <strong>Quantity:</strong> {{ product.quantity }} Kgs
                      <strong>Rate:</strong> ₹{{ product.unit_price }}/kg
                      <strong>Amount:</strong> ₹{{ product.quantity * product.unit_price }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                <v-divider></v-divider>
              </v-list-item-group>
            </v-list>
          </v-card-text>

          <!-- Total Amount Section -->
          <v-card-actions>
            <h3>Total Amount: ₹{{ invoiceDetail.totalAmount }}</h3>
          </v-card-actions>

          <!-- Action Buttons -->
          <v-card-actions>
            <v-btn color="primary" @click="updateInvoice" class="mr-4">
              <v-icon>mdi-pencil</v-icon> Update Invoice
            </v-btn>
          </v-card-actions>

          <!-- For Small Screen Devices: Delete Button on New Line -->
          <v-card-actions>
            <v-btn color="error" @click="deleteInvoice" class="w-100">
              <v-icon>mdi-delete</v-icon> Delete Invoice
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error Handling Section -->
    <v-row v-if="errorMessage" class="d-flex justify-center">
      <v-alert type="error" dismissible>{{ errorMessage }}</v-alert>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  data() {
    return {
      errorMessage: null,
    };
  },

  computed: {
    ...mapState("invoices", ["invoiceDetail", "isLoading"]),
  },

  methods: {
    ...mapActions("invoices", [
      "fetchInvoiceDetail",
      "updateInvoiceDetail",
      "deleteInvoiceDetail",
    ]),

    async loadInvoiceDetails() {
      try {
        const invoiceId = this.$route.params.id; // Assuming you're passing the invoice ID in the route params
        await this.fetchInvoiceDetail(invoiceId);
      } catch (error) {
        this.errorMessage = "Failed to load invoice details.";
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString(); // You can format the date as needed
    },
    capitalizeFirstLetter(string) {
      if (typeof string === "string") {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
      }
      return string;
    },
    updateInvoice() {
      this.$router.push(`/update-invoice/${this.invoiceDetail._id}`); // Navigate to update page
    },

    async deleteInvoice() {
      const confirmation = confirm(
        "Are you sure you want to delete this invoice?"
      );
      if (confirmation) {
        try {
          await this.deleteInvoiceDetail(this.invoiceDetail._id);
          this.$router.push("/invoices"); // Redirect to the invoice list page after deletion
        } catch (error) {
          this.errorMessage = "Failed to delete invoice.";
        }
      }
    },

    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
  },

  watch: {
    "$route.params.id": "loadInvoiceDetails", // Watch for route changes (if using dynamic routes for different invoices)
  },

  mounted() {
    this.loadInvoiceDetails(); // Load the invoice details on initial mount
  },
};
</script>

<style scoped>
/* Basic styling */
.loading-spinner {
  text-align: center;
  margin-top: 50px;
}

.error-message {
  color: red;
  margin-top: 20px;
}

v-row {
  margin-top: 20px;
}

h1,
h2,
h3 {
  font-family: Arial, sans-serif;
}

p {
  font-size: 14px;
}

strong {
  font-weight: bold;
}

v-card {
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

@media (max-width: 768px) {
  .v-card {
    padding: 10px;
  }

  h1,
  h2,
  h3 {
    font-size: 1.2rem;
  }

  p {
    font-size: 12px;
  }

  .v-btn {
    width: 100%;
    margin-bottom: 10px;
  }

  .v-col {
    text-align: center;
  }

  .v-btn.w-100 {
    width: 100%;
  }
}

@media (min-width: 769px) and (max-width: 960px) {
  /* For Medium Devices */
  .v-col {
    text-align: center;
  }

  .v-btn {
    width: auto;
  }

  .v-card-actions {
    display: flex;
    justify-content: space-between;
  }
}
</style>
