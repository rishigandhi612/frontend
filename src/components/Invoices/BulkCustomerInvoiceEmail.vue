<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>

      <v-col cols="12" md="8">
        <h1 class="text-center mb-4">Bulk Customer Invoice Email</h1>

        <v-card class="mb-4" elevation="2">
          <v-card-title class="primary white--text">
            <v-icon left color="white">mdi-email-multiple</v-icon>
            Select Period & Customers
          </v-card-title>
          <v-card-text class="pt-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedFinancialYear"
                  :items="financialYearOptions"
                  label="Financial Year"
                  prepend-icon="mdi-calendar"
                  outlined
                  dense
                  :disabled="loadingPreview || sending"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-btn-toggle
                  v-model="periodMode"
                  mandatory
                  dense
                  class="mt-1"
                  :disabled="loadingPreview || sending"
                >
                  <v-btn value="fy">
                    <v-icon left small>mdi-calendar-range</v-icon>
                    Full FY
                  </v-btn>
                  <v-btn value="custom">
                    <v-icon left small>mdi-calendar-filter</v-icon>
                    Custom Dates
                  </v-btn>
                </v-btn-toggle>
              </v-col>
              <v-col cols="12" md="6" v-if="periodMode === 'custom'">
                <v-text-field
                  v-model="startDate"
                  type="date"
                  label="Start Date"
                  prepend-icon="mdi-calendar-start"
                  outlined
                  dense
                  :max="endDate || undefined"
                  :disabled="loadingPreview || sending"
                />
              </v-col>
              <v-col cols="12" md="6" v-if="periodMode === 'custom'">
                <v-text-field
                  v-model="endDate"
                  type="date"
                  label="End Date"
                  prepend-icon="mdi-calendar-end"
                  outlined
                  dense
                  :min="startDate || undefined"
                  :disabled="loadingPreview || sending"
                />
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  v-model="selectedCustomerIds"
                  :items="allCustomers"
                  :loading="isLoadingCustomers"
                  item-text="name"
                  item-value="_id"
                  label="Select Customers"
                  prepend-icon="mdi-account-multiple"
                  outlined
                  dense
                  multiple
                  chips
                  clearable
                  :disabled="loadingPreview || sending"
                >
                  <template v-slot:item="{ item }">
                    <v-list-item-content>
                      <v-list-item-title>{{ item.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ item.email_id || "No email" }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" class="text-center">
                <v-btn
                  color="primary"
                  large
                  :loading="loadingPreview"
                  :disabled="!canLoadPreview || sending"
                  @click="loadPreview"
                >
                  <v-icon left>mdi-magnify</v-icon>
                  Load Invoices
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-alert v-if="errorMessage" type="error" dense>
          {{ errorMessage }}
        </v-alert>

        <v-card v-if="customerGroups.length" class="mb-4" elevation="2">
          <v-card-title class="success white--text">
            <v-icon left color="white">mdi-clipboard-list</v-icon>
            Preview
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-subtitle>Customers With Invoices</v-list-item-subtitle>
                    <v-list-item-title class="text-h6">
                      {{ sendableGroups.length }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
              <v-col cols="12" md="4">
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-subtitle>Total Invoices</v-list-item-subtitle>
                    <v-list-item-title class="text-h6">
                      {{ totalInvoices }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
              <v-col cols="12" md="4">
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-subtitle>Total Amount</v-list-item-subtitle>
                    <v-list-item-title class="text-h6 success--text">
                      {{ formatCurrency(totalAmount) }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-expansion-panels v-if="customerGroups.length" multiple>
          <v-expansion-panel
            v-for="group in customerGroups"
            :key="group.customerId"
          >
            <v-expansion-panel-header>
              <div class="d-flex align-center justify-space-between full-width">
                <div>
                  <strong>{{ group.customer.name }}</strong>
                  <div class="text-caption grey--text">
                    {{ group.customer.email_id || "No email available" }}
                  </div>
                </div>
                <div class="text-right">
                  <v-chip
                    small
                    :color="group.invoices.length ? 'primary' : 'grey'"
                    dark
                  >
                    {{ group.invoices.length }} invoice(s)
                  </v-chip>
                  <v-chip small outlined class="ml-2">
                    {{ formatCurrency(group.total) }}
                  </v-chip>
                  <v-chip
                    v-if="group.status"
                    small
                    class="ml-2"
                    :color="getStatusColor(group.status)"
                    dark
                  >
                    {{ group.status }}
                  </v-chip>
                </div>
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-alert v-if="!group.customer.email_id" type="warning" dense text>
                This customer will be skipped because no email is available.
              </v-alert>
              <v-simple-table dense>
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th class="text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="invoice in group.invoices" :key="invoice._id">
                    <td>{{ invoice.invoiceNumber || "N/A" }}</td>
                    <td>{{ formatDate(invoice.createdAt) }}</td>
                    <td class="text-right">
                      {{ formatCurrency(invoice.grandTotal) }}
                    </td>
                  </tr>
                  <tr v-if="!group.invoices.length">
                    <td colspan="3" class="text-center grey--text">
                      No invoices found for this period.
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
              <v-alert v-if="group.error" type="error" dense class="mt-3">
                {{ group.error }}
              </v-alert>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>

      <v-col cols="12" md="2">
        <v-row>
          <v-col cols="12">
            <v-btn
              color="primary"
              block
              :disabled="loadingPreview || sending"
              @click="refreshCustomers"
            >
              <v-icon>mdi-refresh</v-icon> Customers
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn
              color="success"
              block
              :loading="sending"
              :disabled="!sendableGroups.length || loadingPreview"
              @click="sendAll"
            >
              <v-icon>mdi-send</v-icon> Send All
            </v-btn>
          </v-col>
          <v-col cols="12" v-if="sending">
            <v-progress-linear indeterminate color="success" class="mb-2" />
            <div class="text-caption text-center">
              {{ sendProgressMessage }}
            </div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <div style="display: none">
      <InvoicePdf
        v-for="invoice in activePdfInvoices"
        :key="invoice._id"
        ref="invoicePdfComponents"
        :invoiceDetail="invoice"
      />
    </div>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import InvoicePdf from "@/components/Printables/InvoicePdf.vue";

export default {
  name: "BulkCustomerInvoiceEmail",
  components: {
    InvoicePdf,
  },
  data() {
    return {
      selectedFinancialYear: "current",
      periodMode: "fy",
      startDate: "",
      endDate: "",
      selectedCustomerIds: [],
      customerGroups: [],
      activePdfInvoices: [],
      loadingPreview: false,
      sending: false,
      sendProgressMessage: "",
      errorMessage: "",
    };
  },
  computed: {
    ...mapGetters("customers", {
      allCustomers: "allCustomers",
      isLoadingCustomers: "isLoading",
    }),
    financialYearOptions() {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const currentFYStart = currentMonth < 3 ? currentYear - 1 : currentYear;
      const currentFYEnd = currentFYStart + 1;

      const options = [
        {
          text: `Current FY (${currentFYStart}-${String(currentFYEnd).slice(2)})`,
          value: "current",
        },
        {
          text: `Previous FY (${currentFYStart - 1}-${String(currentFYEnd - 1).slice(2)})`,
          value: "previous",
        },
      ];

      for (let i = 2; i <= 6; i++) {
        const startYear = currentFYStart - i;
        const endYear = startYear + 1;
        options.push({
          text: `FY ${startYear}-${String(endYear).slice(2)}`,
          value: `${startYear}-${String(endYear).slice(2)}`,
        });
      }

      return options;
    },
    canLoadPreview() {
      if (!this.selectedCustomerIds.length) return false;
      if (this.periodMode === "custom") {
        return Boolean(this.startDate && this.endDate);
      }
      return true;
    },
    sendableGroups() {
      return this.customerGroups.filter(
        (group) => group.customer.email_id && group.invoices.length,
      );
    },
    totalInvoices() {
      return this.customerGroups.reduce(
        (total, group) => total + group.invoices.length,
        0,
      );
    },
    totalAmount() {
      return this.customerGroups.reduce(
        (total, group) => total + group.total,
        0,
      );
    },
  },
  created() {
    this.refreshCustomers();
  },
  methods: {
    async refreshCustomers() {
      try {
        await this.$store.dispatch("customers/fetchCustomers");
      } catch (error) {
        console.error("Error fetching customers:", error);
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Failed to load customers",
          color: "error",
        });
      }
    },
    async loadPreview() {
      if (!this.canLoadPreview) return;

      this.loadingPreview = true;
      this.errorMessage = "";
      this.customerGroups = [];

      try {
        const groups = [];

        for (const customerId of this.selectedCustomerIds) {
          const selectedCustomer = this.allCustomers.find(
            (customer) => customer._id === customerId,
          );

          const response = await this.$store.dispatch(
            "customers/fetchCustomerInvoicesByFY",
            {
              customerId,
              financialYear: this.selectedFinancialYear,
              page: 1,
              itemsPerPage: 1000,
              sortBy: "createdAt",
              sortDesc: true,
            },
          );

          const invoices = this.filterInvoicesByPeriod(response.data || []);
          const responseCustomer = response.data?.[0]?.customer || {};
          const customer = {
            ...(selectedCustomer || {}),
            ...responseCustomer,
            email_id:
              responseCustomer.email_id ||
              selectedCustomer?.email_id ||
              selectedCustomer?.email ||
              "",
          };

          groups.push({
            customerId,
            customer,
            invoices,
            total: invoices.reduce(
              (total, invoice) => total + (Number(invoice.grandTotal) || 0),
              0,
            ),
            status: "",
            error: "",
          });
        }

        this.customerGroups = groups;
      } catch (error) {
        console.error("Error loading bulk invoice preview:", error);
        this.errorMessage =
          error.message || "Failed to load invoices for selected customers.";
      } finally {
        this.loadingPreview = false;
      }
    },
    filterInvoicesByPeriod(invoices) {
      if (this.periodMode !== "custom") return invoices;

      const start = new Date(`${this.startDate}T00:00:00`);
      const end = new Date(`${this.endDate}T23:59:59`);

      return invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= start && invoiceDate <= end;
      });
    },
    async sendAll() {
      if (!this.sendableGroups.length) return;

      this.sending = true;
      this.errorMessage = "";

      try {
        for (let index = 0; index < this.sendableGroups.length; index++) {
          const group = this.sendableGroups[index];
          this.setGroupStatus(group.customerId, "sending");
          this.sendProgressMessage = `Sending ${index + 1} of ${
            this.sendableGroups.length
          }: ${group.customer.name}`;

          try {
            await this.sendCustomerInvoices(group);
            this.setGroupStatus(group.customerId, "sent");
          } catch (error) {
            console.error("Error sending customer invoices:", error);
            this.setGroupStatus(
              group.customerId,
              "failed",
              error.message || "Failed to send email",
            );
          }
        }

        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Bulk invoice email process completed",
          color: "success",
        });
      } finally {
        this.sending = false;
        this.sendProgressMessage = "";
        this.activePdfInvoices = [];
      }
    },
    async sendCustomerInvoices(group) {
      const pdfFiles = await this.buildInvoicePdfFiles(group.invoices);
      const [primaryPdfFile, ...additionalPdfFiles] = pdfFiles;
      const invoiceNumbers =
        group.invoices
          .map((invoice) => invoice.invoiceNumber)
          .filter(Boolean)
          .join(", ") || "Invoices";

      await this.$store.dispatch("invoices/sendDocumentEmail", {
        emailData: {
          email: group.customer.email_id,
          invoiceNumber: invoiceNumbers,
          customerName: group.customer.name,
          subject: `Invoices - ${group.customer.name} - Hemant Traders`,
          message: this.buildEmailBody(group, invoiceNumbers),
          documentType: "invoice",
          documentLabel: "Invoices",
        },
        primaryPdfData: {
          blob: primaryPdfFile,
          filename: primaryPdfFile.name,
        },
        additionalFiles: additionalPdfFiles,
      });
    },
    buildEmailBody(group, invoiceNumbers) {
      return `Dear <strong>${group.customer.name}</strong>,

Please find attached the invoices for your purchase.

Invoice Details:
- Invoice Numbers:<strong> ${invoiceNumbers}</strong>
- Total Invoices:<strong> ${group.invoices.length}</strong>
- Total Amount:<strong> ${this.formatCurrency(group.total)}</strong>
- Period:<strong> ${this.periodLabel()}</strong>

<strong>
Thanks & regards,
HEMANT TRADERS
BOPP, POLYESTER, PVC, THERMAL FILMS & LAMINATION ADHESIVES, BOOKBINDING ADHESIVES, PASTING ADHESIVES, UV COATS Phone: (020) 24467833 / 24497533 / 24473403
Mobile: 9422080922 / 9420699675
Website: hemanttraders.vercel.app
email:hemanttraders111@yahoo.in
Address: 1281, Vertex Arcade, Sadashiv Peth, Pune
</strong>
Please Note: This is a system generated email, please do not reply to this email.`;
    },
    async buildInvoicePdfFiles(invoices) {
      this.activePdfInvoices = invoices;
      await this.$nextTick();

      const generators = Array.isArray(this.$refs.invoicePdfComponents)
        ? this.$refs.invoicePdfComponents
        : [this.$refs.invoicePdfComponents].filter(Boolean);

      if (generators.length !== invoices.length) {
        throw new Error("Invoice PDF generators are not ready.");
      }

      const files = generators.map((generator, index) => {
        const invoice = invoices[index];
        return this.makePdfFile(
          generator.getPdfBlob(),
          this.getInvoicePdfFilename(invoice),
        );
      });

      this.activePdfInvoices = [];
      await this.$nextTick();

      return files;
    },
    makePdfFile(blob, filename) {
      if (typeof File !== "undefined") {
        return new File([blob], filename, { type: "application/pdf" });
      }

      blob.name = filename;
      return blob;
    },
    getInvoicePdfFilename(invoice) {
      const invoiceNumber = invoice?.invoiceNumber || invoice?._id || "Invoice";
      const safeInvoiceNumber = String(invoiceNumber).replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      return `Invoice_${safeInvoiceNumber}.pdf`;
    },
    setGroupStatus(customerId, status, error = "") {
      const index = this.customerGroups.findIndex(
        (group) => group.customerId === customerId,
      );
      if (index === -1) return;

      this.$set(this.customerGroups, index, {
        ...this.customerGroups[index],
        status,
        error,
      });
    },
    periodLabel() {
      if (this.periodMode === "custom") {
        return `${this.formatDate(this.startDate)} to ${this.formatDate(
          this.endDate,
        )}`;
      }

      const option = this.financialYearOptions.find(
        (item) => item.value === this.selectedFinancialYear,
      );
      return option?.text || this.selectedFinancialYear;
    },
    getStatusColor(status) {
      if (status === "sent") return "success";
      if (status === "failed") return "error";
      if (status === "sending") return "primary";
      return "grey";
    },
    formatDate(dateString) {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "N/A";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(amount) || 0);
    },
    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
