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

    <v-dialog v-model="dialog" max-width="600px" persistent>
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

    getAttachmentSummary() {
      const attachments = [];

      // Always include invoice
      attachments.push(`Invoice #${this.invoiceDetail.invoiceNumber}.pdf`);

      // Include challan if selected
      if (this.includeChallan) {
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
          additionalFiles: this.additionalFiles, // Pass additional files
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
