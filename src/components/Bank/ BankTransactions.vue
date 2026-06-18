<template>
  <div class="bank-txn-page">
    <div class="col-left">
      <div>
        <v-btn block @click="backToBanks" elevation="0" size="small">
          <v-icon left>mdi-arrow-left</v-icon>
          Back
        </v-btn>
      </div>

      <div class="bank-card">
        <div class="bank-avatar">
          <v-icon size="18" color="#fff">mdi-bank</v-icon>
        </div>
        <div class="bank-name">{{ bankDisplayName }}</div>
        <div class="bank-meta">{{ bankSubtitle }}</div>
        <div class="bank-acc">
          <v-icon size="10" color="var(--color-text-secondary)">
            mdi-credit-card-outline
          </v-icon>
          •••• {{ bankLast4 }}
        </div>
      </div>

      <div class="stat-section">
        <div class="stat-section-title">This period</div>
        <div class="stat-item">
          <span class="stat-lbl">
            <v-icon size="12" color="#1D9E75">mdi-arrow-down-circle</v-icon>
            Receipts
          </span>
          <span class="stat-val val-cr">
            {{ formatCurrency(summaryCards.totalCredit) }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-lbl">
            <v-icon size="12" color="#E24B4A">mdi-arrow-up-circle</v-icon>
            Payments
          </span>
          <span class="stat-val val-db">
            {{ formatCurrency(summaryCards.totalDebit) }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-lbl">
            <v-icon size="12" color="#534AB7">mdi-scale-balance</v-icon>
            Net
          </span>
          <span
            class="stat-val"
            :class="summaryCards.net >= 0 ? 'val-cr' : 'val-db'"
          >
            {{ formatCurrency(summaryCards.net) }}
          </span>
        </div>
        <div class="stat-item stat-divider">
          <span class="stat-lbl">
            <v-icon size="12"> mdi-receipt-text-outline </v-icon>
            Transactions
          </span>
          <span class="stat-val">{{ summaryCards.count }}</span>
        </div>
      </div>

      <div class="period-section">
        <div class="period-title">Date range</div>
        <input
          v-model="startDate"
          class="period-input"
          type="date"
          :max="endDate || undefined"
        />
        <div class="period-arrow">↓</div>
        <input
          v-model="endDate"
          class="period-input"
          type="date"
          :min="startDate || undefined"
        />
        <button
          class="apply-btn"
          type="button"
          :disabled="!canApplyRange || totalsLoading"
          @click="applyDateFilter"
        >
          {{ totalsLoading ? "Loading..." : "Apply range" }}
        </button>
      </div>

      <div class="mini-chart">
        <div class="mini-chart-title">Weekly receipts</div>
        <div class="bars">
          <div
            v-for="bar in weeklyReceiptBars"
            :key="bar.label"
            class="bar-wrap"
          >
            <div
              class="bar"
              :class="{ active: bar.isActive }"
              :style="{ height: `${bar.height}px` }"
              :title="`${bar.label}: ${formatCurrency(bar.value)}`"
            ></div>
            <span class="bar-lbl">{{ bar.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="col-center">
      <v-row align="center">
        <v-col cols="8">
          <v-card-subtitle>Transactions | {{ centerMeta }}</v-card-subtitle>
        </v-col>

        <v-col cols="4">
          <v-text-field
            prepend-icon=" mdi-magnify"
            v-model.trim="search"
            type="text"
            dense
            placeholder="Voucher, customer, UTR…"
          />
        </v-col>
      </v-row>

      <div class="filter-row">
        <button
          class="fchip"
          :class="{ active: typeChip === 'all' }"
          type="button"
          @click="setTypeChip('all')"
        >
          <v-icon size="11">mdi-apps</v-icon>
          All
        </button>
        <button
          class="fchip"
          :class="{
            active: typeChip === 'cr',
            'active-cr': typeChip === 'cr',
          }"
          type="button"
          @click="setTypeChip('cr')"
        >
          <v-icon size="11">mdi-arrow-down-circle</v-icon>
          Receipts
        </button>
        <button
          class="fchip"
          :class="{
            active: typeChip === 'db',
            'active-db': typeChip === 'db',
          }"
          type="button"
          @click="setTypeChip('db')"
        >
          <v-icon size="11">mdi-arrow-up-circle</v-icon>
          Payments
        </button>

        <span class="fsep2">|</span>
        <v-row>
          <v-col cols="4">
            <v-select
              v-model="paymentFilter"
              :items="paymentOptions"
              item-text="text"
              item-value="value"
              label="Payment Method"
              dense
              x-small
              hide-details
              clearable
          /></v-col>
        </v-row>

        <button class="reset-link" type="button" @click="clearFilters">
          Reset
        </button>
      </div>

      <div>
        <!-- Loading -->
        <div v-if="transactionsLoading">
          <v-skeleton-loader
            v-for="index in pageSize"
            :key="index"
            type="table-row"
            class="mb-2"
          />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredTransactions.length === 0"
          class="d-flex flex-column align-center justify-center py-12 text-center"
        >
          <v-icon size="44" color="grey"> mdi-file-search-outline </v-icon>

          <div class="text-h6 mt-3">No transactions found</div>

          <div class="text-body-2 text-medium-emphasis">
            Try adjusting your filters, date range, or search query.
          </div>
        </div>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="pagedTransactions"
          item-key="id"
          mobile-breakpoint="0"
          hide-default-footer
          dense
        >
          <!-- Date -->
          <template v-slot:[`item.voucherDate`]="{ item }">
            <div class="d-flex flex-column">
              <span class="font-weight-bold">
                {{ formatDay(item.voucherDate) }}
              </span>
              <span class="caption grey--text">
                {{ formatMonth(item.voucherDate) }}
              </span>
            </div>
          </template>

          <!-- Voucher -->
          <template v-slot:[`item.voucherId`]="{ item }">
            <div>
              <div class="font-weight-medium">
                {{ item.voucherId || "—" }}
              </div>

              <div v-if="transactionReference(item)" class="caption grey--text">
                {{ referenceLabel(item) }}:
                {{ transactionReference(item) }}
              </div>
            </div>
          </template>
          <!-- customers -->
          <template v-slot:[`item.customer`]="{ item }">
            <p class="font-weight-bold" align="center" justify="center">
              {{
                item.customer ? capitalizeFirstLetter(item.customer.name) : "—"
              }}
            </p>
          </template>
          <!-- Payment Method -->
          <template v-slot:[`item.paymentMethod`]="{ item }">
            <v-chip x-small outlined>
              {{ paymentLabel(item.paymentMethod) }}
            </v-chip>
          </template>

          <!-- Allocations -->
          <template v-slot:[`item.allocations`]="{ item }">
            <v-chip
              v-if="hasAllocationButton(item)"
              small
              pill
              outlined
              @click.stop="openModal(item.id)"
            >
              <v-icon left x-small>
                {{
                  allocationStatus(item) === "full"
                    ? "mdi-check"
                    : allocationStatus(item) === "partial"
                    ? "mdi-clock-outline"
                    : "mdi-circle-outline"
                }}
              </v-icon>

              {{ allocationBadgeText(item) }}
            </v-chip>

            <span v-else>—</span>
          </template>

          <!-- Amount -->
          <template v-slot:[`item.totalAmount`]="{ item }">
            <span
              :class="
                isReceipt(item)
                  ? 'success--text font-weight-bold'
                  : 'error--text font-weight-bold'
              "
            >
              {{ isReceipt(item) ? "+" : "−" }}
              {{ formatCurrency(transactionAmount(item)) }}
            </span>
          </template>

          <!-- Type -->
          <template v-slot:[`item.type`]="{ item }">
            <v-chip
              small
              :color="isReceipt(item) ? 'success' : 'error'"
              outlined
            >
              {{ isReceipt(item) ? "Receipt" : "Payment" }}
            </v-chip>
          </template>
        </v-data-table>
      </div>

      <div v-if="filteredTransactions.length" class="tfooter">
        <div class="foot-info">
          Showing <strong>{{ rangeStart }}–{{ rangeEnd }}</strong> of
          <strong>{{ filteredTransactions.length }}</strong>
        </div>

        <div class="pager">
          <button
            class="pgr"
            type="button"
            :disabled="displayPage <= 1"
            @click="goToPage(1)"
          >
            <v-icon size="12">mdi-page-first</v-icon>
          </button>
          <button
            class="pgr"
            type="button"
            :disabled="displayPage <= 1"
            @click="goToPage(displayPage - 1)"
          >
            <v-icon size="12">mdi-chevron-left</v-icon>
          </button>

          <button
            v-for="page in pageNumbers"
            :key="`page-${page}`"
            class="pgr"
            :class="{ act: page === displayPage, ell: page === '…' }"
            type="button"
            :disabled="page === '…'"
            @click="page !== '…' && goToPage(page)"
          >
            {{ page }}
          </button>

          <button
            class="pgr"
            type="button"
            :disabled="displayPage >= totalPages"
            @click="goToPage(displayPage + 1)"
          >
            <v-icon size="12">mdi-chevron-right</v-icon>
          </button>
          <button
            class="pgr"
            type="button"
            :disabled="displayPage >= totalPages"
            @click="goToPage(totalPages)"
          >
            <v-icon size="12">mdi-page-last</v-icon>
          </button>
        </div>
      </div>
    </div>

    <div class="col-right">
      <div class="right-section">
        <div class="right-title">Actions</div>
        <button class="action-btn primary" type="button" @click="goToReceipt">
          <v-icon size="14">mdi-plus</v-icon>
          New receipt
        </button>
        <button class="action-btn" type="button" @click="refreshTransactions">
          <v-icon size="14">mdi-refresh</v-icon>
          Refresh
        </button>
        <button class="action-btn" type="button" @click="exportTransactions">
          <v-icon size="14">mdi-download</v-icon>
          Export CSV
        </button>
        <button
          class="action-btn"
          type="button"
          :disabled="!canApplyRange || totalsLoading"
          @click="applyDateFilter"
        >
          <v-icon size="14">mdi-chart-bar</v-icon>
          Get totals
        </button>
        <button class="action-btn" type="button" @click="printStatement">
          <v-icon size="14">mdi-printer</v-icon>
          Print statement
        </button>
      </div>

      <div class="note-section">
        <div class="right-title">Notes</div>
        <textarea
          v-model="note"
          class="note"
          rows="4"
          placeholder="Add a note for this bank…"
        ></textarea>
      </div>
    </div>

    <template>
      <v-dialog v-model="showModal" scrollable>
        <v-card v-if="selectedTransaction" class="modal-card" rounded="lg">
          <!-- ── Header ── -->
          <v-card-title class="modal-header pa-0">
            <v-row no-gutters class="pa-5 pb-4">
              <v-col justify="center" align="center">
                <div class="modal-title">
                  Allocations — {{ selectedTransaction.voucherId || "—" }}
                </div>
                <div class="modal-sub">
                  {{ customerName(selectedTransaction) }} ·
                  {{ formatLongDate(selectedTransaction.voucherDate) }}
                </div>
              </v-col>
              <v-col cols="auto" justify="end" align="end">
                <v-btn icon size="x-small" variant="tonal" @click="closeModal">
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-title>

          <!-- ── Summary Strip (4 equal columns) ── -->
          <v-row no-gutters cols="3">
            <v-col align="center" justify="center">
              <div>Total amount</div>
              <div
                class="sum-val"
                :class="isReceipt(selectedTransaction) ? 'val-cr' : 'val-db'"
              >
                {{ formatCurrency(transactionAmount(selectedTransaction)) }}
              </div>
            </v-col>

            <v-col cols="3" align="center" justify="center">
              <div>Method</div>
              <div class="sum-val">
                {{ paymentLabel(selectedTransaction.paymentMethod) }}
              </div>
            </v-col>

            <v-col cols="3" align="center" justify="center">
              <div>
                {{ referenceLabel(selectedTransaction) }}
              </div>
              <div class="sum-val">
                {{ transactionReference(selectedTransaction) || "—" }}
              </div>
            </v-col>

            <v-col cols="3" align="center" justify="center">
              <div>On account</div>
              <div class="sum-val">
                {{ formatCurrency(selectedOnAccountAmount) }}
              </div>
            </v-col>
          </v-row>

          <v-divider />

          <!-- ── Allocation List ── -->
          <v-card-text>
            <v-card-subtitle align="end" justify="end" class="pa-0">
              {{ allocationEntries(selectedTransaction).length }} allocation{{
                allocationEntries(selectedTransaction).length === 1 ? "" : "s"
              }}
            </v-card-subtitle>

            <!-- Empty state -->
            <div
              v-if="allocationEntries(selectedTransaction).length === 0"
              class="empty-state"
            >
              <v-icon size="28" color="grey-darken-1">
                mdi-receipt-text-remove-outline
              </v-icon>
              <div class="mt-2 text-medium-emphasis text-body-2">
                No allocations
              </div>
            </div>

            <!-- Allocation Cards -->
            <v-row align="center" justify="center">
              <v-col
                cols="4"
                v-for="(allocation, index) in allocationEntries(
                  selectedTransaction,
                )"
                :key="allocation.id || `modal-allocation-${index}`"
              >
                <v-card variant="outlined" rounded="lg">
                  <!-- Card Header -->

                  <v-row class="align-center" no-gutters>
                    <v-col cols="3"></v-col>

                    <v-col cols="6" class="text-center">
                      <h3>
                        {{ allocationInvoiceLabel(allocation) }}
                        <v-btn icon>
                          <v-icon
                            color="deep-purple-lighten-2"
                            @click="goToInvoice(allocation)"
                          >
                            mdi-information-outline
                          </v-icon>
                        </v-btn>
                      </h3>
                    </v-col>

                    <v-col cols="3" class="text-right">
                      <v-chip
                        small
                        pill
                        :color="
                          allocationChipColor(allocationStatusText(allocation))
                        "
                        text-color="white"
                      >
                        {{ allocationStatusText(allocation) }}
                      </v-chip>
                    </v-col>
                  </v-row>
                  <!-- Progress Bar -->
                  <template>
                    <v-progress-linear
                      :value="allocationProgress(allocation)"
                    ></v-progress-linear>
                  </template>
                  <!-- Detail Grid (4 equal columns) -->
                  <v-row class="pa-2">
                    <v-col cols="4" align="center" justify="center">
                      <h5>Bill total</h5>
                      <h4>
                        {{
                          isOnAccountAllocation(allocation)
                            ? "—"
                            : formatCurrency(allocation.totalAmount)
                        }}
                      </h4>
                    </v-col>
                    <v-col cols="4" align="center" justify="center">
                      <h5>Allocated</h5>
                      <h4 class="val-nt">
                        {{ formatCurrency(allocation.allocatedAmount) }}
                      </h4>
                    </v-col>

                    <v-col cols="4" align="center" justify="center">
                      <h5>Pending</h5>
                      <h4
                        :class="
                          isOnAccountAllocation(allocation)
                            ? ''
                            : parseAmount(allocation.pendingAmount) > 0
                            ? 'pending-tone'
                            : 'settled-tone'
                        "
                      >
                        {{
                          isOnAccountAllocation(allocation)
                            ? "—"
                            : formatCurrency(allocation.pendingAmount)
                        }}
                      </h4>
                    </v-col>

                    <!-- <v-col cols="3" align="center" justify="center">
                      <h5>Settlement</h5>
                      <h4>
                        {{
                          isOnAccountAllocation(allocation)
                            ? "On account"
                            : `${allocationProgress(allocation)}%`
                        }}
                      </h4>
                    </v-col> -->
                  </v-row>

                  <!-- Note (optional) -->
                  <template v-if="allocation.narration">
                    <v-divider />
                    <v-row no-gutters class="px-4 py-2">
                      <v-col cols="3">
                        <div>Note</div>
                      </v-col>
                      <v-col cols="9">
                        <div class="note-val">
                          {{ allocation.narration }}
                        </div>
                      </v-col>
                    </v-row>
                  </template>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider />

          <!-- ── Footer ── -->
          <v-card-actions class="modal-footer pa-4">
            <v-row no-gutters align="center">
              <!-- Totals -->
              <v-col>
                <v-row no-gutters>
                  <v-col cols="auto" class="mr-6">
                    <div class="mft-lbl">Allocated</div>
                    <div class="mft-val val-nt">
                      {{ formatCurrency(selectedAllocatedAmount) }}
                    </div>
                  </v-col>
                  <v-col cols="auto" class="mr-6">
                    <div class="mft-lbl">Pending</div>
                    <div
                      class="mft-val"
                      :class="
                        selectedPendingAmount > 0
                          ? 'pending-tone'
                          : 'settled-tone'
                      "
                    >
                      {{ formatCurrency(selectedPendingAmount) }}
                    </div>
                  </v-col>
                  <v-col cols="auto">
                    <div class="mft-lbl">On account</div>
                    <div class="mft-val">
                      {{ formatCurrency(selectedOnAccountAmount) }}
                    </div>
                  </v-col>
                </v-row>
              </v-col>

              <!-- Actions -->
              <v-col cols="auto">
                <v-btn
                  variant="tonal"
                  size="small"
                  class="mr-2"
                  @click="closeModal"
                >
                  Close
                </v-btn>
                <v-btn
                  color="deep-purple"
                  size="small"
                  prepend-icon="mdi-download"
                  @click="exportSelectedAllocations"
                >
                  Export
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { exportToCSV } from "@/utils/analyticsUtils";

const PAYMENT_LABELS = {
  NEFT_RTGS: "NEFT/RTGS",
  CHEQUE: "Cheque",
  UPI: "UPI",
  CASH: "Cash",
};

export default {
  name: "BankTransactions",

  props: {
    bankName: { type: String, default: "" },
  },

  data() {
    return {
      startDate: "",
      endDate: "",
      appliedStartDate: "",
      appliedEndDate: "",
      search: "",
      typeChip: "all",
      paymentFilter: "",
      allocationFilter: "",
      currentPage: 1,
      pageSize: 10,
      expandedRows: [],
      selectedTransactionId: null,
      note: "",
      bankLoading: false,
      isHydratingNote: false,
      headers: [
        { text: "Date", value: "voucherDate" },
        { text: "Voucher", value: "voucherId" },
        {
          text: "Customer",
          value: "customer",
          align: "center",
          sortable: false,
        },
        { text: "Method", value: "paymentMethod" },
        {
          text: "Allocations",
          value: "allocations",

          sortable: false,
        },
        { text: "Amount", value: "totalAmount" },
        { text: "Type", value: "type", sortable: false },
      ],
      allocationOptions: [
        { text: "Fully settled", value: "full" },
        { text: "Partial", value: "partial" },
        { text: "Unallocated", value: "none" },
      ],
      paymentOptions: [
        { text: "All methods", value: "" },
        { text: "NEFT/RTGS", value: "NEFT_RTGS" },
        { text: "Cheque", value: "CHEQUE" },
        { text: "UPI", value: "UPI" },
        { text: "Cash", value: "CASH" },
      ],
    };
  },

  computed: {
    ...mapGetters("banks", [
      "bankDetail",
      "transactions",
      "transactionsPagination",
      "transactionsLoading",
      "totals",
      "totalsLoading",
    ]),

    bankId() {
      return this.$route.params.id;
    },

    bankDisplayName() {
      return this.bankDetail?.name || this.bankName || "Bank account";
    },

    bankSubtitle() {
      if (this.bankDetail?.branch?.name) {
        return `${this.bankDetail.branch.name} branch`;
      }
      return this.bankDetail?.ifsc || "Bank account";
    },

    bankLast4() {
      const accountNumber = String(this.bankDetail?.account_no || "");
      return accountNumber ? accountNumber.slice(-4) : "----";
    },

    canApplyRange() {
      return Boolean(this.startDate && this.endDate);
    },

    hasAppliedDateRange() {
      return Boolean(this.appliedStartDate && this.appliedEndDate);
    },

    hasAdvancedFilters() {
      return Boolean(
        this.search ||
          this.typeChip !== "all" ||
          this.paymentFilter ||
          this.allocationFilter,
      );
    },

    allTransactions() {
      return [...(this.transactions || [])].sort((left, right) => {
        const leftTime = new Date(
          left?.voucherDate || left?.createdAt || 0,
        ).getTime();
        const rightTime = new Date(
          right?.voucherDate || right?.createdAt || 0,
        ).getTime();

        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }
        return String(right?.voucherId || "").localeCompare(
          String(left?.voucherId || ""),
        );
      });
    },

    dateScopedTransactions() {
      if (!this.hasAppliedDateRange) {
        return this.allTransactions;
      }

      const start = new Date(`${this.appliedStartDate}T00:00:00`);
      const end = new Date(`${this.appliedEndDate}T23:59:59`);

      return this.allTransactions.filter((txn) => {
        const txnDate = new Date(txn?.voucherDate || txn?.createdAt || 0);
        return txnDate >= start && txnDate <= end;
      });
    },

    filteredTransactions() {
      let list = [...this.dateScopedTransactions];
      const query = this.search.toLowerCase();

      if (query) {
        list = list.filter((txn) => {
          const invoiceNumbers = this.billAllocations(txn)
            .map((allocation) => allocation.bill?.invoiceNumber || "")
            .join(" ");

          return [
            txn?.voucherId,
            txn?.customer?.name,
            txn?.utrNumber,
            txn?.chequeNumber,
            txn?.upiRef,
            txn?.reference,
            txn?.narration,
            txn?.paymentMethod,
            txn?.bankName,
            invoiceNumbers,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        });
      }

      if (this.typeChip === "cr") {
        list = list.filter((txn) => this.isReceipt(txn));
      } else if (this.typeChip === "db") {
        list = list.filter((txn) => !this.isReceipt(txn));
      }

      if (this.paymentFilter) {
        list = list.filter(
          (txn) => String(txn?.paymentMethod || "") === this.paymentFilter,
        );
      }

      if (this.allocationFilter) {
        list = list.filter(
          (txn) => this.allocationStatus(txn) === this.allocationFilter,
        );
      }

      return list;
    },

    totalPages() {
      return Math.max(
        1,
        Math.ceil(this.filteredTransactions.length / this.pageSize),
      );
    },

    displayPage() {
      return Math.min(this.currentPage, this.totalPages);
    },

    pagedTransactions() {
      const start = (this.displayPage - 1) * this.pageSize;
      return this.filteredTransactions.slice(start, start + this.pageSize);
    },

    pageNumbers() {
      const total = this.totalPages;
      const current = this.displayPage;

      if (total <= 7) {
        return Array.from({ length: total }, (_, index) => index + 1);
      }

      const pages = [1];

      if (current > 3) {
        pages.push("…");
      }

      for (
        let page = Math.max(2, current - 1);
        page <= Math.min(total - 1, current + 1);
        page += 1
      ) {
        pages.push(page);
      }

      if (current < total - 2) {
        pages.push("…");
      }

      pages.push(total);
      return pages;
    },

    rangeStart() {
      if (!this.filteredTransactions.length) return 0;
      return (this.displayPage - 1) * this.pageSize + 1;
    },

    rangeEnd() {
      return Math.min(
        this.displayPage * this.pageSize,
        this.filteredTransactions.length,
      );
    },

    summaryCards() {
      if (this.totals && this.hasAppliedDateRange && !this.hasAdvancedFilters) {
        const totalCredit = this.parseAmount(this.totals.totalCredit);
        const totalDebit = this.parseAmount(this.totals.totalDebit);
        return {
          totalCredit,
          totalDebit,
          net: totalCredit - totalDebit,
          count:
            this.totals.count != null
              ? Number(this.totals.count)
              : this.filteredTransactions.length,
        };
      }

      return this.summarizeTransactions(this.filteredTransactions);
    },

    allocationCounts() {
      return this.filteredTransactions.reduce(
        (counts, txn) => {
          counts[this.allocationStatus(txn)] += 1;
          return counts;
        },
        { full: 0, partial: 0, none: 0 },
      );
    },

    centerMeta() {
      return `${this.periodLabel} · ${this.filteredTransactions.length} ${
        this.filteredTransactions.length === 1 ? "entry" : "entries"
      }`;
    },

    periodLabel() {
      if (this.hasAppliedDateRange) {
        return this.formatPeriodLabel(
          this.appliedStartDate,
          this.appliedEndDate,
        );
      }

      const latestDate =
        this.allTransactions[0]?.voucherDate ||
        this.allTransactions[0]?.createdAt;
      if (!latestDate) return "All dates";

      return new Date(latestDate).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    },

    weeklyReceiptBars() {
      const receipts = this.filteredTransactions.filter((txn) =>
        this.isReceipt(txn),
      );
      const latestReceipt =
        receipts[0]?.voucherDate || receipts[0]?.createdAt || null;

      if (!latestReceipt) {
        return Array.from({ length: 5 }, (_, index) => ({
          label: `W${index + 1}`,
          value: 0,
          height: 8,
          isActive: false,
        }));
      }

      const anchor = new Date(latestReceipt);
      const year = anchor.getFullYear();
      const month = anchor.getMonth();
      const buckets = [0, 0, 0, 0, 0];

      receipts.forEach((txn) => {
        const txnDate = new Date(txn?.voucherDate || txn?.createdAt || 0);
        if (txnDate.getFullYear() === year && txnDate.getMonth() === month) {
          const bucketIndex = Math.min(
            4,
            Math.floor((txnDate.getDate() - 1) / 7),
          );
          buckets[bucketIndex] += this.transactionAmount(txn);
        }
      });

      const max = Math.max(...buckets, 1);

      return buckets.map((value, index) => ({
        label: `W${index + 1}`,
        value,
        height: Math.round((value / max) * 52) + 8,
        isActive: value === max && value > 0,
      }));
    },

    selectedTransaction() {
      return this.allTransactions.find(
        (txn) => String(txn?.id) === String(this.selectedTransactionId),
      );
    },

    showModal() {
      return Boolean(this.selectedTransaction);
    },

    selectedAllocatedAmount() {
      return this.allocationEntries(this.selectedTransaction).reduce(
        (sum, allocation) => sum + this.parseAmount(allocation.allocatedAmount),
        0,
      );
    },

    selectedPendingAmount() {
      return this.allocationEntries(this.selectedTransaction)
        .filter((allocation) => !this.isOnAccountAllocation(allocation))
        .reduce(
          (sum, allocation) => sum + this.parseAmount(allocation.pendingAmount),
          0,
        );
    },

    selectedOnAccountAmount() {
      return this.parseAmount(this.selectedTransaction?.onAccountAmount);
    },

    noteStorageKey() {
      return `bank-transactions-note:${this.bankId}`;
    },
  },

  watch: {
    bankId: {
      immediate: true,
      async handler() {
        await this.initializeView();
      },
    },

    search() {
      this.currentPage = 1;
    },
    typeChip() {
      this.currentPage = 1;
    },
    paymentFilter() {
      this.currentPage = 1;
    },
    allocationFilter() {
      this.currentPage = 1;
    },
    note(value) {
      if (this.isHydratingNote) return;
      try {
        window.localStorage.setItem(this.noteStorageKey, value || "");
      } catch (error) {
        console.error("Unable to persist bank note:", error);
      }
    },
  },

  mounted() {
    window.addEventListener("keydown", this.handleEscape);
  },

  beforeDestroy() {
    window.removeEventListener("keydown", this.handleEscape);
  },

  methods: {
    ...mapActions("banks", [
      "fetchBankDetail",
      "fetchTotals",
      "fetchTransactions",
    ]),
    capitalizeFirstLetter(string) {
      if (!string) return "";
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    allocationChipColor(allocationStatus) {
      console.log("allocationstatus", allocationStatus);
      if (allocationStatus === "Settled") {
        console.log("Settled allocation");
        return "green";
      } else if (allocationStatus === "Partial") {
        return "orange";
      } else if (allocationStatus === "none") {
        return "grey-lighten-2";
      } else {
        return "grey-lighten-2";
      }
    },
    async initializeView() {
      this.currentPage = 1;
      this.expandedRows = [];
      this.selectedTransactionId = null;
      this.loadNote();

      await Promise.all([this.loadBankCard(), this.loadTransactions()]);
    },

    async loadBankCard() {
      this.bankLoading = true;
      try {
        await this.fetchBankDetail(this.bankId);
      } catch (error) {
        console.error("Error loading bank detail:", error);
      } finally {
        this.bankLoading = false;
      }
    },

    async loadTransactions() {
      try {
        await this.fetchTransactions({
          bankId: this.bankId,
          page: 1,
          limit: 20,
        });

        const total = Number(this.transactionsPagination?.total || 0);
        if (total > this.transactions.length && total <= 2000) {
          await this.fetchTransactions({
            bankId: this.bankId,
            page: 1,
            limit: total,
          });
        }

        this.initializeDateRange();
      } catch (error) {
        console.error("Error loading bank transactions:", error);
      }
    },

    initializeDateRange() {
      if (!this.allTransactions.length) return;

      if (
        this.startDate &&
        this.endDate &&
        this.appliedStartDate &&
        this.appliedEndDate
      ) {
        return;
      }

      const latestDate = new Date(
        this.allTransactions[0]?.voucherDate ||
          this.allTransactions[0]?.createdAt ||
          Date.now(),
      );

      const monthStart = new Date(
        latestDate.getFullYear(),
        latestDate.getMonth(),
        1,
      );
      const monthEnd = new Date(
        latestDate.getFullYear(),
        latestDate.getMonth() + 1,
        0,
      );

      const start = this.toInputDate(monthStart);
      const end = this.toInputDate(monthEnd);

      this.startDate = start;
      this.endDate = end;
      this.appliedStartDate = start;
      this.appliedEndDate = end;
    },

    async applyDateFilter() {
      if (!this.canApplyRange) return;

      this.appliedStartDate = this.startDate;
      this.appliedEndDate = this.endDate;
      this.currentPage = 1;

      try {
        await this.fetchTotals({
          bankId: this.bankId,
          startDate: this.appliedStartDate,
          endDate: this.appliedEndDate,
        });
      } catch (error) {
        console.error("Error loading bank totals:", error);
      }
    },

    refreshTransactions() {
      this.loadTransactions();
    },

    clearFilters() {
      this.search = "";
      this.typeChip = "all";
      this.paymentFilter = "";
      this.allocationFilter = "";
      this.currentPage = 1;
      this.expandedRows = [];
      this.selectedTransactionId = null;
      this.$store.commit("banks/SET_TOTALS", null);
      this.startDate = "";
      this.endDate = "";
      this.appliedStartDate = "";
      this.appliedEndDate = "";
      this.initializeDateRange();
    },

    setTypeChip(chip) {
      this.typeChip = chip;
    },

    goToPage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
    },

    toggleRow(id) {
      const rowId = String(id);
      if (this.expandedRows.includes(rowId)) {
        this.expandedRows = this.expandedRows.filter((item) => item !== rowId);
        return;
      }

      this.expandedRows = [...this.expandedRows, rowId];
    },

    isRowOpen(id) {
      return this.expandedRows.includes(String(id));
    },

    openModal(id) {
      this.selectedTransactionId = String(id);
    },

    closeModal() {
      this.selectedTransactionId = null;
    },

    handleEscape(event) {
      if (event.key === "Escape") {
        this.closeModal();
      }
    },

    backToBanks() {
      this.$router.push({ name: "bankList" });
    },

    goToReceipt() {
      this.$router.push({
        name: "addReceipt",
        query: { bankId: this.bankId },
      });
    },

    printStatement() {
      window.print();
    },

    exportTransactions() {
      const rows = this.filteredTransactions.map((txn) => ({
        date: this.formatLongDate(txn?.voucherDate),
        voucherId: txn?.voucherId || "",
        customer: txn?.customer?.name || "",
        type: this.isReceipt(txn) ? "Receipt" : "Payment",
        paymentMethod: this.paymentLabel(txn?.paymentMethod),
        amount: this.transactionAmount(txn),
        allocationStatus: this.allocationStatusLabel(
          this.allocationStatus(txn),
        ),
        allocations: this.billAllocations(txn).length,
        onAccountAmount: this.parseAmount(txn?.onAccountAmount),
        reference: this.transactionReference(txn) || "",
        narration: txn?.narration || "",
      }));

      exportToCSV(
        rows,
        `${this.sanitizeFileName(this.bankDisplayName)}_transactions.csv`,
      );
    },

    exportSelectedAllocations() {
      if (!this.selectedTransaction) return;

      const rows = this.allocationEntries(this.selectedTransaction).map(
        (allocation) => ({
          voucherId: this.selectedTransaction?.voucherId || "",
          customer: this.selectedTransaction?.customer?.name || "",
          invoice: this.allocationInvoiceLabel(allocation),
          allocatedAmount: this.parseAmount(allocation?.allocatedAmount),
          billTotal: this.isOnAccountAllocation(allocation)
            ? ""
            : this.parseAmount(allocation?.totalAmount),
          pendingAmount: this.isOnAccountAllocation(allocation)
            ? ""
            : this.parseAmount(allocation?.pendingAmount),
          status: this.allocationStatusText(allocation),
          narration: allocation?.narration || "",
        }),
      );

      exportToCSV(
        rows,
        `${this.sanitizeFileName(
          this.selectedTransaction?.voucherId || "allocations",
        )}.csv`,
      );
    },

    summarizeTransactions(transactions) {
      const summary = transactions.reduce(
        (summary, txn) => {
          const amount = this.transactionAmount(txn);
          if (this.isReceipt(txn)) {
            summary.totalCredit += amount;
          } else {
            summary.totalDebit += amount;
          }
          summary.count += 1;
          return summary;
        },
        { totalCredit: 0, totalDebit: 0, count: 0, net: 0 },
      );

      summary.net = summary.totalCredit - summary.totalDebit;
      return summary;
    },

    customerName(txn) {
      return txn?.customer?.name || "—";
    },

    parseAmount(value) {
      const amount = Number(value);
      return Number.isFinite(amount) ? amount : 0;
    },

    transactionAmount(txn) {
      return this.parseAmount(txn?.totalAmount ?? txn?.amount);
    },

    isReceipt(txn) {
      return String(txn?.type || "").toUpperCase() !== "PAYMENT";
    },

    paymentLabel(method) {
      return PAYMENT_LABELS[method] || method || "—";
    },

    transactionReference(txn) {
      return (
        txn?.utrNumber ||
        txn?.chequeNumber ||
        txn?.upiRef ||
        txn?.reference ||
        ""
      );
    },

    referenceLabel(txn) {
      if (txn?.utrNumber) return "UTR";
      if (txn?.chequeNumber) return "Cheque";
      if (txn?.upiRef) return "UPI";
      return "Ref";
    },

    billAllocations(txn) {
      return (txn?.allocations || []).filter((allocation) => allocation?.bill);
    },

    allocationEntries(txn) {
      if (!txn) return [];

      const entries = [...(txn.allocations || [])];
      if (!entries.length && this.parseAmount(txn.onAccountAmount) > 0) {
        entries.push({
          id: `${txn.id}-on-account`,
          bill: null,
          billId: null,
          allocatedAmount: this.parseAmount(txn.onAccountAmount),
          totalAmount: null,
          pendingAmount: null,
          narration: "On-account (unallocated)",
        });
      }
      return entries;
    },

    isOnAccountAllocation(allocation) {
      return !allocation?.bill && !allocation?.billId;
    },

    allocationStatus(txn) {
      const billAllocations = this.billAllocations(txn);
      const onAccountAmount = this.parseAmount(txn?.onAccountAmount);

      if (!billAllocations.length) {
        return "none";
      }

      if (onAccountAmount > 0) {
        return "partial";
      }

      return billAllocations.every(
        (allocation) => this.parseAmount(allocation?.pendingAmount) <= 0,
      )
        ? "full"
        : "partial";
    },

    allocationStatusLabel(status) {
      if (status === "full") return "Fully settled";
      if (status === "partial") return "Partial";
      return "Unallocated";
    },

    allocationBadgeText(txn) {
      const billCount = this.billAllocations(txn).length;
      if (!billCount) {
        return this.parseAmount(txn?.onAccountAmount) > 0 ? "On account" : "—";
      }
      return `${billCount} bill${billCount === 1 ? "" : "s"}`;
    },

    hasAllocationButton(txn) {
      return this.allocationEntries(txn).length > 0;
    },

    allocationInvoiceLabel(allocation) {
      return (
        allocation?.bill?.invoiceNumber ||
        allocation?.narration ||
        "On-account (unallocated)"
      );
    },

    allocationProgress(allocation) {
      const total = this.parseAmount(allocation?.totalAmount);
      const allocated = this.parseAmount(allocation?.allocatedAmount);

      if (!total) {
        return allocated > 0 ? 100 : 0;
      }

      return Math.max(0, Math.min(100, Math.round((allocated / total) * 100)));
    },

    allocationStatusText(allocation) {
      if (this.isOnAccountAllocation(allocation)) return "On account";
      return this.parseAmount(allocation?.pendingAmount) <= 0
        ? "Settled"
        : "Partial";
    },

    allocationPillClass(allocation) {
      if (this.isOnAccountAllocation(allocation)) return "pill-part";
      return this.parseAmount(allocation?.pendingAmount) <= 0
        ? "pill-ok"
        : "pill-part";
    },

    formatCurrency(value) {
      if (value == null || value === "") return "—";
      const amount = Number(value);
      if (!Number.isFinite(amount)) return "—";

      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);
    },

    formatDay(dateString) {
      if (!dateString) return "—";
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
      });
    },

    formatMonth(dateString) {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
    },

    formatLongDate(dateString) {
      if (!dateString) return "—";
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },

    formatPeriodLabel(start, end) {
      if (!start || !end) return "All dates";

      const startDate = new Date(`${start}T00:00:00`);
      const endDate = new Date(`${end}T00:00:00`);

      if (
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth()
      ) {
        return startDate.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
      }

      return `${startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })} - ${endDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`;
    },

    toInputDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    sanitizeFileName(value) {
      return String(value || "bank")
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
    },

    loadNote() {
      this.isHydratingNote = true;

      try {
        this.note = window.localStorage.getItem(this.noteStorageKey) || "";
      } catch (error) {
        console.error("Unable to load bank note:", error);
        this.note = "";
      } finally {
        this.$nextTick(() => {
          this.isHydratingNote = false;
        });
      }
    },
    goToInvoice(allocation) {
      if (this.isOnAccountAllocation(allocation)) return;

      const billId = allocation?.billId;
      if (!billId) return;

      this.$router.push({ name: "invoiceDetail", params: { id: billId } });
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.bank-txn-page {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 200px;
  min-height: 640px;
  background: var(--color-background-tertiary);
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  color: var(--color-text-primary);
  font-family: "DM Sans", "Segoe UI", sans-serif;
}

.col-left,
.col-right {
  background: var(--color-background-primary);
  display: flex;
  flex-direction: column;
}

.col-left {
  border-right: 0.5px solid var(--color-border-secondary);
}

.col-center {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.col-right {
  border-left: 0.5px solid var(--color-border-secondary);
}

.bank-card,
.stat-section,
.period-section,
.right-section,
.status-section,
.note-section {
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--color-border-secondary);
}

.mini-chart {
  padding: 14px 16px;
  flex: 1;
}

.bank-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e3a8a;
  border-radius: 10px;
  margin-bottom: 10px;
}

