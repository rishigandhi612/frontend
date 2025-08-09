<template>
  <v-app>
    <!-- Loading -->
    <v-row v-if="loading" align="center" justify="center" class="fill-height">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </v-row>

    <!-- Main Content -->
    <v-row v-else>
      <!-- Back Button Column -->
      <v-col cols="12" md="2" class="pt-5">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>

      <!-- Invoice Details -->
      <v-col cols="12" md="8" class="pt-5">
        <v-container>
          <v-card v-if="invoiceDetail" elevation="3" class="pa-4 rounded-xl">
            <!-- Title -->
            <v-card-title class="justify-center text-h5 font-weight-bold">
              <v-icon left color="primary">mdi-file-document</v-icon>
              Tax Invoice
            </v-card-title>
            <v-divider></v-divider>

            <!-- Invoice Info -->
            <v-row class="mt-3">
              <v-col md="8" class="text-h6 font-weight-bold">
                Invoice #{{ invoiceDetail.invoiceNumber }}
              </v-col>
              <v-col md="4" class="text-md-right">
                <v-chip color="primary" text-color="white" small>
                  {{ formatDate(invoiceDetail.createdAt) }}
                </v-chip>
              </v-col>
            </v-row>

            <!-- Customer Info -->
            <v-sheet class="pa-4 mt-4 rounded-lg" color="grey lighten-4">
              <v-row>
                <v-col sm="6">
                  <p><strong>Name:</strong> {{ invoiceDetail.customer?.name || "N/A" }}</p>
                  <p><strong>Email:</strong> {{ invoiceDetail.customer?.email_id || "N/A" }}</p>
                  <p><strong>Phone:</strong> {{ invoiceDetail.customer?.phone_no || "N/A" }}</p>
                  <p><strong>GSTIN:</strong> {{ invoiceDetail.customer?.gstin || "N/A" }}</p>
                  <p><strong>Transporter:</strong> {{ invoiceDetail.transporter?.name || "N/A" }}</p>
                </v-col>
                <v-col sm="6">
                  <p>
                    <strong>Address:</strong>
                    {{ invoiceDetail.customer?.address?.line1 || "N/A" }},
                    {{ invoiceDetail.customer?.address?.city || "N/A" }},
                    {{ invoiceDetail.customer?.address?.state || "N/A" }}
                    | <strong>Pin:</strong> {{ invoiceDetail.customer?.address?.pincode || "N/A" }}
                  </p>
                </v-col>
              </v-row>
            </v-sheet>

            <!-- Products Table -->
            <v-card class="mt-4 rounded-lg" outlined>
              <v-card-title class="text-subtitle-1 font-weight-bold">
                <v-icon left color="indigo">mdi-package-variant</v-icon>
                Goods Details
              </v-card-title>
              <v-data-table
                :headers="productHeaders"
                :items="formattedProducts"
                dense
                hide-default-footer
                class="elevation-1"
              ><template slot="item.amount" slot-scope="{ item }">
  ₹{{ item.amount }}
