<template>
  <div>
    <!-- PDF Generator Components (hidden) -->
    <InvoicePdfGenerator
      v-if="isInvoiceMode"
      ref="invoicePdfGenerator"
      :invoiceDetail="invoiceDetail"
      style="display: none"
    />
    <DeliveryChallanGenerator
      v-if="isInvoiceMode"
      ref="challanPdfGenerator"
      :invoiceDetail="invoiceDetail"
      style="display: none"
    />
    <LedgerPdfGenerator
      v-if="isLedgerMode"
      ref="ledgerPdfGenerator"
      :ledger="ledger"
      :summary="ledgerSummary"
      :customer="currentCustomer"
      style="display: none"
    />
    <PendingInvoicesPdfGenerator
      v-if="isPendingMode"
      ref="pendingPdfGenerator"
      :invoices="pendingInvoices"
      :summary="pendingSummary"
      :customer="currentCustomer"
      style="display: none"
    />

    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h5 primary white--text">
          <v-icon left color="white">mdi-email-send</v-icon>
          {{ dialogTitle }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-container>
            <v-row>
              <v-col cols="12" v-if="isInvoiceMode">
                <v-checkbox
                  v-model="includeChallan"
                  label="Include Delivery Challan"
                  dense
                ></v-checkbox>
              </v-col>

              <!-- Contact Selection Dropdown -->
              <v-col cols="12">
                <v-select
                  v-model="selectedContact"
                  :items="predefinedContacts"
                  item-text="displayText"
                  item-value="email"
                  label="Quick Select Contact"
                  prepend-icon="mdi-contacts"
                  outlined
                  dense
                  clearable
                  @change="onContactSelect"
                >
                  <template v-slot:item="{ item }">
                    <div>
                      <div class="font-weight-medium">{{ item.name }}</div>
                      <div class="text-caption grey--text">
                        {{ item.email }}
                      </div>
                    </div>
                  </template>
                </v-select>
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

              <!-- Additional File Attachments Section -->
              <v-col cols="12">
                <v-divider class="mb-3"></v-divider>
                <v-subheader class="px-0">
                  <v-icon left color="primary">mdi-paperclip</v-icon>
                  Additional Attachments (Optional)
                </v-subheader>

                <!-- File Upload Button -->
                <v-file-input
                  v-model="additionalFiles"
                  label="Select additional files to attach"
                  prepend-icon="mdi-file-plus"
                  multiple
                  outlined
                  dense
                  chips
                  show-size
                  :accept="allowedFileTypes"
                  :rules="fileRules"
                  @change="validateFiles"
                  hint="Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 5MB each, 10 files total)"
                  persistent-hint
                ></v-file-input>

                <!-- Display selected files -->
                <div
                  v-if="additionalFiles && additionalFiles.length > 0"
                  class="mt-2"
                >
                  <v-chip
                    v-for="(file, index) in additionalFiles"
                    :key="index"
                    class="ma-1"
                    close
                    outlined
                    small
                    @click:close="removeFile(index)"
                  >
                    <v-icon left small>{{ getFileIcon(file.type) }}</v-icon>
                    {{ file.name }}
                    <span class="text-caption ml-1"
                      >({{ formatFileSize(file.size) }})</span
                    >
                  </v-chip>
                </div>

                <!-- File validation errors -->
                <v-alert
                  v-if="fileValidationErrors.length > 0"
                  type="warning"
                  dense
                  outlined
                  class="mt-2"
                >
                  <ul class="mb-0">
                    <li v-for="error in fileValidationErrors" :key="error">
                      {{ error }}
                    </li>
                  </ul>
                </v-alert>

                <!-- Attachment summary -->
                <v-card
                  v-if="getAttachmentSummary().length > 0"
                  outlined
                  class="mt-3"
                >
                  <v-card-subtitle class="pb-2">
                    <v-icon left small>mdi-email-outline</v-icon>
                    Email will include
                    {{ getAttachmentSummary().length }} attachment(s):
                  </v-card-subtitle>
                  <v-card-text class="pt-0">
                    <v-chip
                      v-for="attachment in getAttachmentSummary()"
                      :key="attachment"
                      class="ma-1"
                      small
                      color="primary"
                      outlined
                    >
                      {{ attachment }}
                    </v-chip>
                  </v-card-text>
                </v-card>
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
            :disabled="
              !isValidEmail || isEmailSending || generating || hasFileErrors
            "
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
import LedgerPdfGenerator from "./Printables/LedgerPdf.vue";
import PendingInvoicesPdfGenerator from "./Printables/PendingInvoicesPdf.vue";

export default {
  name: "InvoiceEmailSender",
  components: {
    InvoicePdfGenerator,
    DeliveryChallanGenerator,
    LedgerPdfGenerator,
    PendingInvoicesPdfGenerator,
  },
  props: {
    documentType: {
      type: String,
      default: "invoice",
    },
    invoiceDetail: {
      type: Object,
      default: () => null,
    },
    ledger: {
      type: Array,
      default: () => [],
    },
    ledgerSummary: {
      type: Object,
      default: () => ({}),
    },
    pendingInvoices: {
      type: Array,
      default: () => [],
    },
    pendingSummary: {
      type: Object,
      default: () => ({}),
    },
    customer: {
      type: Object,
      default: () => ({}),
    },
    // Optional prop to pass predefined contacts from parent
    contacts: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      dialog: false,
      emailAddress: "",
      subject: "",
      emailBody: "",
      includeChallan: true,
      selectedContact: null,
      generating: false,
      progressMessage: "",
      successMessage: "",
      errorMessage: "",
      // File attachment properties
      additionalFiles: [],
      fileValidationErrors: [],
      allowedFileTypes: ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png",
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 10,
      emailRules: [
        (v) => !!v || "Email is required",
        (v) => /.+@.+\..+/.test(v) || "Email must be valid",
      ],
      fileRules: [
        (files) =>
          !files ||
          files.length <= this.maxFiles ||
          `Maximum ${this.maxFiles} files allowed`,
      ],
      emailError: "",
      // Default predefined contacts - can be overridden by props
      defaultContacts: [
        {
          name: "Bajranglal Omprakash",
          email: "sunil_bo@hotmail.com",
          displayText: "Bajranglal Omprakash (sunil_bo@hotmail.com)",
        },
        {
          name: "Astra Chemtech Pvt Ltd",
          email: "logistic@astra1.org",
          displayText: "Astra Chemtech Pvt Ltd (logistics@astra1.org)",
        },
      ],
    };
  },

  computed: {
    isInvoiceMode() {
      return this.documentType === "invoice";
    },
    isLedgerMode() {
      return this.documentType === "ledger";
    },
    isPendingMode() {
      return this.documentType === "pendingInvoices";
    },
    isValidEmail() {
      return this.emailAddress && /.+@.+\..+/.test(this.emailAddress);
    },
    hasFileErrors() {
      return this.fileValidationErrors.length > 0;
    },
    ...mapState("invoices", ["loadingState"]),
    isEmailSending() {
      return this.loadingState.sendEmail;
    },
    currentCustomer() {
      if (this.isInvoiceMode) {
        return this.invoiceDetail?.customer || this.customer || {};
      }

      return this.customer || this.invoiceDetail?.customer || {};
    },
    currentCustomerName() {
      return this.currentCustomer?.name || "Customer";
    },
    dialogTitle() {
      if (this.isLedgerMode) return "Send Ledger via Email";
      if (this.isPendingMode) return "Send Pending Invoices via Email";
      return "Send Invoice via Email";
    },
    primaryDocumentLabel() {
      if (this.isLedgerMode) return "Ledger";
      if (this.isPendingMode) return "Pending Invoices";
      return "Invoice";
    },
    // Combine default contacts with any passed via props
    predefinedContacts() {
      const combinedContacts = [...this.defaultContacts];

      // Add contacts from props if provided
      if (this.contacts && this.contacts.length > 0) {
        const propsContacts = this.contacts.map((contact) => ({
          ...contact,
          displayText: `${contact.name} (${contact.email})`,
        }));
        combinedContacts.unshift(...propsContacts);
      }

      return combinedContacts;
    },
  },

  methods: {
    ...mapActions("invoices", ["sendDocumentEmail"]),

    openDialog() {
      this.resetForm();
      // Pre-fill email if available
      this.emailAddress =
        this.currentCustomer?.email_id || this.currentCustomer?.email || "";
      this.subject = this.buildDefaultSubject();
      this.emailBody = this.buildDefaultEmailBody();

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
      this.selectedContact = null;
      this.generating = false;
      this.progressMessage = "";
      this.successMessage = "";
      this.errorMessage = "";
      this.emailError = "";
      this.additionalFiles = [];
      this.fileValidationErrors = [];
    },

    // Handle contact selection
    onContactSelect(selectedEmail) {
      if (selectedEmail) {
        this.emailAddress = selectedEmail;
        // Clear any existing email errors
        this.emailError = "";
      }
      // If cleared (null), keep current email address as is
    },

    // File handling methods
    validateFiles(files) {
      this.fileValidationErrors = [];

      if (!files || files.length === 0) return;

      // Check file count
      if (files.length > this.maxFiles) {
        this.fileValidationErrors.push(
          `Maximum ${this.maxFiles} files allowed`
        );
      }

      // Check individual files
      files.forEach((file) => {
        // Check file size
        if (file.size > this.maxFileSize) {
          this.fileValidationErrors.push(
            `File "${file.name}" is too large (${this.formatFileSize(
              file.size
            )}). Maximum size is ${this.formatFileSize(this.maxFileSize)}`
          );
        }

        // Check file type
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "image/jpeg",
          "image/jpg",
          "image/png",
        ];

        if (!allowedTypes.includes(file.type)) {
          this.fileValidationErrors.push(
            `File "${file.name}" has an unsupported format (${file.type})`
          );
        }
      });
    },

    removeFile(index) {
      this.additionalFiles.splice(index, 1);
      this.validateFiles(this.additionalFiles);
    },

    getFileIcon(fileType) {
      if (!fileType) return "mdi-file";
      if (fileType.includes("pdf")) return "mdi-file-pdf-box";
      if (fileType.includes("word") || fileType.includes("document"))
        return "mdi-file-word-box";
      if (fileType.includes("excel") || fileType.includes("spreadsheet"))
        return "mdi-file-excel-box";
      if (fileType.includes("image")) return "mdi-image";
      return "mdi-file";
    },

    formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },

    sanitizeFilePart(value) {
      return String(value || "Customer")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    },

    formatCurrency(value) {
      if (value === null || value === undefined || value === "") return "N/A";
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value) || 0);
    },

    buildPeriodLabel(items = [], dateField = "date") {
      const validDates = items
        .map((item) => new Date(item?.[dateField]))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a - b);

      if (!validDates.length) return "";

      const start = this.formatDate(validDates[0]);
      const end = this.formatDate(validDates[validDates.length - 1]);

      return start === end ? start : `${start} to ${end}`;
    },

    getDocumentReference() {
      if (this.isInvoiceMode) {
        return this.invoiceDetail?.invoiceNumber || "Invoice";
      }

      if (this.isLedgerMode) {
        return `Ledger-${this.sanitizeFilePart(this.currentCustomerName)}`;
      }

      return `Pending-Invoices-${this.sanitizeFilePart(this.currentCustomerName)}`;
    },

    getPrimaryDocumentFilename() {
      if (this.isInvoiceMode) {
        return `Invoice_${this.invoiceDetail?.invoiceNumber || "Document"}.pdf`;
      }

      if (this.isLedgerMode) {
        return `Ledger_${this.sanitizeFilePart(this.currentCustomerName)}.pdf`;
      }

      return `Pending_Invoices_${this.sanitizeFilePart(this.currentCustomerName)}.pdf`;
    },

    buildDefaultSubject() {
      if (this.isLedgerMode) {
        return `Ledger Statement - ${this.currentCustomerName} - Hemant Traders`;
      }

      if (this.isPendingMode) {
        return `Pending Invoices - ${this.currentCustomerName} - Hemant Traders`;
      }

      return `Invoice #${this.invoiceDetail?.invoiceNumber || ""} - Hemant Traders`;
    },

    buildDefaultEmailBody() {
      const customerName = this.currentCustomerName;
      const signature = `<strong>
Thanks & regards,
HEMANT TRADERS
BOPP, POLYESTER, PVC, THERMAL FILMS & LAMINATION ADHESIVES, BOOKBINDING ADHESIVES, PASTING ADHESIVES, UV COATS Phone: (020) 24467833 / 24497533 / 24473403
Mobile: 9422080922 / 9420699675
Website: hemanttraders.vercel.app
email:hemanttraders111@yahoo.in
Address: 1281, Vertex Arcade, Sadashiv Peth, Pune
</strong>
Please Note: This is a system generated email, please do not reply to this email.`;

      if (this.isLedgerMode) {
        const period = this.buildPeriodLabel(this.ledger, "date");

        return `Dear <strong>${customerName}</strong>,

Please find attached your ledger statement.

Ledger Details:
- Period:<strong> ${period || "As shared"}</strong>
- Closing Balance:<strong> ${this.formatCurrency(this.ledgerSummary?.closingBalance)}</strong>
- Balance Type:<strong> ${this.ledgerSummary?.balanceType || "N/A"}</strong>

${signature}`;
      }

      if (this.isPendingMode) {
        const period = this.buildPeriodLabel(this.pendingInvoices, "invoiceDate");

        return `Dear <strong>${customerName}</strong>,

Please find attached the pending invoices statement.

Pending Summary:
- Period:<strong> ${period || "As shared"}</strong>
- Invoices:<strong> ${this.pendingSummary?.count || this.pendingInvoices.length}</strong>
- Outstanding Amount:<strong> ${this.formatCurrency(this.pendingSummary?.totalPending)}</strong>

${signature}`;
      }

      return `Dear <strong>${customerName}</strong>,

Please find attached the invoice for your purchase.

Invoice Details:
- Invoice Number:<strong> ${this.invoiceDetail?.invoiceNumber || "N/A"}</strong>
- Date:<strong> ${this.formatDate(this.invoiceDetail?.createdAt)}</strong>
- Amount:<strong> ${this.formatCurrency(this.invoiceDetail?.grandTotal)}</strong>

${signature}`;
    },

    getAttachmentSummary() {
      const attachments = [];

      attachments.push(this.getPrimaryDocumentFilename());

      if (this.isInvoiceMode && this.includeChallan) {
        attachments.push(`Delivery Challan.pdf`);
      }

      // Include additional files
      if (this.additionalFiles && this.additionalFiles.length > 0) {
        this.additionalFiles.forEach((file) => {
          attachments.push(file.name);
        });
      }

      return attachments;
    },

    async sendEmail() {
      if (!this.isValidEmail) {
        this.emailError = "Please enter a valid email address";
        return;
      }

      if (this.hasFileErrors) {
        this.errorMessage = "Please fix file validation errors before sending";
        return;
      }

      this.successMessage = "";
      this.errorMessage = "";

      try {
        this.generating = true;
        this.progressMessage = `Generating ${this.primaryDocumentLabel.toLowerCase()} PDF...`;
        const primaryPdfData = await this.generatePrimaryPDF();

        let challanPdfData = null;

        if (this.isInvoiceMode && this.includeChallan) {
          this.progressMessage = "Generating delivery challan PDF...";
          challanPdfData = await this.generateChallanPDF();
        }

        this.generating = false;

        this.progressMessage = "Sending email...";
        const emailData = {
          email: this.emailAddress,
          invoiceNumber: this.getDocumentReference(),
          customerName: this.currentCustomerName,
          subject: this.subject,
          message: this.emailBody,
          documentType: this.documentType,
          documentLabel: this.primaryDocumentLabel,
        };

        const result = await this.sendDocumentEmail({
          emailData,
          primaryPdfData,
          challanPdfData,
          additionalFiles: this.additionalFiles,
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

    async generatePrimaryPDF() {
      return new Promise((resolve, reject) => {
        try {
          if (this.isLedgerMode) {
            const ledgerGenerator = this.$refs.ledgerPdfGenerator;
            if (!ledgerGenerator) {
              throw new Error("Ledger PDF generator not available");
            }
            const pdfData = ledgerGenerator.getPdfBlobWithName();
            if (!pdfData?.blob) {
              throw new Error("Failed to generate ledger PDF");
            }
            resolve(pdfData);
            return;
          }

          if (this.isPendingMode) {
            const pendingGenerator = this.$refs.pendingPdfGenerator;
            if (!pendingGenerator) {
              throw new Error("Pending invoices PDF generator not available");
            }
            const pdfData = pendingGenerator.getPdfBlobWithName();
            if (!pdfData?.blob) {
              throw new Error("Failed to generate pending invoices PDF");
            }
            resolve(pdfData);
            return;
          }

          const pdfGenerator = this.$refs.invoicePdfGenerator;
          if (!pdfGenerator) {
            throw new Error("Invoice PDF generator not available");
          }
          const pdfData = pdfGenerator.getPdfBlob();
          resolve({
            blob: pdfData,
            filename: this.getPrimaryDocumentFilename(),
          });
        } catch (error) {
          reject(error);
        }
      });
    },

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
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "N/A";
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