.bank-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.bank-meta {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.bank-acc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  background: var(--color-background-secondary);
  border: 0.5px solid var(--color-border-secondary);
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.stat-section-title,
.period-title,
.mini-chart-title,
.right-title {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-tertiary);
  margin-bottom: 10px;
}

.stat-item,
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-item:last-child,
.status-row:last-child {
  margin-bottom: 0;
}

.stat-divider {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 0.5px solid var(--color-border-tertiary);
}

.val-cr {
  color: #1d9e75;
}

.val-db {
  color: #e24b4a;
}

.val-nt {
  color: #534ab7;
}

.period-input,
.fsel,
.note {
  width: 100%;
  background: var(--color-background-secondary);
  border: 0.5px solid var(--color-border-secondary);
  border-radius: 6px;
  color: var(--color-text-primary);
  font: inherit;
  outline: none;
}

.period-input {
  color-scheme: light;
  font-size: 11px;
  padding: 5px 8px;
  margin-bottom: 6px;
}

.period-arrow {
  text-align: center;
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-bottom: 6px;
}

.apply-btn {
  width: 100%;
  border: none;
  border-radius: 6px;
  background: #534ab7;
  color: #fff;
  font: inherit;
  font-size: 12px;
  padding: 6px 0;
  cursor: pointer;
  transition: background 0.15s ease;
}

