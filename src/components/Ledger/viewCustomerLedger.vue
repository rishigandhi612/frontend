<template>
  <v-container fluid>
    <!-- hidden pdf generator instance -->
    <LedgerPdf
      ref="ledgerPdf"
      :ledger="ledgerItems"
      :summary="summary"
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
          :item-class="getRowClass"
          :page.sync="page"
          :items-per-page.sync="limit"
          :server-items-length="customerLedger?.pagination?.total || 0"
          @update:page="onPageChange"
          @update:items-per-page="onLimitChange"
          :footer-props="{
            showFirstLastPage: true,
            firstIcon: 'mdi-arrow-collapse-left',
            lastIcon: 'mdi-arrow-collapse-right',
          }"
        >
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title class="font-weight-bold"
                >Ledger Entries</v-toolbar-title
              >
              <v-spacer />
              <v-btn icon @click="refresh" title="Refresh">
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
              <v-btn
                icon
                @click="exportPdf"
                title="Export Ledger PDF"
                class="ml-2"
              >
                <v-icon>mdi-file-pdf-box</v-icon>
              </v-btn>
              <v-btn
                small
                color="orange darken-2"
                dark
                class="ml-2"
                @click="openPendingDialog"
              >
                <v-icon small left>mdi-clock-alert-outline</v-icon>
                Pending Invoices
              </v-btn>
            </v-toolbar>
          </template>

          <template v-slot:[`item.select`]="{ item }">
            <v-checkbox
              :input-value="selected.indexOf(item.referenceId) >= 0"
              @change="toggleSelect(item)"
              hide-details
            />
          </template>

          <template v-slot:[`item.type`]="{ item }">
            <v-chip
              :color="item.type === 'INVOICE' ? '#d32f2f' : '#388e3c'"
              text-color="white"
              small
            >
              {{ item.type }}
            </v-chip>
          </template>

          <template v-slot:[`item.actions`]="{ item }">
            <v-btn
              v-if="item.type === 'INVOICE'"
              icon
              small
              @click="viewInvoice(item.referenceId)"
              title="View Invoice"
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
    <v-dialog v-model="pendingDialog" max-width="860" scrollable>
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
                    Invoices
                  </div>
                  <div class="text-h5 font-weight-bold orange--text darken-2">
                    {{ pendingDialogSummary.count }}
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
                    Bill Amount
                  </div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(pendingDialogSummary.totalBill) }}
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
                    Allocated
                  </div>
                  <div class="text-h6 font-weight-bold green--text">
                    {{ formatCurrency(pendingDialogSummary.totalAllocated) }}
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
                    Pending
                  </div>
                  <div class="text-h6 font-weight-bold red--text darken-1">
                    {{ formatCurrency(pendingDialogSummary.totalPending) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Search + Record Receipt -->
          <v-row dense class="mt-3">
            <v-col cols="12" sm="8">
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
          </v-row>
        </v-card-text>

        <!-- Table -->
        <v-card-text class="pt-3">
          <v-data-table
            :headers="pendingHeaders"
            :items="pendingInvoices"
            :loading="isLoadingBills"
            :search="pendingSearch"
            dense
            class="elevation-1"
            :items-per-page="10"
            :footer-props="{ itemsPerPageOptions: [5, 10, 25, 50] }"
            sort-by="invoiceDate"
            sort-asc
          >
            <!-- Invoice date -->
            <template v-slot:[`item.invoiceDate`]="{ item }">
              {{ formatDate(item.invoiceDate) }}
            </template>

            <!-- Bill amount -->
            <template v-slot:[`item.billAmount`]="{ item }">
              {{ formatCurrency(item.billAmount) }}
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
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import LedgerPdf from "../Printables/LedgerPdf.vue";

export default {
  name: "viewCustomerLedger",
  components: {
    LedgerPdf,
  },
  data() {
    return {
      loading: false,
      error: null,
      selected: [],
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
      pendingHeaders: [
        { text: "Invoice Date", value: "invoiceDate" },
        { text: "Invoice No", value: "invoiceno" },
        { text: "Opening Amount", value: "openingAmount", align: "end" },
        { text: "Allocated", value: "allocatedAmount", align: "end" },
        { text: "Pending", value: "pendingAmount", align: "end" },
      ],
    };
  },
  computed: {
    ...mapGetters("ledger", ["customerLedger"]),
    ...mapGetters("accounting", ["customerBills", "isLoadingBills"]),
    ledgerItems() {
      return this.customerLedger && this.customerLedger.ledger
        ? this.customerLedger.ledger
        : [];
    },
    pendingInvoices() {
      return (this.customerBills || []).filter(
        (inv) => Number(inv.pendingAmount) !== 0,
      );
    },
    pendingDialogSummary() {
      return {
        count: this.pendingInvoices.length,
        totalOpening: this.pendingInvoices.reduce(
          (s, i) => s + Number(i.openingAmount || 0),
          0,
        ),
        totalAllocated: this.pendingInvoices.reduce(
          (s, i) => s + Number(i.allocatedAmount || 0),
          0,
        ),
        totalPending: this.pendingInvoices.reduce(
          (s, i) => s + Number(i.pendingAmount || 0),
          0,
        ),
      };
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
    async exportPdf() {
      try {
        const customerId =
          this.customerLedger?.customer?._id || this.$route.params.id;
        if (!customerId) return;
        await this.$store.dispatch("ledger/fetchCustomerLedger", {
          customerId,
          params: { limit: 100000, page: 1, sortOrder: "asc" },
        });
        if (this.$refs.ledgerPdf) {
          this.$refs.ledgerPdf.generatePdf();
        }
      } catch (e) {
        console.error("Failed to fetch full ledger:", e);
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Unable to fetch full ledger for export",
          color: "error",
        });
      }
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
          this.error =
            "Customer ID not provided in route (use ?customerId=...)";
          this.loading = false;
          return;
        }
        await this.$store.dispatch("ledger/fetchCustomerLedger", {
          customerId,
          params: {
            financialYear: "current",
            sortOrder: "asc",
            page: this.page,
            limit: this.limit,
          },
        });
        // Update total pages from response
        if (this.customerLedger && this.customerLedger.pagination) {
          this.totalPages = this.customerLedger.pagination.totalPages || 1;
        }
      } catch (err) {
        this.error = err.message || "Failed to load ledger";
      } finally {
        this.loading = false;
      }
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
      try {
        const customerId =
          this.customerLedger?.customer?._id || this.$route.params.id;
        await this.$store.dispatch("accounting/fetchCustomerBills", customerId);
      } catch {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Failed to load pending invoices",
          color: "error",
        });
      }
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
        query: { customerId: this.customerLedger?.customer?._id },
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
</style>
