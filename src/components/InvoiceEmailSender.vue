<template>
  <div>
    <!-- PDF Generator Component (hidden) -->
    <InvoicePdfGenerator
      ref="pdfGenerator"
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
import InvoicePdfGenerator from "./InvoicePdfGenerator.vue"; // Import the PDF generator component

export default {
  name: "InvoiceEmailSender",
  components: {
    InvoicePdfGenerator,
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
      this.emailBody = `Dear ${this.invoiceDetail.customer?.name || "Customer"},

Please find attached the invoice for your recent purchase.

Invoice Details:
- Invoice Number: ${this.invoiceDetail.invoiceNumber}
- Date: ${this.formatDate(this.invoiceDetail.createdAt)}
- Amount: ₹${this.invoiceDetail.grandTotal}

Thank you for your business!

Best regards,
Hemant Traders
Contact: (+91) 9422080922 / 9420699675
Web: hemanttraders.vercel.app`;

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
        // Step 1: Generate PDF using the reusable PDF generator
        this.generating = true;
        this.progressMessage = "Generating invoice PDF...";
        const pdfBlob = await this.generateInvoicePDF();
        this.generating = false;

        // Step 2: Send email using Vuex store action
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
          pdfBlob,
        });

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

    // Use the PDF generator component's method by creating a reference
    async generateInvoicePDF() {
      return new Promise((resolve, reject) => {
        try {
          // Access the PDF generator component reference
          const pdfGenerator = this.$refs.pdfGenerator;
          if (!pdfGenerator) {
            // Fallback: create temporary instance if ref not available
            const PdfGeneratorComponent =
              this.$options.components.InvoicePdfGenerator;
            const tempGenerator = new (this.$root.constructor.extend(
              PdfGeneratorComponent
            ))({
              parent: this.$root,
              propsData: {
                invoiceDetail: this.invoiceDetail,
              },
            });
            tempGenerator.$mount();
            const blob = tempGenerator.getPdfBlob();
            tempGenerator.$destroy();
            resolve(blob);
          } else {
            // Use the component reference
            const blob = pdfGenerator.getPdfBlob();
            resolve(blob);
          }
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
