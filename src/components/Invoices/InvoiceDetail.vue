<template>
  <v-app>
    <!-- Loading -->
    <v-row v-if="loading" align="center" justify="center" class="fill-height">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      ></v-progress-circular>
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
              <v-col md="4" class="text-h6 font-weight-bold">
                Invoice No.:{{ invoiceDetail.invoiceNumber }}
              </v-col>
              <v-col
                md="4"
                class="text-h6 font-weight-bold"
                v-if="invoiceDetail.ewbNo"
              >
                E-Way Bill No.:{{ invoiceDetail.ewbNo || "N/A" }}
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
                  <p>
                    <strong>Name:</strong>
                    {{ invoiceDetail.customer?.name || "N/A" }}
                  </p>
                  <p>
                    <strong>Email:</strong>
                    {{ invoiceDetail.customer?.email_id || "N/A" }}
                  </p>
                  <p>
                    <strong>Phone:</strong>
                    {{ invoiceDetail.customer?.phone_no || "N/A" }}
                  </p>
                  <p>
                    <strong>GSTIN:</strong>
                    {{ invoiceDetail.customer?.gstin || "N/A" }}
                  </p>
                  <p>
                    <strong>Transporter:</strong>
                    {{ invoiceDetail.transporter?.name || "N/A" }} (GSTIN-{{
                      invoiceDetail.transporter?.gstNumber || "N/A"
                    }})
                  </p>
                </v-col>
                <v-col sm="6">
                  <p>
                    <strong>Address:</strong>
                    {{ invoiceDetail.customer?.address?.line1 || "N/A" }},
                    {{ invoiceDetail.customer?.address?.city || "N/A" }},
                    {{ invoiceDetail.customer?.address?.state || "N/A" }}
                    | <strong>Pin:</strong>
                    {{ invoiceDetail.customer?.address?.pincode || "N/A" }}
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
                  <v-list-item-title class="text-right"
                    >Sub Total</v-list-item-title
                  >
                  <v-list-item-subtitle class="text-center"
                    >₹{{ invoiceDetail.totalAmount }}</v-list-item-subtitle
                  >
                </v-list-item>
                <v-list-item v-if="invoiceDetail.otherCharges > 0">
                  <v-list-item-title class="text-right"
                    >Other Charges</v-list-item-title
                  >
                  <v-list-item-subtitle class="text-center"
                    >₹{{ invoiceDetail.otherCharges }}</v-list-item-subtitle
                  >
                </v-list-item>
                <v-list-item v-if="invoiceDetail.discountAllowed > 0">
                  <v-list-item-title class="text-right"
                    >Discount Allowed</v-list-item-title
                  >
                  <v-list-item-subtitle class="text-center"
                    >₹{{ invoiceDetail.discountAllowed }}</v-list-item-subtitle
                  >
                </v-list-item>
                <v-list-item
                  v-if="invoiceDetail.cgst > 0 || invoiceDetail.sgst > 0"
                >
                  <v-list-item-title class="text-right">CGST</v-list-item-title>
                  <v-list-item-subtitle class="text-center"
                    >₹{{ invoiceDetail.cgst }}</v-list-item-subtitle
                  >
                </v-list-item>
                <v-list-item
                  v-if="invoiceDetail.cgst > 0 || invoiceDetail.sgst > 0"
                >
                  <v-list-item-title class="text-right">SGST</v-list-item-title>
                  <v-list-item-subtitle class="text-center"
                    >₹{{ invoiceDetail.sgst }}</v-list-item-subtitle
                  >
                </v-list-item>
                <v-list-item v-if="invoiceDetail.igst > 0">
                  <v-list-item-title class="text-right">IGST</v-list-item-title>
                  <v-list-item-subtitle class="text-center"
                    >₹{{ invoiceDetail.igst }}</v-list-item-subtitle
                  >
                </v-list-item>
                <v-divider class="my-2"></v-divider>
                <v-list-item>
                  <v-list-item-title class="text-right font-weight-bold"
                    >Grand Total</v-list-item-title
                  >
                  <v-list-item-title
                    class="text-center font-weight-bold text-h6"
                  >
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
        <v-sheet
          class="pa-3 rounded-lg elevation-2"
          style="position: sticky; top: 20px"
        >
          <v-btn color="primary" block @click="updateInvoice">
            <v-icon left>mdi-pencil</v-icon> Update
          </v-btn>
          <v-btn
            color="error"
            block
            class="mt-2"
            @click="confirmAndDeleteInvoice"
          >
            <v-icon left>mdi-delete</v-icon> Delete
          </v-btn>
          <v-btn
            color="success"
            block
            class="mt-2"
            @click="downloadInvoicePdf"
            v-if="canDownloadInvoice()"
          >
            <v-icon left>mdi-download</v-icon> Invoice
          </v-btn>
          <v-btn
            color="info"
            block
            class="mt-2"
            @click="downloadDeliveryChallan"
          >
            <v-icon left>mdi-truck-delivery</v-icon> Challan
          </v-btn>
          <v-btn color="lime" block class="mt-2" @click="sendemail">
            <v-icon left>mdi-mail</v-icon> Email
          </v-btn>
          <v-btn
            color="deep-purple"
            dark
            block
            class="mt-2"
            @click="generateEwayBillJson"
          >
            <v-icon left>mdi-file-export</v-icon> E-Way Bill JSON
          </v-btn>

          <!-- POD Manager Component -->
          <PodManager
            v-if="invoiceDetail"
            :invoiceId="invoiceDetail._id"
            :invoiceDetail="invoiceDetail"
          />
        </v-sheet>
      </v-col>

      <!-- Hidden Print Components -->
      <InvoicePdf :invoiceDetail="invoiceDetail" ref="invoicePdfComponent" />
      <DeliveryChallan
        :invoiceDetail="invoiceDetail"
        ref="deliveryChallanComponent"
      />
      <!-- Only render email sender when invoiceDetail is available -->
      <InvoiceEmailSender
        v-if="invoiceDetail"
        :invoiceDetail="invoiceDetail"
        ref="emailSenderComponent"
      />
    </v-row>
  </v-app>
