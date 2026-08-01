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
const MY_BUSINESS_ADDR1 = "1281 SHOP No 5 SADASHIV PETH";
const MY_BUSINESS_ADDR2 = "VERTEX ARCADE";
const MY_BUSINESS_PLACE = "PUNE";
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

      // ----------------------------
      // Validate Customer GSTIN
      // ----------------------------
      const customerGstin = (inv.customer?.gstin || "").trim().toUpperCase();

      if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(customerGstin)
      ) {
        alert("Invalid Customer GSTIN");
        return;
      }

      if (!inv.customer?.address?.pincode) {
        alert("Customer pincode missing.");
        return;
      }

      if (!inv.invoiceNumber) {
        alert("Invoice number missing.");
        return;
      }

      if (!inv.products?.length) {
        alert("Invoice has no products.");
        return;
      }

      const distanceInput = prompt(
        "Enter approximate transport distance (KM)",
        "8",
      );

      if (distanceInput === null) return;

      const transDistance = Number(distanceInput);

      if (!Number.isInteger(transDistance) || transDistance <= 0) {
        alert("Please enter a valid transport distance.");
        return;
      }

      // ----------------------------
      // Group Products by HSN
      // ----------------------------
      const hsnGroups = {};

      for (const p of inv.products) {
        const hsn = String(p.product?.hsn_code || "").trim();

        if (!/^\d{4,8}$/.test(hsn)) {
          alert(`Invalid HSN for ${p.product?.name || "Product"}`);
          return;
        }

        const qty = Number(p.quantity || 0);
        const rate = Number(p.unit_price || 0);
        const taxable = qty * rate;

        const gstRate = Number(p.product?.gst_rate || 18);

        if (!hsnGroups[hsn]) {
          hsnGroups[hsn] = {
            hsnCode: hsn,

            productName: (p.product?.name || "ITEM").trim().replace(/\.$/, ""),

            productDesc: (
              p.product?.description ||
              p.product?.name ||
              "ITEM"
            ).trim(),

            quantity: 0,

            qtyUnit: (p.product?.unit || "KGS").toUpperCase(),

            taxableAmount: 0,

            gstRate,
          };
        }

        hsnGroups[hsn].quantity += qty;
        hsnGroups[hsn].taxableAmount += taxable;
      }

      const isInterState = Number(inv.igst || 0) > 0;

      const itemList = Object.values(hsnGroups).map((item, index) => ({
        itemNo: index + 1,

        productName: item.productName,

        productDesc: item.productDesc,

        hsnCode: item.hsnCode,

        quantity: Number(item.quantity.toFixed(3)),

        qtyUnit: item.qtyUnit,

        taxableAmount: Number(item.taxableAmount.toFixed(2)),

        cgstRate: isInterState ? 0 : item.gstRate / 2,

        sgstRate: isInterState ? 0 : item.gstRate / 2,

        igstRate: isInterState ? item.gstRate : 0,

        cessRate: 0,

        cessNonAdvol: 0,
      }));

      // ----------------------------
      // Main HSN
      // ----------------------------
      const mainHsnCode =
        Object.values(hsnGroups).sort(
          (a, b) => b.taxableAmount - a.taxableAmount,
        )[0]?.hsnCode || "";

      // ----------------------------
      // Transport Details
      // ----------------------------
      const transporterGstin = (inv.transporter?.gstNumber || "")
        .trim()
        .toUpperCase();

      const isByHand = transporterGstin === "";

      const transportFields = isByHand
        ? {
            transporterId: "",
            transporterName: "",
            vehicleNo: BY_HAND_VEHICLE_NO,
            vehicleType: "R",
          }
        : {
            transporterId: transporterGstin,
            transporterName: (inv.transporter?.name || "").trim(),
            vehicleNo: "",
            vehicleType: "R",
          };

      const fromStateCode = gstinToStateCode(MY_BUSINESS_GSTIN);
      const toStateCode = gstinToStateCode(customerGstin);

      const taxableValue = Number(inv.totalAmount || 0);

      const cgst = Number(inv.cgst || 0);
      const sgst = Number(inv.sgst || 0);
      const igst = Number(inv.igst || 0);
      const otherCharges = Number(inv.otherCharges || 0);

      const totInvValue = Number(
        (taxableValue + cgst + sgst + igst + otherCharges).toFixed(2),
      );

      // ----------------------------
      // Build Bill
      // ----------------------------
      const bill = {
        userGstin: MY_BUSINESS_GSTIN,

        supplyType: "O",
        subSupplyType: 1,
        subSupplyDesc: "",

        docType: "INV",
        docNo: String(inv.invoiceNumber).trim(),
        docDate: this.formatDateForEwb(inv.createdAt),

        transType: 1,

        // ----------------------------
        // From Details
        // ----------------------------
        fromGstin: MY_BUSINESS_GSTIN,
        fromTrdName: MY_BUSINESS_NAME,
        fromAddr1: MY_BUSINESS_ADDR1,
        fromAddr2: MY_BUSINESS_ADDR2 || "",
        fromPlace: MY_BUSINESS_PLACE,
        fromPincode: Number(MY_BUSINESS_PINCODE),
        fromStateCode: fromStateCode,
        actualFromStateCode: fromStateCode,

        // ----------------------------
        // To Details
        // ----------------------------
        toGstin: customerGstin,
        toTrdName: (inv.customer.name || "").trim(),
        toAddr1: (inv.customer.address?.line1 || "").trim(),
        toAddr2: (inv.customer.address?.line2 || "").trim(),
        toPlace: (inv.customer.address?.city || "").trim(),
        toPincode: Number(inv.customer.address.pincode),
        toStateCode: toStateCode,
        actualToStateCode: toStateCode,

        // ----------------------------
        // Invoice Values
        // ----------------------------
        totalValue: Number(taxableValue.toFixed(2)),
        cgstValue: Number(cgst.toFixed(2)),
        sgstValue: Number(sgst.toFixed(2)),
        igstValue: Number(igst.toFixed(2)),
        cessValue: 0,
        TotNonAdvolVal: 0,
        OthValue: Number(otherCharges.toFixed(2)),
        totInvValue: totInvValue,

        // ----------------------------
        // Transport
        // ----------------------------
        transMode: 1,
        transDistance: transDistance,

        transporterId: transportFields.transporterId,
        transporterName: transportFields.transporterName,

        vehicleNo: transportFields.vehicleNo || "",
        vehicleType: transportFields.vehicleType || "R",

        transDocNo: "",
        transDocDate: "",

        // ----------------------------
        // HSN
        // ----------------------------
        mainHsnCode: mainHsnCode,

        // ----------------------------
        // Items
        // ----------------------------
        itemList: itemList,
      };

      // ----------------------------
      // Payload
      // ----------------------------
      const payload = {
        version: "1.0.0421",
        billLists: [bill],
      };

      console.log("EWB Payload", payload);

      // ----------------------------
      // Download JSON
      // ----------------------------
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      const safeDocNo = String(inv.invoiceNumber).replace(/[^A-Za-z0-9]/g, "");

      a.href = url;
      a.download = `ewaybill_${safeDocNo}.json`;

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      this.$toast?.success?.("E-Way Bill JSON generated successfully.");
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
