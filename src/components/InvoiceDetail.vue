<template>
  <v-app>
    <v-row v-if="loading">
      <v-col class="d-flex justify-center align-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <v-row v-if="!loading">
      <!-- Left Column (Back Button) -->
      <v-col cols="12" md="2" class="d-flex justify-start align-start pt-5">
        <v-row class="d-flex justify-space-between align-center">
          <v-col>
            <v-btn @click="goBack" class="ml-2" block>
              <v-icon left>mdi-arrow-left</v-icon> Back
            </v-btn>
          </v-col>
        </v-row>
      </v-col>

      <!-- Main Content -->
      <v-col cols="12" md="8">
        <v-container class="pt-5">
          <v-row v-if="invoiceDetail">
            <v-col cols="12">
              <v-card>
                <!-- Invoice Header -->
                <v-row>
                  <v-col cols="12" class="d-flex justify-center align-center">
                    <h2>Tax Invoice</h2>
                  </v-col>
                </v-row>
                <v-divider class="mt-2"></v-divider>

                <!-- Invoice Title Section -->
                <v-card-subtitle>
                  <v-row>
                    <v-col cols="12" md="8" class="d-flex justify-start">
                      <h2>Invoice #{{ invoiceDetail?.invoiceNumber }}</h2>
                    </v-col>
                    <v-col cols="12" md="4" class="d-flex justify-end">
                      <h3>Date: {{ formatDate(invoiceDetail?.createdAt) }}</h3>
                    </v-col>
                  </v-row>
                </v-card-subtitle>

                <!-- Customer Details -->
                <v-card-text>
                  <v-row>
                    <v-col cols="12" sm="6">
                      <p><strong>Name:</strong> {{ invoiceDetail.customer?.name || "N/A" }}</p>
                      <p><strong>Email:</strong> {{ invoiceDetail.customer?.email_id || "N/A" }}</p>
                      <p><strong>Phone No:</strong> {{ invoiceDetail.customer?.phone_no || "N/A" }}</p>
                      <p><strong>GSTIN:</strong> {{ invoiceDetail.customer?.gstin || "N/A" }}</p>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <p>
                        <strong>Address:</strong>
                        {{ invoiceDetail.customer?.address?.line1 || "N/A" }},
                        {{ invoiceDetail.customer?.address?.city || "N/A"}},
                        {{ invoiceDetail.customer?.address?.state || "N/A" }}
                        | <strong>Pin:</strong> {{ invoiceDetail.customer?.address?.pincode || "N/A" }}
                      </p>
                    </v-col>
                  </v-row>
                </v-card-text>

                <!-- Products Section -->
                <v-card-text>
                  <h3 class="text-subtitle-1 text-center">
                    Received the following goods in order and condition:
                  </h3>
                  <v-simple-table v-if="invoiceDetail.products?.length">
                    <thead>
                      <tr>
                        <th>Description Of Goods</th>
                        <th>HSN/SAC</th>
                        <th>Width</th>
                        <th>Quantity</th>
                        <th>Rate (₹/kg)</th>
                        <th>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(product, index) in invoiceDetail.products" :key="index">
                        <td>{{ product.product?.name }}</td>
                        <td>{{ product.product?.hsn_code || "N/A" }}</td>
                        <td>{{ product.width }} {{ product.width > 70 ? "mm" : "inches" }}</td>
                        <td>{{ product.quantity }} Kgs</td>
                        <td>₹{{ product.product?.price }}</td>
                        <td>₹{{ product.quantity * product.product?.price }}</td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                  <v-alert v-else type="warning">No products found in this invoice.</v-alert>
                </v-card-text>

                <!-- Charges Section -->
                <v-card-text>
                  <v-simple-table>
                    <tbody>
                      <tr>
                        <td class="text-right">Sub Total</td>
                        <td class="text-center">₹{{ invoiceDetail.totalAmount }}</td>
                      </tr>
                      <tr>
                        <td class="text-right">Other Charges</td>
                        <td class="text-center">₹{{ invoiceDetail.otherCharges }}</td>
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
                        <td class="text-right"><strong>Grand Total</strong></td>
                        <td class="text-center"><strong style="font-size: 1.2em;">₹{{ invoiceDetail.grandTotal }}</strong></td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-row v-if="!invoiceDetail" class="d-flex justify-center">
            <v-alert type="info">Invoice details are unavailable.</v-alert>
          </v-row>
        </v-container>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" md="2" sm="12" class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-btn color="primary" @click="updateInvoice" block>
              <v-icon left>mdi-pencil</v-icon> Update Invoice
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-btn color="error" @click="confirmAndDeleteInvoice" block>
              <v-icon left>mdi-delete</v-icon> Delete Invoice
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-btn color="success" @click="downloadInvoicePdf" block>
              <v-icon left>mdi-download</v-icon> Download Invoice
            </v-btn>
          </v-col>
        </v-row>
      </v-col>

      <InvoicePdf :invoiceDetail="invoiceDetail" ref="invoicePdfComponent" />
    </v-row>
  </v-app>
</template>

<script>
import { mapState, mapActions } from "vuex";
import InvoicePdf from "@/components/InvoicePdf.vue";

export default {
  components: {
    InvoicePdf,
  },
  data() {
    return {
      errorMessage: null, // To store error messages
    };
  },
  computed: {
    ...mapState("invoices", ["invoiceDetail", "loading"]),
  },
  methods: {
    ...mapActions("invoices", ["fetchInvoiceDetail", "updateInvoiceDetail", "deleteInvoiceDetail"]),

    async loadInvoiceDetails() {
      try {
        this.$store.commit("invoices/SET_LOADING", true); // Set loading to true
        const invoiceId = this.$route.params.id;
        await this.fetchInvoiceDetail(invoiceId);
      } catch (error) {
        this.errorMessage = "Failed to load invoice details.";
      } finally {
        this.$store.commit("invoices/SET_LOADING", false); // Always set loading to false
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },

    updateInvoice() {
      this.$router.push(`/addinvoice/${this.invoiceDetail._id}`);
    },

    async confirmAndDeleteInvoice() {
      const confirmation = confirm("Are you sure you want to delete this invoice?");
      if (confirmation) {
        try {
          await this.deleteInvoiceDetail(this.invoiceDetail._id);
          this.$router.push("/invoice");
        } catch (error) {
          this.errorMessage = error?.message || "Failed to delete invoice.";
        }
      }
    },

    goBack() {
      this.$router.go(-1);
    },

    downloadInvoicePdf() {
      this.$refs.invoicePdfComponent.downloadPdf();
    },
  },

  watch: {
    "$route.params.id": "loadInvoiceDetails",
  },

  mounted() {
    this.loadInvoiceDetails();
  },
};
</script>

<style scoped>


.error-message {
  color: red;
  margin-top: 20px;
}
</style>
