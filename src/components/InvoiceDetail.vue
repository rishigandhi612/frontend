<template>
  <v-container v-if="!isLoading" class="pt-5">
    <!-- Loader when data is loading -->
    <v-row v-if="isLoading" class="d-flex justify-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>

    <!-- Invoice Details Section -->
    <v-row v-else>
      <v-col cols="12">
        <v-card v-if="invoiceDetail">
          <!-- Invoice Header -->
          <v-row>
            <!-- Back Button Section -->
            <v-col
              cols="12"
              md="2"
              sm="12"
              class="d-flex justify-start align-center"
            >
              <v-btn @click="goBack" class="ml-2">
                <v-icon left>mdi-arrow-left</v-icon> Back
              </v-btn>
            </v-col>

            <!-- Action Buttons Section (Update & Delete) -->
            <v-col
              cols="12"
              md="10"
              sm="12"
              class="d-flex justify-center align-center"
            >
              <v-row>
                <!-- Update Button -->
                <v-col cols="12" md="3" sm="12" class="d-flex justify-center">
                  <v-btn color="primary" @click="updateInvoice" class="w-100">
                    <v-icon>mdi-pencil</v-icon> Update Invoice
                  </v-btn>
                </v-col>

                <!-- Delete Button -->
                <v-col cols="12" md="3" sm="12" class="d-flex justify-center">
                  <v-btn
                    color="error"
                    @click="confirmAndDeleteInvoice"
                    class="w-100"
                  >
                    <v-icon>mdi-delete</v-icon> Delete Invoice
                  </v-btn>
                </v-col>
                <v-col cols="12" md="3" sm="12" class="d-flex justify-center">
                  <v-btn @click="downloadInvoicePdf" color="success">
                    <v-icon>mdi-download</v-icon> Download Invoice
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>

            <!-- InvoicePdf Component -->
            <InvoicePdf
              :invoiceDetail="invoiceDetail"
              ref="invoicePdfComponent"
            />
          </v-row>
          <v-divider class="mt-2"></v-divider>
          <!-- Invoice Title Section -->
          <v-row>
            <v-col
              cols="12"
              md="12"
              sm="12"
              class="d-flex justify-center align-center"
            >
              <h2>Tax Invoice</h2>
            </v-col>
          </v-row>

          <!-- Invoice Header -->
          <v-card-subtitle>
            <v-row>
              <v-col cols="12" md="8" class="d-flex justify-start">
                <h2>Invoice #{{ invoiceDetail._id }}</h2>
              </v-col>

              <v-col cols="12" md="4" class="d-flex justify-end">
                <h3>Date: {{ formatDate(invoiceDetail.createdAt) }}</h3>
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
                <p>
                  <strong>GSTIN:</strong>
                  {{ invoiceDetail.customer?.gstin || "N/A" }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <p>
                  <strong>Address:</strong
                  >{{ invoiceDetail.customer?.address?.line1 || "N/A" }}
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
                  | <strong>Pin: </strong
                  >{{ invoiceDetail.customer?.address?.pincode || "N/A" }}
                </p>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Products Section (Tabular Format) -->
          <v-card-text>
            <h3  class="text-subtitle-1 text-center">Received the following goods in order and condition:</h3>
            <v-simple-table>
              <thead>
                <tr>
                  <th class="text-left">Description Of Goods</th>
                  <th class="text-left">HSN/SAC</th>
                  <th class="text-left">Width</th>
                  <th class="text-left">Quantity (kg)</th>
                  <th class="text-left">Rate (₹/kg)</th>
                  <th class="text-left">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in invoiceDetail.products"
                  :key="product._id"
                >
                  <td>{{ product.name }}</td>
                  <td>{{ product.product.hsn_code || 'N/A' }}</td> <!-- Access hsn_code under product -->
                  <td>
                    {{ product.width }}
                    {{ product.width > 70 ? "mm" : "inches" }}
                  </td>
                  <td>{{ product.quantity }}</td>
                  <td>₹{{ product.unit_price }}</td>
                  <td>₹{{ product.quantity * product.unit_price }}</td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-card-text>

          <!-- Additional Charges Section (GST, Other Charges, Total) -->
          <v-card-text>
            <v-simple-table>
              <thead>
                <tr>
                  <!-- <th class="text-right">Description</th>
                  <th class="text-left">Amount (₹)</th> -->
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-right">Sub Total</td>
                  <td class="text-center">₹{{ invoiceDetail.totalAmount }}</td>
                </tr>
                <tr>
                  <td class="text-right">CGST</td>
                  <td class="text-center">₹{{ invoiceDetail.cgst }}</td>
                </tr>
                <tr>
                  <td class="text-right">SGST</td>
                  <td class="text-center">₹{{ invoiceDetail.sgst }}</td>
                </tr>
                <tr>
                  <td class="text-right">Other Charges</td>
                  <td class="text-center">₹{{ invoiceDetail.otherCharges }}</td>
                </tr>
                <tr>
                  <td class="text-right"><strong>Grand Total</strong></td>
                  <td class="text-center">
                    <strong style="font-size: 1.2em; color: black">
                      ₹{{ invoiceDetail.grandTotal }}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-card-text>
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
import InvoicePdf from "@/components/InvoicePdf.vue"; // Import the new InvoicePdf component

export default {
  data() {
    return {
      errorMessage: null,
    };
  },
  components: {
    InvoicePdf,
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
      const day = String(date.getDate()).padStart(2, "0"); // Pad single digit day with a leading zero
      const month = date.toLocaleString("default", { month: "short" }); // Get the 3-letter month abbreviation (e.g., "Nov")
      const year = date.getFullYear(); // Get the full year
      return `${day} ${month} ${year}`; // Return formatted date as dd-MMM-yyyy
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
    async confirmAndDeleteInvoice() {
      const confirmation = confirm(
        "Are you sure you want to delete this invoice?"
      );
      if (confirmation) {
        try {
          await this.deleteInvoiceDetail(this.invoiceDetail._id); // Local method
          this.$router.push("/invoice");
        } catch (error) {
          this.errorMessage = error?.message || "Failed to delete invoice.";
        }
      }
    },
    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
    // New method to download the invoice PDF
    downloadInvoicePdf() {
      this.$refs.invoicePdfComponent.downloadPdf();
    },
  },

  watch: {
    "$route.params.id": "loadInvoiceDetails", // Watch for route changes (if using dynamic routes for different invoices)
  },

  mounted() {
    this.loadInvoiceDetails(); // Load the invoice details on initial mount
    console.log(this.invoiceDetail.products); // Check if the data is loaded correctly
    // console.log(this.invoiceDetail.products); // Check the products array
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
</style>
