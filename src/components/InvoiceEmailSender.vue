<template>
  <div>
    <!-- PDF Generator Components (hidden) -->
    <InvoicePdfGenerator
      ref="invoicePdfGenerator"
      :invoiceDetail="invoiceDetail"
      style="display: none"
    />
    <DeliveryChallanGenerator
      ref="challanPdfGenerator"
      :invoiceDetail="invoiceDetail"
      style="display: none"
    />

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h5 primary white--text">
          <v-icon left color="white">mdi-email-send</v-icon>
          Send Invoice via Email
        </v-card-title>

        <v-card-text class="pt-4">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  v-model="includeChallan"
                  label="Include Delivery Challan"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="emailAddress"
                  label="Customer Email Address"
                  prepend-icon="mdi-email"
                  :rules="emailRules"
                  :error-messages="emailError"
                  outlined
                  dense
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="subject"
                  label="Email Subject"
                  prepend-icon="mdi-format-title"
                  outlined
                  dense
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="emailBody"
                  label="Email Message (optional)"
                  prepend-icon="mdi-message-text"
                  outlined
                  rows="4"
                  dense
                ></v-textarea>
              </v-col>

              <!-- Show loading progress -->
              <v-col cols="12" v-if="isEmailSending || generating">
                <v-progress-linear
                  indeterminate
                  color="primary"
                  class="mb-2"
                ></v-progress-linear>
                <p class="text-center mb-0">{{ progressMessage }}</p>
              </v-col>

              <!-- Show success/error messages -->
              <v-col cols="12" v-if="successMessage">
                <v-alert type="success" dense>
                  {{ successMessage }}
                </v-alert>
              </v-col>

              <v-col cols="12" v-if="errorMessage">
                <v-alert type="error" dense>
                  {{ errorMessage }}
                </v-alert>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey darken-1"
            text
            @click="closeDialog"
            :disabled="isEmailSending || generating"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="sendEmail"
            :loading="isEmailSending || generating"
            :disabled="!isValidEmail || isEmailSending || generating"
          >
            <v-icon left>mdi-send</v-icon>
            Send Email
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import InvoicePdfGenerator from "./Printables/InvoicePdf.vue";
import DeliveryChallanGenerator from "./Printables/DeliveryChallan.vue";

export default {
  name: "InvoiceEmailSender",
  components: {
    InvoicePdfGenerator,
    DeliveryChallanGenerator,
  },
  props: {
    invoiceDetail: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      dialog: false,
      emailAddress: "",
      subject: "",
      emailBody: "",
      includeChallan: true,
      generating: false,
      progressMessage: "",
      successMessage: "",
      errorMessage: "",
      emailRules: [
        (v) => !!v || "Email is required",
        (v) => /.+@.+\..+/.test(v) || "Email must be valid",
      ],
      emailError: "",
    };
  },

  computed: {
    isValidEmail() {
      return this.emailAddress && /.+@.+\..+/.test(this.emailAddress);
    },
    ...mapState("invoices", ["loadingState"]),
    isEmailSending() {
      return this.loadingState.sendEmail;
    },
  },

  methods: {
    ...mapActions("invoices", ["sendInvoiceEmail"]),

    openDialog() {
      this.resetForm();
      // Pre-fill email if available
      this.emailAddress = this.invoiceDetail.customer?.email_id || "";
      // Set default subject
      this.subject = `Invoice #${this.invoiceDetail.invoiceNumber} - Hemant Traders`;
      // Set default email body
      this.emailBody = `Dear <strong>${
        this.invoiceDetail.customer?.name || "Customer"
      }</strong>,

Please find attached the invoice for your purchase.

Invoice Details:
- Invoice Number:<strong> ${this.invoiceDetail.invoiceNumber}</strong>
- Date:<strong> ${this.formatDate(this.invoiceDetail.createdAt)}</strong>
- Amount:<strong> ₹${this.invoiceDetail.grandTotal}</strong>

<strong>
Thanks & regards,
HEMANT TRADERS
BOPP, POLYESTER, PVC, THERMAL FILMS & LAMINATION ADHESIVES, BOOKBINDING ADHESIVES, PASTING ADHESIVES, UV COATS Phone: (020) 24467833 / 24497533 / 24473403
Mobile: 9422080922 / 9420699675
Website: hemanttraders.vercel.app
email:hemanttraders111@yahoo.in
Address: 1281, Vertex Arcade, Sadashiv Peth, Pune
</strong>
Please Note: This is a system generated email, please do not reply to this email.
`;

      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
      this.resetForm();
    },

    resetForm() {
      this.emailAddress = "";
      this.subject = "";
      this.emailBody = "";
      this.includeChallan = true;
      this.generating = false;
      this.progressMessage = "";
      this.successMessage = "";
      this.errorMessage = "";
      this.emailError = "";
    },

    async sendEmail() {
      if (!this.isValidEmail) {
        this.emailError = "Please enter a valid email address";
        return;
      }

      this.successMessage = "";
      this.errorMessage = "";

      try {
        // Step 1: Generate Invoice PDF
        this.generating = true;
        this.progressMessage = "Generating invoice PDF...";
        const invoicePdfBlob = await this.generateInvoicePDF();

        let challanPdfData = null;

        // Step 2: Generate Delivery Challan PDF if requested
        if (this.includeChallan) {
          this.progressMessage = "Generating delivery challan PDF...";
          challanPdfData = await this.generateChallanPDF();
        }

        this.generating = false;

        // Step 3: Send email using Vuex store action
        this.progressMessage = "Sending email...";
        const emailData = {
          email: this.emailAddress,
          invoiceNumber: this.invoiceDetail.invoiceNumber,
          customerName: this.invoiceDetail.customer?.name || "Customer",
          subject: this.subject,
          message: this.emailBody,
        };

        const result = await this.sendInvoiceEmail({
          emailData,
          pdfBlob: invoicePdfBlob,
          challanPdfData: challanPdfData, // Pass challan data if available
        });

        console.log("Email send result:", emailData, result);

        if (result && result.success) {
          this.successMessage = result.message;
          this.progressMessage = "";

          // Auto-close dialog after 3 seconds on success
          setTimeout(() => {
            this.closeDialog();
          }, 3000);
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (error) {
        console.error("Email sending error:", error);
        this.errorMessage =
          error.message || "Failed to send email. Please try again.";
        this.progressMessage = "";
      }
    },

    // Generate Invoice PDF
    async generateInvoicePDF() {
      return new Promise((resolve, reject) => {
        try {
          const pdfGenerator = this.$refs.invoicePdfGenerator;
          if (!pdfGenerator) {
            throw new Error("Invoice PDF generator not available");
          }
          const pdfData = pdfGenerator.getPdfBlob();
          resolve(pdfData);
        } catch (error) {
          reject(error);
        }
      });
    },

    // Generate Delivery Challan PDF
    async generateChallanPDF() {
      return new Promise((resolve, reject) => {
        try {
          const challanGenerator = this.$refs.challanPdfGenerator;
          if (!challanGenerator) {
            throw new Error("Challan PDF generator not available");
          }
          const pdfData = challanGenerator.getPdfBlobWithName();
          resolve(pdfData);
        } catch (error) {
          reject(error);
        }
      });
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },
  },
};
</script>

<style scoped>
.v-dialog .v-card {
  border-radius: 12px;
}
</style>