</template>

<script>
import { mapState, mapActions } from "vuex";
import InvoicePdf from "@/components/Printables/InvoicePdf.vue";
import DeliveryChallan from "@/components/Printables/DeliveryChallan.vue";
import InvoiceEmailSender from "@/components/InvoiceEmailSender.vue";
import PodManager from "@/components/Invoices/PodManager.vue";

// ---- E-Way Bill JSON generation constants ----
// TODO: move to a shared config/env file if this seller info is used elsewhere
const MY_BUSINESS_GSTIN = "27AAVPG7824M1ZX"; // Hemant Traders - fixed seller GSTIN
const MY_BUSINESS_NAME = "Hemant Traders";
const MY_BUSINESS_ADDR1 = "Shop 5";
const MY_BUSINESS_ADDR2 = "Vertex Arcade Sadashiv Peth";
const MY_BUSINESS_PLACE = "Pune";
const MY_BUSINESS_PINCODE = 411030;
const BY_HAND_VEHICLE_NO = "MH12NW0855"; // default vehicle for self-transport ("By Hand")

function gstinToStateCode(gstin) {
  // First 2 digits of any GSTIN are the state code
  return parseInt(gstin.substring(0, 2), 10);
}

export default {
  components: {
    InvoicePdf,
    DeliveryChallan,
    InvoiceEmailSender,
    PodManager,
  },
  data() {
    return {
      errorMessage: null,
      productHeaders: [
        { text: "Description Of Goods", value: "name" },
        { text: "HSN/SAC", value: "hsn" },
        { text: "Width", value: "width" },
        { text: "Quantity", value: "quantity" },
        { text: "Rate (₹/kg)", value: "rate" },
        { text: "Amount (₹)", value: "amount" },
      ],
    };
  },
  computed: {
    ...mapState("invoices", ["invoiceDetail", "loading"]),
    formattedProducts() {
      return (this.invoiceDetail?.products || []).map((p) => ({
        name: p.product?.name || "N/A",
        hsn: p.product?.hsn_code || "N/A",
        width: `${p.width} ${p.width > 70 ? "mm" : "inches"}`,
        quantity: `${p.quantity} Kgs`,
        rate: p.unit_price,
        amount: (p.quantity * p.unit_price).toFixed(3),
      }));
    },
  },
  methods: {
    ...mapActions("invoices", [
      "fetchInvoiceDetail",
      "updateInvoiceDetail",
      "deleteInvoiceDetail",
    ]),
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
      return `${String(date.getDate()).padStart(2, "0")} ${date.toLocaleString(
        "default",
        { month: "short" },
      )} ${date.getFullYear()}`;
    },
    // Converts createdAt (ISO string) directly to DD/MM/YYYY as required by the EWB schema
    formatDateForEwb(dateString) {
      const date = new Date(dateString);
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
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
    canDownloadInvoice() {
      if (this.invoiceDetail.grandTotal <= 0) {
        alert(
          "Invoice grand total is zero or negative. Cannot download invoice.",
        );
        return false;
      } else if (
        this.invoiceDetail.grandTotal > 100000 &&
        this.invoiceDetail.ewbNo === null
      ) {
        alert("Enter Eway Bill No First");
        return false;
      }
      // Only allow download if invoiceDetail is loaded and has a valid invoiceNumber
      return this.invoiceDetail && this.invoiceDetail.invoiceNumber;
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
      if (this.$refs.emailSenderComponent) {
        this.$refs.emailSenderComponent.openDialog();
      } else {
        alert("Email component not loaded!");
      }
    },

    // ---- E-Way Bill bulk-upload JSON generator ----
    generateEwayBillJson() {
      const inv = this.invoiceDetail;
      if (!inv) {
        alert("Invoice not loaded.");
        return;
      }
      if (!inv.customer?.gstin) {
        alert("Customer GSTIN is missing - cannot generate E-Way Bill JSON.");
        return;
      }

      // Distance isn't stored on the invoice yet, so ask for it here.
      const distanceInput = prompt(
        "Enter approximate transport distance (in km):",
        "8",
      );
      if (distanceInput === null) return; // user cancelled
      const transDistance = parseInt(distanceInput, 10);
      if (isNaN(transDistance) || transDistance <= 0) {
        alert("Please enter a valid distance in km.");
        return;
      }

      // 1. Club products by HSN code, summing taxable value per group.
      //    Width/rate/quantity are ignored for clubbing purposes - only
      //    taxable value (quantity * unit_price) matters for the EWB.
      const hsnGroups = {};
      (inv.products || []).forEach((p) => {
        const hsn = String(p.product?.hsn_code || "").trim();
        const taxable = (p.quantity || 0) * (p.unit_price || 0);
        if (!hsnGroups[hsn]) {
          hsnGroups[hsn] = {
            hsnCode: hsn,
            productName: (p.product?.name || "ITEM").replace(/\.$/, "").trim(),
            productDesc: p.product?.desc || (p.product?.name || "ITEM").trim(),
            taxableAmount: 0,
          };
        }
        hsnGroups[hsn].taxableAmount += taxable;
      });

      // GST is always a flat 18% (9% CGST + 9% SGST intra-state, 18% IGST inter-state)
      const isInterState = (inv.igst || 0) > 0;
      const cgstRatePct = isInterState ? 0 : 9;
      const sgstRatePct = isInterState ? 0 : 9;
      const igstRatePct = isInterState ? 18 : 0;

      const itemList = Object.values(hsnGroups).map((item, idx) => ({
        itemNo: idx + 1,
        productName: item.productName,
        productDesc: item.productDesc,
        hsnCode: item.hsnCode,
        taxableAmount: +item.taxableAmount.toFixed(2),
        sgstRate: sgstRatePct,
        cgstRate: cgstRatePct,
        igstRate: igstRatePct,
        cessRate: 0,
        cessNonAdvol: 0,
      }));

      // 2. Transport details: "By Hand" (no transporter GSTIN) uses your
      //    vehicle number directly; otherwise pass the transporter's GSTIN.
      const transporterGstin = inv.transporter?.gstNumber?.trim();
      const isByHand = !transporterGstin;

      const transportFields = isByHand
        ? {
            transporterId: "",
            transporterName: "",
            vehicleNo: BY_HAND_VEHICLE_NO,
            vehicleType: "R",
          }
        : {
            transporterId: transporterGstin,
            transporterName: inv.transporter?.name || "",
            vehicleNo: "",
            vehicleType: "",
          };

      // 3. State codes derived from GSTIN (first 2 digits)
      const fromStateCode = gstinToStateCode(MY_BUSINESS_GSTIN);
      const toStateCode = gstinToStateCode(inv.customer.gstin);

      // 4. Assemble bulk-upload JSON per NIC schema
      const bill = {
        userGstin: MY_BUSINESS_GSTIN,
        supplyType: "O",
        subSupplyType: 1,
        subSupplyDesc: "",
        docType: "INV",
        docNo: inv.invoiceNumber,
        docDate: this.formatDateForEwb(inv.createdAt),
        transType: 1,
        fromGstin: MY_BUSINESS_GSTIN,
        fromTrdName: MY_BUSINESS_NAME,
        fromAddr1: MY_BUSINESS_ADDR1,
        fromAddr2: MY_BUSINESS_ADDR2,
        fromPlace: MY_BUSINESS_PLACE,
        actualFromStateCode: fromStateCode,
        fromPincode: MY_BUSINESS_PINCODE,
        fromStateCode: fromStateCode,
        toGstin: inv.customer.gstin,
        toTrdName: inv.customer?.name || "",
        toAddr1: inv.customer?.address?.line1 || "",
        toAddr2: "",
        toPlace: inv.customer?.address?.city || "",
        toPincode: inv.customer?.address?.pincode || 0,
        actualToStateCode: toStateCode,
        toStateCode: toStateCode,
        totalValue: inv.totalAmount || 0,
        cgstValue: inv.cgst || 0,
        sgstValue: inv.sgst || 0,
        igstValue: inv.igst || 0,
        cessValue: 0,
        TotNonAdvolVal: 0,
        OthValue: inv.otherCharges || 0,
        totInvValue: inv.grandTotal || 0,
        transMode: 1,
        transDistance: transDistance,
        ...transportFields,
        transDocNo: "",
        transDocDate: "",
        mainHsnCode: itemList[0]?.hsnCode || "",
        itemList: itemList,
      };

      const payload = {
        version: "1.0.0421",
        billLists: [bill],
      };

      // 5. Trigger browser download.
      //    Filename kept purely alphanumeric - the NIC tool rejects names
      //    with underscores/hyphens/spaces.
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeDocNo = inv.invoiceNumber.replace(/[^a-zA-Z0-9]/g, "");
      a.href = url;
      a.download = `ewaybill${safeDocNo}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
.fill-height {
  min-height: 80vh;
}
</style>