.apply-btn:hover:not(:disabled) {
  background: #4640a3;
}

.apply-btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 60px;
}

.bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.bar {
  width: 100%;
  background: #cecbf6;
  border-radius: 3px 3px 0 0;
  transition: opacity 0.15s ease;
  cursor: default;
}

.bar.active {
  background: #534ab7;
}

.bar:hover {
  opacity: 0.78;
}

.bar-lbl {
  font-size: 9px;
  color: var(--color-text-tertiary);
}

.center-title {
  font-weight: 500;
  color: var(--color-text-primary);
}

.center-meta {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 8px 14px;
  background: var(--color-background-secondary);
  border-bottom: 0.5px solid var(--color-border-secondary);
}

.fchip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 20px;
  font: inherit;
  font-size: 11px;
  border: 0.5px solid var(--color-border-secondary);
  background: var(--color-background-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.fchip:hover,
.fchip.active {
  background: #eeedfe;
  color: #3c3489;
  border-color: #afa9ec;
}

.fchip.active-cr {
  background: #eaf3de;
  color: #3b6d11;
  border-color: #97c459;
}

.fchip.active-db {
  background: #fcebeb;
  color: #a32d2d;
  border-color: #f09595;
}

.fsep2 {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.fsel {
  width: auto;
  min-width: 118px;
  font-size: 11px;
  padding: 3px 7px;
  cursor: pointer;
}

.reset-link {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #534ab7;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  padding: 3px 0;
}

.twrap {
  flex: 1;
  overflow-x: auto;
}

table.txn {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

col.c-exp {
  width: 32px;
}

col.c-date {
  width: 66px;
}

col.c-vchr {
  width: 120px;
}

col.c-cust {
  width: auto;
}

col.c-pay {
  width: 88px;
}

col.c-alloc {
  width: 78px;
}

col.c-amt {
  width: 104px;
}

col.c-type {
  width: 74px;
}

table.txn thead th {
  padding: 8px 12px;
  text-align: left;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  background: var(--color-background-secondary);
  border-bottom: 0.5px solid var(--color-border-secondary);
  white-space: nowrap;
}

table.txn td {
  padding: 9px 12px;
  vertical-align: middle;
  font-size: 12px;
  color: var(--color-text-primary);
}

.mrow {
  border-bottom: 0.5px solid var(--color-border-tertiary);
  transition: background 0.1s ease;
  cursor: pointer;
}

.mrow:hover,
.mrow.open {
  background: var(--color-background-secondary);
}

.mrow.open {
  border-bottom: none;
}

.exp-cell {
  padding: 9px 6px !important;
  text-align: center;
}

.exp-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 0.5px solid var(--color-border-secondary);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.exp-btn:hover,
.exp-btn.on {
  background: #534ab7;
  color: #fff;
  border-color: #534ab7;
}

.d-day {
  display: block;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
}

.d-mon {
  display: block;
  font-size: 9px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.dp {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dp-strong {
  font-weight: 500;
}

.dr {
  margin-top: 1px;
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.badge,
.badge-pay,
.badge-alloc,
.pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border-radius: 20px;
  font-weight: 500;
  white-space: nowrap;
}

.badge {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
}

.badge-cr {
  background: #eaf3de;
  color: #3b6d11;
}

.badge-db {
  background: #fcebeb;
  color: #a32d2d;
}

.badge-pay {
  background: #e6f1fb;
  color: #0c447c;
  font-size: 10px;
  padding: 2px 6px;
}

.badge-alloc {
  border: none;
  background: #eeedfe;
  color: #3c3489;
  font: inherit;
  font-size: 10px;
  padding: 2px 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.badge-alloc:hover {
  background: #cecbf6;
}

.empty-inline {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.amt {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.amt-cr {
  color: #1d9e75;
}

.amt-db {
  color: #e24b4a;
}

.detail-td {
  padding: 0 !important;
  background: var(--color-background-secondary);
}

.detail-inner {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.2s ease;
}

.detail-inner.on {
  max-height: 420px;
}

.detail-content {
  padding: 10px 12px 10px 44px;
  border-bottom: 0.5px solid var(--color-border-secondary);
}

.detail-empty {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.dtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.dtable th {
  padding: 4px 10px;
  text-align: left;
  color: var(--color-text-secondary);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 0.5px solid var(--color-border-secondary);
}

.dtable td {
  padding: 6px 10px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
  vertical-align: middle;
}

.dtable tr:last-child td {
  border-bottom: none;
}

.progress-col {
  width: 70px;
}

.invoice-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.prog-bg,
.prog2-bg {
  overflow: hidden;
  background: var(--color-border-secondary);
  border-radius: 2px;
}

.prog-bg {
  width: 60px;
  height: 4px;
}

.prog2-bg {
  grid-column: 1 / -1;
  height: 5px;
  margin-top: 6px;
}

.prog-fill,
.prog2-fill {
  height: 100%;
  border-radius: 2px;
  background: #534ab7;
}

.alloc-amount {
  color: #534ab7;
  font-weight: 500;
}

.pending-amount {
  color: var(--color-text-secondary);
}

.pill {
  font-size: 10px;
  padding: 2px 6px;
}

.pill-ok {
  background: #eaf3de;
  color: #3b6d11;
}

.pill-part {
  background: #faeeda;
  color: #854f0b;
}

.view-link {
  border: none;
  background: none;
  color: #534ab7;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.skel-wrap {
  padding: 6px 0;
}

.skel-row {
  display: grid;
  grid-template-columns: 20px 46px 110px minmax(120px, 1fr) 70px 62px 88px 60px;
  gap: 12px;
  align-items: center;
  padding: 11px 12px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
}

.skel-cell {
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--color-background-secondary) 25%,
    var(--color-background-tertiary, #e8edf3) 50%,
    var(--color-background-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skel-exp {
  width: 20px;
}

.skel-date {
  width: 46px;
}

.skel-voucher {
  width: 110px;
}

.skel-customer {
  width: 100%;
}

.skel-method {
  width: 70px;
}

.skel-alloc {
  width: 62px;
}

.skel-amount {
  width: 88px;
}

.skel-type {
  width: 60px;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.empty {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 24px;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.empty-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.tfooter {
  padding: 9px 14px;
  background: var(--color-background-primary);
  border-top: 0.5px solid var(--color-border-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.foot-info {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.foot-info strong {
  color: var(--color-text-primary);
  font-weight: 500;
}

.pager {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pgr {
  min-width: 26px;
  height: 26px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.5px solid var(--color-border-secondary);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.pgr:hover:not(:disabled):not(.ell) {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border-color: #534ab7;
}

.pgr:disabled {
  opacity: 0.3;
  cursor: default;
}

.pgr.act {
  background: #534ab7;
  color: #fff;
  border-color: #534ab7;
}

.pgr.ell {
  border: none;
  background: none;
  cursor: default;
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  border: 0.5px solid var(--color-border-secondary);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:last-child {
  margin-bottom: 0;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-background-secondary);
  border-color: var(--color-border-primary);
}

.action-btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.action-btn.primary {
  background: #534ab7;
  border-color: #534ab7;
  color: #fff;
}

.action-btn.primary:hover {
  background: #4640a3;
}

.status-dot-lbl::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
}

.s-ok::before {
  background: #1d9e75;
}

.s-part::before {
  background: #ba7517;
}

.s-open::before {
  background: #e24b4a;
}

.note {
  resize: none;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 10px;
}

.modal-wrap {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 30;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  padding: 18px;
}

.modal-wrap.on {
  display: flex;
}

.modal {
  width: 520px;
  max-width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background-primary);
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.mhdr {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 0.5px solid var(--color-border-secondary);
}

.mtitle {
  font-size: 14px;
  font-weight: 500;
}

.msub {
  margin-top: 1px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.mclose {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  border: 0.5px solid var(--color-border-secondary);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.mclose:hover {
  background: var(--color-background-secondary);
}

.mmeta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 0.5px solid var(--color-border-secondary);
}

.mcell {
  padding: 10px 18px;
  border-right: 0.5px solid var(--color-border-tertiary);
  border-bottom: 0.5px solid var(--color-border-tertiary);
}

.mcell:nth-child(even) {
  border-right: none;
}

.mcell:nth-last-child(-n + 2) {
  border-bottom: none;
}

.mlbl,
.mft-lbl {
  margin-bottom: 2px;
  font-size: 10px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mval,
.mft-val {
  font-size: 14px;
  font-weight: 500;
}

.mbody {
  max-height: 260px;
  overflow-y: auto;
  padding: 14px 18px;
}

.msec {
  margin-bottom: 10px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-tertiary);
}

.modal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px;
  color: var(--color-text-secondary);
  font-size: 12px;
  text-align: center;
}

.arow-lbl {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.note-val {
  color: var(--color-text-secondary);
  font-weight: 400;
}

.settled-tone {
  color: #1d9e75;
}

.pending-tone {
  color: #ba7517;
}

.mfoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 18px;
  border-top: 0.5px solid var(--color-border-secondary);
}

.mfoot-totals {
  display: flex;
  gap: 18px;
}

.mft-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mfoot-actions {
  display: flex;
  gap: 6px;
}

.btn-sm,
.btn-sm-p {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 5px;
  font: inherit;
  font-size: 11px;
  padding: 5px 12px;
  cursor: pointer;
}

.btn-sm {
  border: 0.5px solid var(--color-border-secondary);
  background: transparent;
  color: var(--color-text-secondary);
}

.btn-sm:hover {
  background: var(--color-background-secondary);
}

.btn-sm-p {
  border: none;
  background: #534ab7;
  color: #fff;
}

.btn-sm-p:hover {
  background: #4640a3;
}

@media (max-width: 1180px) {
  .bank-txn-page {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .col-right {
    grid-column: 1 / -1;
    border-left: none;
    border-top: 0.5px solid var(--color-border-secondary);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .right-section,
  .status-section,
  .note-section {
    border-bottom: none;
  }

  .status-section {
    border-left: 0.5px solid var(--color-border-secondary);
    border-right: 0.5px solid var(--color-border-secondary);
  }
}

@media (max-width: 960px) {
  .bank-txn-page {
    grid-template-columns: 1fr;
  }

  .col-left,
  .col-right {
    border: none;
  }

  .col-left {
    border-bottom: 0.5px solid var(--color-border-secondary);
  }

  .col-right {
    grid-template-columns: 1fr;
    border-top: 0.5px solid var(--color-border-secondary);
  }

  .status-section {
    border-left: none;
    border-right: none;
    border-top: 0.5px solid var(--color-border-secondary);
    border-bottom: 0.5px solid var(--color-border-secondary);
  }

  .reset-link {
    margin-left: 0;
  }

  .mmeta {
    grid-template-columns: 1fr;
  }

  .mcell {
    border-right: none;
  }

  .mcell:last-child {
    border-bottom: none;
  }
}

@media print {
  .col-left,
  .col-right,
  .filter-row,
  .tfooter,
  .modal-wrap {
    display: none !important;
  }

  .bank-txn-page {
    grid-template-columns: 1fr;
    border: none;
    min-height: auto;
  }

  .col-center {
    border: none;
  }
}
</style>