</template>


              </v-data-table>
            </v-card>

            <!-- Charges / Summary -->
            <v-card class="mt-4 rounded-lg" outlined>
              <v-card-title class="text-subtitle-1 font-weight-bold">
                <v-icon left color="deep-orange">mdi-cash-multiple</v-icon>
                Summary
              </v-card-title>
              <v-list dense>
                <v-list-item>
                  <v-list-item-title class="text-right">Sub Total</v-list-item-title>
                  <v-list-item-subtitle class="text-center">₹{{ invoiceDetail.totalAmount }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-right">Other Charges</v-list-item-title>
                  <v-list-item-subtitle class="text-center">₹{{ invoiceDetail.otherCharges }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="invoiceDetail.cgst > 0 || invoiceDetail.sgst > 0">
                  <v-list-item-title class="text-right">CGST</v-list-item-title>
                  <v-list-item-subtitle class="text-center">₹{{ invoiceDetail.cgst }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="invoiceDetail.cgst > 0 || invoiceDetail.sgst > 0">
                  <v-list-item-title class="text-right">SGST</v-list-item-title>
                  <v-list-item-subtitle class="text-center">₹{{ invoiceDetail.sgst }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="invoiceDetail.igst > 0">
                  <v-list-item-title class="text-right">IGST</v-list-item-title>
                  <v-list-item-subtitle class="text-center">₹{{ invoiceDetail.igst }}</v-list-item-subtitle>
                </v-list-item>
                <v-divider class="my-2"></v-divider>
                <v-list-item>
                  <v-list-item-title class="text-right font-weight-bold">Grand Total</v-list-item-title>
                  <v-list-item-title class="text-center font-weight-bold text-h6">
                    ₹{{ invoiceDetail.grandTotal }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-card>

          <!-- Empty State -->
          <v-alert v-else type="info" class="mt-4">
            Invoice details are unavailable.
          </v-alert>
        </v-container>
      </v-col>

      <!-- Action Buttons Column -->
      <v-col cols="12" md="2" class="pt-5">
        <v-sheet class="pa-3 rounded-lg elevation-2" style="position: sticky; top: 20px;">
          <v-btn color="primary" block @click="updateInvoice">
            <v-icon left>mdi-pencil</v-icon> Update
          </v-btn>
          <v-btn color="error" block class="mt-2" @click="confirmAndDeleteInvoice">
            <v-icon left>mdi-delete</v-icon> Delete
          </v-btn>
          <v-btn color="success" block class="mt-2" @click="downloadInvoicePdf">
            <v-icon left>mdi-download</v-icon> Invoice
          </v-btn>
          <v-btn color="info" block class="mt-2" @click="downloadDeliveryChallan">
            <v-icon left>mdi-truck-delivery</v-icon> Challan
          </v-btn>
          <v-btn color="lime" block class="mt-2" @click="sendemail">
            <v-icon left>mdi-mail</v-icon> Email
          </v-btn>
        </v-sheet>
      </v-col>

      <!-- Hidden Print Components -->
      <InvoicePdf :invoiceDetail="invoiceDetail" ref="invoicePdfComponent" />
      <DeliveryChallan :invoiceDetail="invoiceDetail" ref="deliveryChallanComponent" />
    </v-row>
  </v-app>
</template>

<script>
import { mapState, mapActions } from "vuex";
import InvoicePdf from "@/components/Printables/InvoicePdf.vue";
import DeliveryChallan from "@/components/Printables/DeliveryChallan.vue";

export default {
  components: { InvoicePdf, DeliveryChallan },
  data() {
    return {
      errorMessage: null,
      productHeaders: [
        { text: "Description Of Goods", value: "name" },
        { text: "HSN/SAC", value: "hsn" },
        { text: "Width", value: "width" },
        { text: "Quantity", value: "quantity" },
        { text: "Rate (₹/kg)", value: "rate" },
        { text: "Amount (₹)", value: "amount" }
      ]
    };
  },
  computed: {
    ...mapState("invoices", ["invoiceDetail", "loading"]),
    formattedProducts() {
      return (this.invoiceDetail?.products || []).map(p => ({
        name: p.product?.name || "N/A",
        hsn: p.product?.hsn_code || "N/A",
        width: `${p.width} ${p.width > 70 ? "mm" : "inches"}`,
        quantity: `${p.quantity} Kgs`,
        rate: p.unit_price,
        amount: (p.quantity * p.unit_price).toFixed(3)
      }));
    }
  },
  methods: {
    ...mapActions("invoices", ["fetchInvoiceDetail", "updateInvoiceDetail", "deleteInvoiceDetail"]),
    async loadInvoiceDetails() {
      try {
        this.$store.commit("invoices/SET_LOADING", true);
        await this.fetchInvoiceDetail(this.$route.params.id);
      } catch {
        this.errorMessage = "Failed to load invoice details.";
      } finally {
        this.$store.commit("invoices/SET_LOADING", false);
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return `${String(date.getDate()).padStart(2, "0")} ${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
    },
    updateInvoice() {
      this.$router.push(`/addinvoice/${this.invoiceDetail._id}`);
    },
    async confirmAndDeleteInvoice() {
      if (confirm("Are you sure you want to delete this invoice?")) {
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
    downloadDeliveryChallan() {
      this.$refs.deliveryChallanComponent
        ? this.$refs.deliveryChallanComponent.downloadPdf()
        : alert("Challan component not loaded");
    },
    sendemail() {
      this.$refs.sendEmailComponent
        ? this.$refs.sendEmailComponent.sendEmail()
        : alert("Email component not loaded!");
    }
  },
  watch: {
    "$route.params.id": "loadInvoiceDetails"
  },
  mounted() {
    this.loadInvoiceDetails();
  }
};
</script>

<style scoped>
.fill-height {
  min-height: 80vh;
}
</style>
