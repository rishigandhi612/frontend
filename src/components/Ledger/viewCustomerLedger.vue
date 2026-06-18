<template>
  <v-container fluid>
    <!-- hidden pdf generator instance -->
    <LedgerPdf
      ref="ledgerPdf"
      :ledger="ledgerPdfItems"
      :summary="ledgerPdfSummary"
      :customer="customerLedger?.customer"
    />
    <v-row align="center" class="mb-4">
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12">
        <h1 class="text-center">{{ customerName }}</h1>
        <div v-if="customerName" class="text-center subtitle-1">
          Ledger Account
        </div>
      </v-col>
      <v-col cols="12" md="2" sm="4" class="d-flex align-center justify-end">
        <v-btn color="primary" @click="goToReceipt">
          <v-icon>mdi-receipt-text</v-icon>
          Record Receipt
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <div
                  class="text-caption text-uppercase font-weight-bold text--secondary"
                >
                  Total Debit
                </div>
                <div class="text-h6 font-weight-bold" style="color: #d32f2f">
                  {{ formatCurrency(summary?.totalDebit) }}
                </div>
              </v-col>
              <v-col cols="12" md="3">
                <div
                  class="text-caption text-uppercase font-weight-bold text--secondary"
                >
                  Total Credit
                </div>
                <div class="text-h6 font-weight-bold" style="color: #388e3c">
                  {{ formatCurrency(summary?.totalCredit) }}
                </div>
              </v-col>
              <v-col cols="12" md="3">
                <div
                  class="text-caption text-uppercase font-weight-bold text--secondary"
                >
                  Closing Balance
                </div>
                <div class="text-h6 font-weight-bold" style="color: #1976d2">
                  {{ formatCurrency(summary?.closingBalance) }}
                </div>
              </v-col>
              <v-col cols="12" md="3">
                <div
                  class="text-caption text-uppercase font-weight-bold text--secondary"
                >
                  Balance Type
                </div>
                <v-chip
                  :color="
                    summary?.balanceType === 'SETTLED' ? '#4caf50' : '#ff9800'
                  "
                  text-color="white"
                  small
                >
                  {{ summary?.balanceType || "-" }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4" v-if="selected.length > 0">
      <v-col cols="12">
        <v-card
          elevation="4"
          :style="{ borderLeft: '4px solid #1976d2' }"
          style="background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)"
        >
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8">
                <div
                  class="text-caption text-uppercase font-weight-bold text--secondary"
                >
                  Selected Items ({{ selected.length }})
                </div>
                <div class="text-h5 font-weight-bold" style="color: #1976d2">
                  {{ formatCurrency(selectedTotal) }}
                </div>
              </v-col>
              <v-col cols="12" md="4" class="d-flex align-center justify-end">
                <v-btn small outlined @click="clearSelection">
                  <v-icon small>mdi-close</v-icon> Clear Selection
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="formattedItems"
          :loading="loading"
          item-key="referenceId"
          class="elevation-2"
          mobile-breakpoint="0"
          :item-class="getRowClass"
          :page.sync="page"
          :items-per-page.sync="limit"
          :server-items-length="customerLedger?.pagination?.total || 0"
          @update:page="onPageChange"
          @update:items-per-page="onLimitChange"
          :footer-props="{
            showFirstLastPage: true,
          }"
        >
          <template v-slot:top>
            <div class="ledger-toolbar">
              <div class="ledger-toolbar__title">Ledger Entries</div>

              <div class="ledger-toolbar__section">
                <v-btn-toggle
                  v-model="filterMode"
                  mandatory
                  dense
                  class="ledger-toolbar__toggle"
                  @change="filterMode === 'year' ? onYearChange() : null"
                >
                  <v-btn value="year" small>
                    <v-icon small left>mdi-calendar-range</v-icon> Year
                  </v-btn>
                  <v-btn value="custom" small>
                    <v-icon small left>mdi-calendar-edit</v-icon> Custom
                  </v-btn>
                </v-btn-toggle>

                <v-select
                  v-if="filterMode === 'year'"
                  v-model="financialYear"
                  :items="financialYearOptions"
                  item-text="text"
                  item-value="value"
                  dense
                  outlined
                  hide-details
                  class="ledger-toolbar__field ledger-toolbar__year"
                  @change="onYearChange"
                />

                <template v-if="filterMode === 'custom'">
                  <v-text-field
                    v-model="startDate"
                    type="date"
                    label="From"
                    dense
                    outlined
                    hide-details
                    class="ledger-toolbar__field"
                  />
                  <v-text-field
                    v-model="endDate"
                    type="date"
                    label="To"
                    dense
                    outlined
                    hide-details
                    class="ledger-toolbar__field"
                  />
                  <v-btn
                    small
                    color="primary"
                    class="ledger-toolbar__action-btn"
                    @click="onDateFilter"
                    :disabled="!startDate && !endDate"
                  >
                    <v-icon small left>mdi-magnify</v-icon>
                    Apply
                  </v-btn>
                  <v-btn
                    small
                    outlined
                    class="ledger-toolbar__action-btn"
                    @click="clearDateFilter"
                    title="Clear"
                  >
                    <v-icon small left>mdi-close</v-icon>
                    Clear
                  </v-btn>
                </template>
              </div>

              <div class="ledger-toolbar__section ledger-toolbar__actions">
                <v-btn
                  small
                  outlined
                  class="ledger-toolbar__action-btn"
                  @click="refresh"
                  title="Refresh"
                >
                  <v-icon small left>mdi-refresh</v-icon>
                  Refresh
                </v-btn>
                <v-btn
                  small
                  outlined
                  class="ledger-toolbar__action-btn"
                  @click="exportPdf"
                  title="Export Ledger PDF"
                >
                  <v-icon small left>mdi-file-pdf-box</v-icon>
                  Export PDF
                </v-btn>
                <v-btn
                  small
                  outlined
                  class="ledger-toolbar__action-btn"
                  @click="openLedgerEmailDialog"
                >
                  <v-icon small left>mdi-email-outline</v-icon>
                  Email Ledger
                </v-btn>
                <v-btn
                  small
                  color="orange darken-2"
                  dark
                  class="ledger-toolbar__action-btn"
                  @click="openPendingDialog"
                >
                  <v-icon small left>mdi-clock-alert-outline</v-icon>
                  Pending Invoices
                </v-btn>
              </div>
            </div>
          </template>

          <template v-slot:[`item.select`]="{ item }">
            <v-checkbox
              :input-value="selected.indexOf(item.referenceId) >= 0"
              @change="toggleSelect(item)"
              hide-details
            />
          </template>

          <template v-slot:[`item.type`]="{ item }">
            <v-chip :color="getChipColor(item.type)" text-color="white" small>
              {{ item.type }}
            </v-chip>
          </template>

          <template v-slot:[`item.actions`]="{ item }">
            <v-btn
              v-if="item.type === 'INVOICE'"
              icon
              small
              @click="viewInvoice(item.voucherId)"
              title="View Invoice"
              color="primary"
            >
              <v-icon small>mdi-information-outline</v-icon>
            </v-btn>
            <v-btn
              v-if="item.type === 'RECEIPT'"
              icon
              small
              @click="viewReceipt(item.referenceNumber)"
              title="View Receipt"
              color="primary"
            >
              <v-icon small>mdi-information-outline</v-icon>
            </v-btn>
          </template>
        </v-data-table>
        <!-- <v-row class="mt-4">
          <v-col cols="12" sm="6" class="d-flex align-center">
            <span class="text-caption mr-4">Rows per page:</span>
            <v-select
              v-model="limit"
              :items="[5, 10, 25, 50]"
              @change="onLimitChange"
              outlined
              dense
              style="max-width: 100px"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" class="d-flex align-center justify-end">
            <span class="text-caption mr-4">
              Page {{ page }} of {{ totalPages }} ({{
                customerLedger?.pagination?.total || 0
              }}
              total)
            </span>
            <v-pagination
              v-model="page"
              :length="totalPages"
              @input="onPageChange"
              :disabled="loading"
            />
          </v-col>
        </v-row> -->
      </v-col>
    </v-row>
    <v-row v-if="error" class="mt-4">
      <v-col cols="12">
        <v-alert type="error" dense>{{ error }}</v-alert>
      </v-col>
    </v-row>
    <v-dialog v-model="pendingDialog" scrollable>
      <v-card>
        <!-- Title bar -->
        <v-card-title
          class="white--text py-3"
          style="background: linear-gradient(135deg, #e65100 0%, #ff9800 100%)"
        >
          <v-icon left color="white">mdi-clock-alert-outline</v-icon>
          <span>Pending Invoices — {{ customerName }}</span>
          <v-spacer />
          <v-btn icon dark small @click="pendingDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <!-- Summary strip -->
        <v-card-text class="pa-4 pb-0">
          <v-row dense>
            <v-col cols="6" sm="3">
              <v-card outlined rounded>
                <v-card-text class="pa-3 text-center">
                  <div
                    class="text-caption text--secondary text-uppercase font-weight-bold"
                  >
                    Gross Pending
                  </div>
                  <div class="text-h6 font-weight-bold green--text">
                    {{ formatCurrency(pendingDialogSummary.grossPending) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card outlined rounded>
                <v-card-text class="pa-3 text-center">
                  <div
                    class="text-caption text--secondary text-uppercase font-weight-bold"
                  >
                    On Account
                  </div>
                  <div class="text-h6 font-weight-bold orange--text darken-2">
                    {{ formatCurrency(pendingDialogSummary.totalOnAccount) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card outlined rounded>
                <v-card-text class="pa-3 text-center">
                  <div
                    class="text-caption text--secondary text-uppercase font-weight-bold"
                  >
                    Actual Receivable
                  </div>
                  <div class="text-h6 font-weight-bold red--text darken-1">
                    {{ formatCurrency(pendingDialogSummary.totalPending) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card outlined rounded>
                <v-card-text class="pa-3 text-center">
                  <div
                    class="text-caption text--secondary text-uppercase font-weight-bold"
                  >
                    Total Credit Note(s) Amount
                  </div>
                  <div class="text-h6 font-weight-bold">
                    {{
                      formatCurrency(pendingDialogSummary.totalCreditNoteAmount)
                    }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Search + Record Receipt -->
          <v-row dense class="mt-3">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="pendingSearch"
                placeholder="Search invoice number..."
                prepend-inner-icon="mdi-magnify"
                outlined
                dense
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-btn color="primary" @click="generatependingPdf()">
                <v-icon left>mdi-file-pdf-box</v-icon>
                {{ hasPendingSelection ? "Export Selected PDF" : "Export PDF" }}
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-btn color="primary" outlined @click="openPendingEmailDialog">
                <v-icon left>mdi-email-outline</v-icon>
                {{ hasPendingSelection ? "Email Selected" : "Email PDF" }}
              </v-btn>
            </v-col>
          </v-row>

          <v-row dense class="mt-3" v-if="selectedPendingInvoices.length > 0">
            <v-col cols="12">
              <v-card
                outlined
                rounded
                :style="{ borderLeft: '4px solid #1976d2' }"
                style="
                  background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%);
                "
              >
                <v-card-text class="py-3">
                  <v-row align="center" dense>
                    <v-col cols="12" md="8">
                      <div
                        class="text-caption text-uppercase font-weight-bold text--secondary"
                      >
                        Selected Pending Invoices ({{
                          pendingSelectedSummary.count
                        }})
                      </div>
                      <div
                        class="text-h6 font-weight-bold"
                        style="color: #1976d2"
                      >
                        {{
                          formatCurrency(pendingSelectedSummary.totalPending)
                        }}
                      </div>
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                      class="d-flex align-center justify-end gap-2"
                    >
                      <v-btn small outlined @click="clearPendingSelection">
                        <v-icon small>mdi-close</v-icon>
                        Clear Selection
                      </v-btn>
                      <v-btn
                        small
                        color="success"
                        @click="settleSelectedInvoices"
                      >
                        <v-icon small>mdi-check-circle</v-icon>
                        Settle
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <!-- Table -->
        <v-card-text class="pt-3">
          <v-data-table
            :headers="pendingHeaders"
            :items="pendingInvoices"
            :loading="isLoadingBills"
            :search="pendingSearch"
            item-key="selectionKey"
            dense
            mobile-breakpoint="0"
            class="elevation-1"
            :items-per-page="10"
            :footer-props="{
              itemsPerPageOptions: [5, 10, 25, 50],
              showFirstLastPage: true,
            }"
            sort-by="invoiceDate"
            sort-asc
          >
            <template v-slot:[`item.select`]="{ item }">
              <v-checkbox
                :input-value="
                  selectedPendingInvoiceKeys.indexOf(item.selectionKey) >= 0
                "
                @change="togglePendingSelection(item)"
                hide-details
                class="mt-0 pt-0"
              />
            </template>

            <!-- Invoice date -->
            <template v-slot:[`item.invoiceDate`]="{ item }">
              {{ formatDate(item.invoiceDate) }}
            </template>

            <!-- Bill amount -->
            <template v-slot:[`item.openingAmount`]="{ item }">
              {{ formatCurrency(item.openingAmount) }}
            </template>

            <!-- Allocated — grey when 0 -->
            <template v-slot:[`item.allocatedAmount`]="{ item }">
              <span
                :class="
                  item.allocatedAmount > 0
                    ? 'green--text font-weight-medium'
                    : 'text--disabled'
                "
              >
                {{ formatCurrency(item.allocatedAmount) }}
              </span>
            </template>

            <!-- Pending chip -->
            <template v-slot:[`item.pendingAmount`]="{ item }">
              <!-- <v-chip
                small
                :color="
                  Number(item.pendingAmount) < 0 ? 'purple' : 'red darken-1'
                "
                text-color="white"
              > -->
              {{ formatCurrency(item.pendingAmount) }}
              <!-- </v-chip> -->
            </template>

            <!-- Status chip -->
            <template v-slot:[`item.status`]="{ item }">
              <v-chip
                small
                :color="statusColor(item.status)"
                text-color="white"
              >
                {{ item.status }}
              </v-chip>
            </template>

            <!-- Empty state -->
            <template v-slot:no-data>
              <div class="text-center pa-6">
                <v-icon color="green" large>mdi-check-circle-outline</v-icon>
                <div class="mt-2 green--text font-weight-medium">
                  All invoices are fully settled!
                </div>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <PendingInvoicesPdf
      ref="pendingPdf"
      :invoices="pendingInvoicesForPdf"
      :summary="pendingPdfSummary"
      :customer="pendingCustomer"
    />
    <InvoiceEmailSender
      ref="ledgerEmailSender"
      document-type="ledger"
      :ledger="ledgerPdfItems"
      :ledger-summary="ledgerPdfSummary"
      :customer="customerLedger?.customer"
    />
    <InvoiceEmailSender
      ref="pendingEmailSender"
      document-type="pendingInvoices"
      :pending-invoices="pendingInvoicesForPdf"
      :pending-summary="pendingPdfSummary"
      :customer="pendingCustomer"
    />
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import InvoiceEmailSender from "../InvoiceEmailSender.vue";
import LedgerPdf from "../Printables/LedgerPdf.vue";
import PendingInvoicesPdf from "../Printables/PendingInvoicesPdf.vue";

export default {
  name: "viewCustomerLedger",
  components: {
    InvoiceEmailSender,
    LedgerPdf,
    PendingInvoicesPdf,
  },
  data() {
    return {
      loading: false,
      error: null,
      selected: [],
      ledgerDocumentItems: [],
      ledgerDocumentSummary: null,
      page: 1,
      limit: 10,
      totalPages: 1,
      headers: [
        { text: "Select", value: "select", align: "center", sortable: false },
        { text: "Date", value: "date" },
        { text: "Type", value: "type" },
        { text: "Reference", value: "referenceNumber" },
        { text: "Description", value: "description" },
        { text: "Debit", value: "debit", align: "end" },
        { text: "Credit", value: "credit", align: "end" },
        { text: "Balance", value: "balance", align: "end" },
        { text: "Action", value: "actions", align: "center", sortable: false },
      ],
      pendingDialog: false,
      pendingLoading: false,
      pendingSearch: "",
      selectedPendingInvoiceKeys: [],
      pendingHeaders: [
        { text: "Select", value: "select", align: "center", sortable: false },
        { text: "Invoice Date", value: "invoiceDate" },
        { text: "Invoice No", value: "invoiceno" },
        { text: "Opening Amount", value: "openingAmount", align: "end" },
        { text: "Allocated", value: "allocatedAmount", align: "end" },
        { text: "Pending", value: "pendingAmount", align: "end" },
      ],
      financialYear: "current",
      startDate: null,
      endDate: null,
      dateMenu1: false, // for v-date-picker popups if you use them
      dateMenu2: false,
      filterMode: "year", // "year" | "custom"
    };
  },
  computed: {
    ...mapGetters("ledger", ["customerLedger"]),
    ...mapGetters("accounting", [
      "customerBills",
      "customerBillsSummary",
      "customerBillsCustomer",
      "isLoadingBills",
    ]),
    ledgerItems() {
      return this.customerLedger && this.customerLedger.ledger
        ? this.customerLedger.ledger
        : [];
    },
    ledgerPdfItems() {
      return this.ledgerDocumentItems.length
        ? this.ledgerDocumentItems
        : this.ledgerItems;
    },
    ledgerPdfSummary() {
      return this.ledgerDocumentSummary || this.summary || {};
    },
    financialYearOptions() {
      const options = [{ text: "Current Year", value: "current" }];
      const now = new Date();
      // Financial year starts in April, so if we're before April, current FY started last year
      const currentFYStart =
        now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      for (let y = currentFYStart; y >= currentFYStart - 1; y--) {
        const label = `${y}-${String(y + 1).slice(-2)}`;
        options.push({ text: label, value: label });
      }
      return options;
    },
    pendingInvoices() {
      return (this.customerBills || [])
        .map((invoice, idx) => {
          const invoiceno =
            invoice?.invoiceno || invoice?.invoiceNumber || `INV-${idx + 1}`;
          const openingAmount = Number(
            invoice?.openingAmount ??
              invoice?.billAmount ??
              invoice?.amount ??
              0,
          );
          const allocatedAmount = Number(
            invoice?.allocatedAmount ?? invoice?.actualAllocatedAmount ?? 0,
          );
          const pendingAmount = Number(invoice?.pendingAmount ?? 0);

          return {
            ...invoice,
            selectionKey:
              invoice?.id ||
              invoice?._id ||
              invoice?.invoiceId ||
              `${invoiceno}-${invoice?.invoiceDate || idx}`,
            invoiceno,
            openingAmount,
            allocatedAmount,
            actualAllocatedAmount: allocatedAmount,
            pendingAmount,
          };
        })
        .filter((inv) => Number(inv.pendingAmount) !== 0);
    },
    selectedPendingInvoices() {
      if (!this.selectedPendingInvoiceKeys.length) return [];
      return this.pendingInvoices.filter((invoice) =>
        this.selectedPendingInvoiceKeys.includes(invoice.selectionKey),
      );
    },
    hasPendingSelection() {
      return this.selectedPendingInvoices.length > 0;
    },
    pendingInvoicesForPdf() {
      return this.hasPendingSelection
        ? this.selectedPendingInvoices
        : this.pendingInvoices;
    },
    pendingCustomer() {
      const customer = this.customerBillsCustomer || {};
      const normalizedAddress =
        typeof customer.address === "object"
          ? customer.address
          : {
              line1: customer.address || "",
              city: "",
              pincode: "",
            };

      return {
        ...customer,
        _id: customer._id || customer.id || customer.customerId || "",
        name: customer.name || this.customerLedger?.customer?.name || "",
        email_id: customer.email_id || customer.email || "",
        phone_no: customer.phone_no || customer.phone || "",
        gstin: customer.gstin || "",
        address: normalizedAddress,
      };
    },
    pendingDialogSummary() {
      if (Object.keys(this.customerBillsSummary || {}).length) {
        return this.normalizePendingSummary(this.customerBillsSummary);
      }

      return this.summarizePendingInvoices(this.pendingInvoices);
    },
    pendingSelectedSummary() {
      return this.summarizePendingInvoices(this.selectedPendingInvoices);
    },
    pendingPdfSummary() {
      return this.hasPendingSelection
        ? this.pendingSelectedSummary
        : this.pendingDialogSummary;
    },
    formattedItems() {
      return this.ledgerItems.map((item) => {
        return {
          ...item,
          date: this.formatDate(item.date),
          debit:
            item.debit === null || item.debit === undefined
              ? "-"
              : this.formatCurrency(item.debit),
          credit:
            item.credit === null || item.credit === undefined
              ? "-"
              : this.formatCurrency(item.credit),
          balance:
            item.balance === null || item.balance === undefined
              ? "-"
              : this.formatCurrency(item.balance),
        };
      });
    },
    summary() {
      return this.customerLedger && this.customerLedger.summary
        ? this.customerLedger.summary
        : null;
    },
    customerName() {
      return this.customerLedger && this.customerLedger.customer
        ? this.customerLedger.customer.name
        : null;
    },
    selectedTotal() {
      return this.selected.reduce((total, refId) => {
        const item = this.ledgerItems.find((i) => i.referenceId === refId);
        if (!item) return total;
        // One of debit/credit is always 0, just sum both
        return (
          total + (parseFloat(item.debit) || 0) - (parseFloat(item.credit) || 0)
        );
      }, 0);
    },
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    getChipColor(type) {
      switch (type) {
        case "INVOICE":
          return "#d32f2f";
        case "RECEIPT":
          return "#388e3c";
        case "CREDIT_NOTE":
          return "#1976d2";
        case "OPENING_BALANCE":
          return "#7b1fa2";
        default:
          return "grey";
      }
    },
    buildLedgerDocumentParams(limit = 100000) {
      const params = { limit, page: 1, sortOrder: "asc" };

      if (this.filterMode === "custom" && (this.startDate || this.endDate)) {
        if (this.startDate) params.startDate = this.startDate;
        if (this.endDate) params.endDate = this.endDate;
      } else {
        params.financialYear = this.financialYear;
      }

      return params;
    },
    async prepareLedgerDocumentData() {
      const customerId =
        this.customerLedger?.customer?._id || this.$route.params.id;
      if (!customerId) return false;

      let prepared = false;

      try {
        await this.$store.dispatch("ledger/fetchCustomerLedger", {
          customerId,
          params: this.buildLedgerDocumentParams(),
        });

        this.ledgerDocumentItems = [...(this.customerLedger?.ledger || [])];
        this.ledgerDocumentSummary = this.customerLedger?.summary
          ? { ...this.customerLedger.summary }
          : {};
        prepared = true;
      } catch (e) {
        console.error("Failed to fetch full ledger:", e);
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Unable to fetch full ledger document",
          color: "error",
        });
      }

      try {
        await this.fetchLedger();
      } catch (restoreError) {
        console.error("Failed to restore paginated ledger view:", restoreError);
      }

      return prepared;
    },
    async exportPdf() {
      const prepared = await this.prepareLedgerDocumentData();
      if (!prepared) return;

      await this.$nextTick();
      this.$refs.ledgerPdf?.generatePdf();
    },
    async openLedgerEmailDialog() {
      const prepared = await this.prepareLedgerDocumentData();
      if (!prepared || !this.ledgerPdfItems.length) return;

      await this.$nextTick();
      this.$refs.ledgerEmailSender?.openDialog();
    },
    generatependingPdf() {
      if (!this.pendingInvoicesForPdf.length) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: this.hasPendingSelection
            ? "No selected pending invoices to export"
            : "No pending invoices available to export",
          color: "warning",
        });
        return;
      }
      this.$refs.pendingPdf?.generatePdf();
    },
    async ensurePendingInvoicesLoaded(force = false) {
      if (!force && this.customerBills && this.customerBills.length)
        return true;

      try {
        const customerId =
          this.customerLedger?.customer?._id || this.$route.params.id;
        if (!customerId) return false;

        await this.$store.dispatch("accounting/fetchCustomerBills", customerId);
        return true;
      } catch {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Failed to load pending invoices",
          color: "error",
        });
        return false;
      }
    },
    async openPendingEmailDialog() {
      const loaded = await this.ensurePendingInvoicesLoaded();
      if (!loaded) return;

      if (!this.pendingInvoicesForPdf.length) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: this.hasPendingSelection
            ? "No selected pending invoices to email"
            : "No pending invoices available to email",
          color: "warning",
        });
        return;
      }

      this.$refs.pendingEmailSender?.openDialog();
    },
    summarizePendingInvoices(invoices = []) {
      return {
        count: invoices.length,
        totalBill: invoices.reduce(
          (sum, invoice) => sum + Number(invoice.openingAmount || 0),
          0,
        ),
        totalAllocated: invoices.reduce(
          (sum, invoice) => sum + Number(invoice.allocatedAmount || 0),
          0,
        ),
        totalPending: invoices.reduce(
          (sum, invoice) => sum + Number(invoice.pendingAmount || 0),
          0,
        ),
      };
    },
    normalizePendingSummary(summary = {}) {
      return {
        totalPending: Number(summary.totalPending ?? 0),
        totalOnAccount: Number(summary.onAccount ?? 0),
        grossPending: Number(summary.grossPending ?? 0),
        totalCreditNoteAmount: Number(summary.totalCreditNoteAmount ?? 0),
      };
    },
    formatDate(d) {
      if (!d) return "-";
      try {
        return new Date(d).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });
      } catch (e) {
        return d;
      }
    },
    formatCurrency(val) {
      if (val === null || val === undefined) return "-";
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(val);
    },
    async fetchLedger() {
      this.loading = true;
      this.error = null;
      try {
        const customerId = this.$route.params.id;
        if (!customerId) {
          this.error = "Customer ID not provided in route";
          this.loading = false;
          return;
        }

        const params = {
          sortOrder: "asc",
          page: this.page,
          limit: this.limit,
        };

        if (this.filterMode === "custom" && (this.startDate || this.endDate)) {
          // Send date range — backend ignores financialYear when these are present
          if (this.startDate) params.startDate = this.startDate;
          if (this.endDate) params.endDate = this.endDate;
        } else {
          // Send financial year
          params.financialYear = this.financialYear;
        }

        await this.$store.dispatch("ledger/fetchCustomerLedger", {
          customerId,
          params,
        });

        if (this.customerLedger?.pagination) {
          this.totalPages = this.customerLedger.pagination.totalPages || 1;
        }
      } catch (err) {
        this.error = err.message || "Failed to load ledger";
      } finally {
        this.loading = false;
      }
    },

    onYearChange() {
      this.page = 1;
      this.fetchLedger();
    },

    onDateFilter() {
      this.page = 1;
      this.fetchLedger();
    },

    clearDateFilter() {
      this.startDate = null;
      this.endDate = null;
      this.filterMode = "year";
      this.page = 1;
      this.fetchLedger();
    },

    refresh() {
      this.fetchLedger();
    },
    viewInvoice(voucherId) {
      this.$router.push({
        name: "invoiceDetail",
        params: { id: voucherId },
      });
    },
    viewReceipt(receiptNumber) {
      this.$router.push({
        name: "addReceipt",
        params: { id: receiptNumber },
      });
    },
    toggleSelect(item) {
      const index = this.selected.indexOf(item.referenceId);
      if (index >= 0) {
        this.selected.splice(index, 1);
      } else {
        this.selected.push(item.referenceId);
      }
    },
    clearSelection() {
      this.selected = [];
    },
    togglePendingSelection(item) {
      const index = this.selectedPendingInvoiceKeys.indexOf(item.selectionKey);
      if (index >= 0) {
        this.selectedPendingInvoiceKeys.splice(index, 1);
      } else {
        this.selectedPendingInvoiceKeys.push(item.selectionKey);
      }
    },
    clearPendingSelection() {
      this.selectedPendingInvoiceKeys = [];
    },
    getRowClass(item) {
      return this.selected.indexOf(item.referenceId) >= 0
        ? "highlighted-row"
        : "";
    },
    onPageChange(newPage) {
      this.page = newPage;
      this.fetchLedger();
    },
    onLimitChange(newLimit) {
      this.limit = newLimit;
      this.page = 1; // Reset to first page when limit changes
      this.fetchLedger();
    },
    async openPendingDialog() {
      this.pendingDialog = true;
      this.pendingSearch = "";
      this.clearPendingSelection();
      await this.ensurePendingInvoicesLoaded(true);
    },
    statusColor(status) {
      return (
        {
          UNPAID: "red darken-1",
          PARTIAL: "orange darken-2",
          OVERPAID: "purple",
        }[status] || "grey"
      );
    },
    goToReceipt() {
      this.pendingDialog = false;
      this.$router.push({
        name: "addReceipt",
        query: { customerId: this.customerLedger?.customer?.id },
      });
    },
    settleSelectedInvoices() {
      if (!this.hasPendingSelection) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Please select at least one invoice",
          color: "warning",
        });
        return;
      }

      // Store selected invoices in sessionStorage for AddReceipt to consume
      const selectedData = {
        customerId: this.customerLedger?.customer?.id,
        selectedInvoices: this.selectedPendingInvoices.map((inv) => ({
          invoiceId: inv.invoiceno,
          invoiceno: inv.invoiceno,
          invoiceDate: inv.invoiceDate,
          pendingAmount: Number(inv.pendingAmount),
          openingAmount: Number(inv.openingAmount),
        })),
        totalPending: this.pendingSelectedSummary.totalPending,
      };

      window.sessionStorage.setItem(
        "pendingInvoicesToSettle",
        JSON.stringify(selectedData),
      );

      // Close dialog and navigate
      this.pendingDialog = false;
      this.$router.push({
        name: "addReceipt",
        query: { customerId: this.customerLedger?.customer?.id },
      });
    },
  },
  mounted() {
    this.fetchLedger();
  },
};
</script>

<style scoped>
.highlighted-row {
  background-color: #e3f2fd !important;
}

.ledger-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.ledger-toolbar__title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.4;
}

.ledger-toolbar__section,
.ledger-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.ledger-toolbar__toggle {
  flex-shrink: 0;
}

.ledger-toolbar__field {
  min-width: 160px;
  max-width: 180px;
}

.ledger-toolbar__year {
  max-width: 170px;
}

.ledger-toolbar__action-btn {
  flex-shrink: 0;
}

@media (min-width: 960px) {
  .ledger-toolbar__actions {
    justify-content: flex-end;
  }
}

@media (max-width: 959px) {
  .ledger-toolbar {
    padding: 12px;
  }

  .ledger-toolbar__toggle,
  .ledger-toolbar__field,
  .ledger-toolbar__action-btn {
    width: 100%;
    max-width: none;
  }

  .ledger-toolbar__toggle {
    display: flex;
  }

  .ledger-toolbar__toggle .v-btn {
    flex: 1 1 50%;
  }
}
</style>
