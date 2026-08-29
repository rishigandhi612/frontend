<template>
  <v-container fluid class="outstanding-page pa-3 pa-md-6">
    <v-overlay v-if="loading">
      <v-progress-circular indeterminate color="red"></v-progress-circular>
    </v-overlay>
    <!-- HEADER -->
    <div class="page-header mb-5">
      <div>
        <div class="d-flex align-center mb-1">
          <v-icon color="primary" class="mr-2">mdi-chart-box-outline</v-icon>
          <span class="text-overline primary--text font-weight-bold">
            RECEIVABLES
          </span>
        </div>

        <h1 class="text-h5 text-md-h4 font-weight-bold mb-1">
          Outstanding Report
        </h1>

        <div class="text-body-2 grey--text text--darken-1">
          Track pending invoices, collections and customer balances.
        </div>
      </div>

      <div class="header-actions mt-3 mt-md-0">
        <v-btn
          outlined
          color="primary"
          :loading="loading"
          class="mr-2"
          @click="loadReport"
        >
          <v-icon left>mdi-refresh</v-icon>
          Refresh
        </v-btn>

        <v-btn color="primary" depressed @click="resetFilters">
          <v-icon left>mdi-filter-remove-outline</v-icon>
          Reset
        </v-btn>
      </div>
    </div>

    <!-- FILTER PANEL -->
    <v-card class="filter-card mb-5" elevation="0">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <div class="text-subtitle-1 font-weight-bold">Report Filters</div>
            <div class="text-caption grey--text text--darken-1">
              Choose a period and search your outstanding invoices.
            </div>
          </div>

          <v-chip
            v-if="
              search ||
              filters.startDate !== defaultStartDate ||
              filters.endDate !== defaultEndDate
            "
            small
            outlined
            color="primary"
          >
            Filters applied
          </v-chip>
        </div>

        <v-row dense align="center">
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.startDate"
              type="date"
              label="Start date"
              prepend-inner-icon="mdi-calendar-start"
              outlined
              hide-details
              dense
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.endDate"
              type="date"
              label="End date"
              prepend-inner-icon="mdi-calendar-end"
              outlined
              hide-details
              dense
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              v-model="search"
              label="Search customer / invoice"
              placeholder="Type to search..."
              prepend-inner-icon="mdi-magnify"
              outlined
              hide-details
              dense
              clearable
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-btn-toggle
              v-model="viewMode"
              mandatory
              dense
              class="view-toggle"
              color="primary"
            >
              <v-btn value="customer" class="flex-grow-1">
                <v-icon left small>mdi-account-multiple-outline</v-icon>
                Customer
              </v-btn>

              <v-btn value="oldest" class="flex-grow-1">
                <v-icon left small>mdi-sort-calendar-ascending</v-icon>
                Oldest
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- ERROR -->
    <v-alert
      v-if="error"
      type="error"
      outlined
      dismissible
      class="mb-5"
      @input="error = ''"
    >
      {{ error }}
    </v-alert>

    <!-- SUMMARY -->
    <div v-if="summary" class="summary-grid mb-5">
      <v-card class="metric-card metric-primary" elevation="0">
        <v-card-text>
          <div class="metric-top">
            <div class="metric-icon primary">
              <v-icon color="white">mdi-receipt-text-outline</v-icon>
            </div>

            <span class="metric-label">Total Bills</span>
          </div>

          <div class="metric-value">
            {{ adjustedSummary.totalBills || 0 }}
          </div>

          <div class="metric-description">
            Outstanding invoices in selected period
          </div>
        </v-card-text>
      </v-card>

      <v-card class="metric-card" elevation="0">
        <v-card-text>
          <div class="metric-top">
            <div class="metric-icon info">
              <v-icon color="white">mdi-file-document-outline</v-icon>
            </div>

            <span class="metric-label">Bill Amount</span>
          </div>

          <div class="metric-value">
            ₹{{ formatCurrency(summary.totalBillAmount) }}
          </div>

          <div class="metric-description">Total invoiced value</div>
        </v-card-text>
      </v-card>

      <v-card class="metric-card" elevation="0">
        <v-card-text>
          <div class="metric-top">
            <div class="metric-icon success">
              <v-icon color="white">mdi-cash-check</v-icon>
            </div>

            <span class="metric-label">Allocated</span>
          </div>

          <div class="metric-value success--text">
            ₹{{ formatCurrency(summary.totalAllocated) }}
          </div>

          <div class="metric-description">Amount already allocated</div>
        </v-card-text>
      </v-card>

      <v-card class="metric-card" elevation="0">
        <v-card-text>
          <div class="metric-top">
            <div class="metric-icon warning">
              <v-icon color="white">mdi-cash-minus</v-icon>
            </div>

            <span class="metric-label">Bill Pending</span>
          </div>

          <div class="metric-value warning--text">
            ₹{{ formatCurrency(summary.totalPending) }}
          </div>

          <div class="metric-description">Pending against invoices</div>
        </v-card-text>
      </v-card>

      <v-card class="metric-card" elevation="0">
        <v-card-text>
          <div class="metric-top">
            <div class="metric-icon success">
              <v-icon color="white">mdi-wallet-outline</v-icon>
            </div>

            <span class="metric-label">On Account</span>
          </div>

          <div class="metric-value success--text">
            ₹{{ formatCurrency(adjustedSummary.totalOnAccountApplied) }}
          </div>

          <div class="metric-description">Customer advance available</div>
        </v-card-text>
      </v-card>

      <v-card class="metric-card metric-net" elevation="0">
        <v-card-text>
          <div class="metric-top">
            <div class="metric-icon error">
              <v-icon color="white">mdi-alert-circle-outline</v-icon>
            </div>

            <span class="metric-label">Net Pending</span>
          </div>

          <div class="metric-value error--text">
            ₹{{ formatCurrency(adjustedSummary.netPending) }}
          </div>

          <div class="metric-description">Amount requiring collection</div>
        </v-card-text>
      </v-card>
    </div>

    <!-- LOADING -->
    <v-card v-if="loading && !summary" class="loading-card" elevation="0">
      <v-card-text class="pa-8 text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="42"
          width="4"
          class="mb-4"
        />

        <div class="text-subtitle-1 font-weight-medium">
          Loading outstanding report...
        </div>

        <div class="text-caption grey--text">
          Fetching customers and invoice balances
        </div>
      </v-card-text>
    </v-card>

    <!-- CUSTOMER VIEW -->
    <v-card
      v-else-if="viewMode === 'customer'"
      class="report-card"
      elevation="0"
    >
      <v-card-title class="report-card-header">
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            Outstanding by Customer
          </div>

          <div class="text-caption grey--text text--darken-1">
            {{ customerGroups.length }} customers
            <span v-if="search"> matching "{{ search }}" </span>
          </div>
        </div>

        <v-chip small outlined color="primary">
          {{ rows.length }} invoices
        </v-chip>
      </v-card-title>

      <v-divider />

      <!-- EMPTY -->
      <v-card-text v-if="!customerGroups.length" class="empty-state">
        <v-icon size="48" color="grey lighten-1">
          mdi-file-search-outline
        </v-icon>

        <div class="text-subtitle-1 font-weight-medium mt-3">
          No outstanding records found
        </div>

        <div class="text-body-2 grey--text mt-1">
          Try changing the date range or search term.
        </div>
      </v-card-text>

      <!-- CUSTOMER GROUPS -->
      <v-expansion-panels v-else accordion flat class="customer-panels">
        <v-expansion-panel
          v-for="group in customerGroups"
          :key="group.customerId"
          class="customer-panel"
        >
          <v-expansion-panel-header class="customer-header">
            <div class="customer-summary">
              <div class="customer-avatar">
                <span>
                  {{ getInitials(group.customerName) }}
                </span>
              </div>

              <div class="customer-info">
                <div class="customer-name">
                  {{ group.customerName }}
                  <v-btn
                    color="primary"
                    depressed
                    small
                    icon
                    @click="$router.push(`/ledger/${group.customerId}`)"
                  >
                    <v-icon small> mdi-open-in-new </v-icon>
                  </v-btn>
                </div>

                <!-- <div class="customer-id">
                  {{ group.customerId }}
                </div> -->
              </div>

              <div class="customer-stats">
                <div class="customer-stat">
                  <span class="stat-label">Bills</span>
                  <strong>{{ group.bills.length }}</strong>
                </div>

                <div class="customer-stat hide-mobile">
                  <span class="stat-label">Pending</span>
                  <strong> ₹{{ formatCurrency(group.pendingAmount) }} </strong>
                </div>

                <div class="customer-stat hide-mobile">
                  <span class="stat-label">On Account</span>
                  <strong class="success--text">
                    ₹{{ formatCurrency(group.onAccountApplied) }}
                  </strong>
                </div>

                <div class="customer-stat net-stat">
                  <span class="stat-label">Net Pending</span>
                  <strong class="error--text">
                    ₹{{ formatCurrency(group.netPendingAmount) }}
                  </strong>
                </div>
              </div>
            </div>
          </v-expansion-panel-header>

          <v-expansion-panel-content>
            <!-- MOBILE -->
            <div v-if="$vuetify.breakpoint.smAndDown" class="mobile-bills">
              <v-card
                v-for="bill in group.bills"
                :key="`${group.customerId}-${
                  bill.mongoInvoiceId || bill.invoiceNumber
                }`"
                class="bill-card mb-3"
                outlined
              >
                <v-card-text class="pa-4">
                  <div class="d-flex align-start justify-space-between">
                    <div>
                      <div class="text-caption grey--text">
                        {{ formatDate(bill.invoiceDate) }}
                      </div>

                      <div class="text-subtitle-1 font-weight-bold mt-1">
                        {{ bill.invoiceNumber }}
                      </div>
                    </div>

                    <v-chip small :color="statusColor(bill.status)" dark>
                      {{ bill.status }}
                    </v-chip>
                  </div>

                  <v-divider class="my-3" />

                  <div class="bill-grid">
                    <div>
                      <span>Bill Amount</span>
                      <strong> ₹{{ formatCurrency(bill.billAmount) }} </strong>
                    </div>

                    <div>
                      <span>Allocated</span>
                      <strong>
                        ₹{{ formatCurrency(bill.allocatedAmount) }}
                      </strong>
                    </div>

                    <div>
                      <span>Pending</span>
                      <strong class="error--text">
                        ₹{{ formatCurrency(bill.pendingAmount) }}
                      </strong>
                    </div>

                    <div>
                      <span>On Account</span>
                      <strong class="success--text">
                        ₹{{ formatCurrency(bill.onAccountApplied) }}
                      </strong>
                    </div>
                  </div>

                  <v-divider class="my-3" />

                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <div class="text-caption grey--text">Net Pending</div>

                      <div class="text-subtitle-1 font-weight-bold error--text">
                        ₹{{ formatCurrency(bill.netPendingAmount) }}
                      </div>
                    </div>

                    <v-btn
                      color="primary"
                      depressed
                      small
                      @click="$router.push(`/invoice/${bill.mongoInvoiceId}`)"
                    >
                      View Invoice
                      <v-icon right small> mdi-arrow-right </v-icon>
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- DESKTOP -->
            <v-data-table
              v-else
              :headers="headers"
              :items="group.bills"
              :items-per-page="10"
              dense
              class="elevation-0"
              :footer-props="{
                'items-per-page-options': [5, 10, 15, 20],
                showFirstLastPage: true,
              }"
            >
              <template v-slot:[`item.invoiceDate`]="{ item }">
                {{ formatDate(item.invoiceDate) }}
              </template>

              <template v-slot:[`item.billAmount`]="{ item }">
                <span class="font-weight-medium">
                  ₹{{ formatCurrency(item.billAmount) }}
                </span>
              </template>

              <template v-slot:[`item.allocatedAmount`]="{ item }">
                ₹{{ formatCurrency(item.allocatedAmount) }}
              </template>

              <template v-slot:[`item.pendingAmount`]="{ item }">
                <span class="error--text font-weight-medium">
                  ₹{{ formatCurrency(item.pendingAmount) }}
                </span>
              </template>

              <template v-slot:[`item.onAccountApplied`]="{ item }">
                <span class="success--text">
                  ₹{{ formatCurrency(item.onAccountApplied) }}
                </span>
              </template>

              <template v-slot:[`item.netPendingAmount`]="{ item }">
                <span class="error--text font-weight-bold">
                  ₹{{ formatCurrency(item.netPendingAmount) }}
                </span>
              </template>

              <template v-slot:[`item.status`]="{ item }">
                <v-chip :color="statusColor(item.status)" small dark>
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:[`item.action`]="{ item }">
                <v-btn
                  icon
                  color="primary"
                  @click="$router.push(`/invoice/${item.mongoInvoiceId}`)"
                >
                  <v-icon> mdi-open-in-new </v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>

    <!-- OLDEST FIRST VIEW -->
    <v-card v-else class="report-card" elevation="0">
      <v-card-title class="report-card-header">
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            Oldest Outstanding Invoices
          </div>

          <div class="text-caption grey--text text--darken-1">
            Prioritized from oldest to newest
          </div>
        </div>

        <v-chip small outlined color="primary">
          {{ oldestFirstRows.length }} invoices
        </v-chip>
      </v-card-title>

      <v-divider />

      <!-- MOBILE -->
      <div v-if="$vuetify.breakpoint.smAndDown" class="pa-3">
        <v-card
          v-for="item in oldestFirstRows"
          :key="item.mongoInvoiceId || item.invoiceNumber"
          class="bill-card mb-3"
          outlined
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between">
              <div class="pr-2">
                <div class="text-caption grey--text">
                  {{ formatDate(item.invoiceDate) }}
                </div>

                <div class="text-subtitle-1 font-weight-bold mt-1">
                  {{ item.invoiceNumber }}
                </div>

                <div class="text-body-2 mt-1">
                  {{ item.customerName }}
                </div>

                <div class="text-caption grey--text">
                  {{ item.customerId }}
                </div>
              </div>

              <v-chip small :color="statusColor(item.status)" dark>
                {{ item.status }}
              </v-chip>
            </div>

            <v-divider class="my-3" />

            <div class="bill-grid">
              <div>
                <span>Bill Amount</span>
                <strong> ₹{{ formatCurrency(item.billAmount) }} </strong>
              </div>

              <div>
                <span>Allocated</span>
                <strong> ₹{{ formatCurrency(item.allocatedAmount) }} </strong>
              </div>

              <div>
                <span>Pending</span>
                <strong class="error--text">
                  ₹{{ formatCurrency(item.pendingAmount) }}
                </strong>
              </div>

              <div>
                <span>On Account</span>
                <strong class="success--text">
                  ₹{{ formatCurrency(item.onAccountApplied) }}
                </strong>
              </div>
            </div>

            <v-divider class="my-3" />

            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption grey--text">Net Pending</div>

                <div class="text-subtitle-1 font-weight-bold error--text">
                  ₹{{ formatCurrency(item.netPendingAmount) }}
                </div>
              </div>

              <v-btn
                color="primary"
                depressed
                small
                @click="$router.push(`/invoice/${item.mongoInvoiceId}`)"
              >
                View Invoice
                <v-icon right small> mdi-arrow-right </v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <div v-if="!oldestFirstRows.length" class="empty-state">
          <v-icon size="48" color="grey lighten-1">
            mdi-file-search-outline
          </v-icon>

          <div class="text-subtitle-1 font-weight-medium mt-3">
            No outstanding records found
          </div>
        </div>
      </div>

      <!-- DESKTOP -->
      <v-data-table
        v-else
        :headers="oldestFirstRowsheaders"
        :items="oldestFirstRows"
        :search="search"
        :loading="loading"
        :items-per-page="25"
        class="elevation-0"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20, 25],
          showFirstLastPage: true,
        }"
      >
        <template v-slot:[`item.customerName`]="{ item }">
          <div class="font-weight-medium">
            {{ item.customerName }}
          </div>

          <div class="text-caption grey--text">
            {{ item.customerId }}
          </div>
        </template>

        <template v-slot:[`item.invoiceDate`]="{ item }">
          {{ formatDate(item.invoiceDate) }}
        </template>

        <template v-slot:[`item.billAmount`]="{ item }">
          ₹{{ formatCurrency(item.billAmount) }}
        </template>

        <template v-slot:[`item.allocatedAmount`]="{ item }">
          ₹{{ formatCurrency(item.allocatedAmount) }}
        </template>

        <template v-slot:[`item.pendingAmount`]="{ item }">
          <span class="error--text font-weight-medium">
            ₹{{ formatCurrency(item.pendingAmount) }}
          </span>
        </template>

        <template v-slot:[`item.onAccountApplied`]="{ item }">
          <span class="success--text">
            ₹{{ formatCurrency(item.onAccountApplied) }}
          </span>
        </template>

        <template v-slot:[`item.netPendingAmount`]="{ item }">
          <span class="error--text font-weight-bold">
            ₹{{ formatCurrency(item.netPendingAmount) }}
          </span>
        </template>

        <template v-slot:[`item.status`]="{ item }">
          <v-chip :color="statusColor(item.status)" small dark>
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:[`item.action`]="{ item }">
          <v-btn
            icon
            color="primary"
            @click="$router.push(`/invoice/${item.mongoInvoiceId}`)"
          >
            <v-icon> mdi-open-in-new </v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "OutstandingReport",

  data() {
    return {
      loading: false,
      error: "",
      search: "",

      viewMode: "customer",

      defaultStartDate: "2025-01-01",
      defaultEndDate: "2026-12-31",

      filters: {
        startDate: "2025-01-01",
        endDate: "2026-12-31",
      },

      headers: [
        {
          text: "Invoice Date",
          value: "invoiceDate",
        },
        {
          text: "Invoice",
          value: "invoiceNumber",
        },
        {
          text: "Bill Amount",
          value: "billAmount",
          align: "right",
        },
        {
          text: "Allocated",
          value: "allocatedAmount",
          align: "right",
        },
        {
          text: "Bill Pending",
          value: "pendingAmount",
          align: "right",
        },
        {
          text: "On Account",
          value: "onAccountApplied",
          align: "right",
        },
        {
          text: "Net Pending",
          value: "netPendingAmount",
          align: "right",
        },
        {
          text: "Status",
          value: "status",
        },
        {
          text: "",
          value: "action",
          sortable: false,
          align: "center",
        },
      ],

      oldestFirstRowsheaders: [
        {
          text: "Invoice Date",
          value: "invoiceDate",
        },
        {
          text: "Customer",
          value: "customerName",
        },
        {
          text: "Invoice",
          value: "invoiceNumber",
        },
        {
          text: "Bill Amount",
          value: "billAmount",
          align: "right",
        },
        {
          text: "Allocated",
          value: "allocatedAmount",
          align: "right",
        },
        {
          text: "Bill Pending",
          value: "pendingAmount",
          align: "right",
        },
        {
          text: "On Account",
          value: "onAccountApplied",
          align: "right",
        },
        {
          text: "Net Pending",
          value: "netPendingAmount",
          align: "right",
        },
        {
          text: "Status",
          value: "status",
        },
        {
          text: "",
          value: "action",
          sortable: false,
          align: "center",
        },
      ],
    };
  },

  computed: {
    ...mapGetters("customers", ["allCustomers"]),
    ...mapGetters("ledger", ["outstandingReport", "onAccountByCustomer"]),

    summary() {
      return this.outstandingReport?.summary || null;
    },

    adjustedSummary() {
      return {
        ...(this.summary || {}),

        totalOnAccountApplied: this.customerGroups.reduce(
          (sum, group) => sum + Number(group.onAccountApplied || 0),
          0,
        ),

        netPending: this.customerGroups.reduce(
          (sum, group) => sum + Number(group.netPendingAmount || 0),
          0,
        ),
      };
    },

    customerMap() {
      return (this.allCustomers || []).reduce((map, customer) => {
        const id = customer._id || customer.id || customer.customerId;

        if (id) {
          map[id] = customer;
        }

        return map;
      }, {});
    },

    rows() {
      const data = this.outstandingReport?.data || [];

      const rowsByCustomer = data.reduce((acc, row) => {
        const key = row.customerId || "unknown";

        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push(row);

        return acc;
      }, {});

      return Object.values(rowsByCustomer).flatMap((customerRows) => {
        const sortedRows = [...customerRows].sort(
          (a, b) => new Date(a.invoiceDate || 0) - new Date(b.invoiceDate || 0),
        );

        const customerId = sortedRows[0]?.customerId;

        const onAccount = Number(
          this.onAccountByCustomer?.[customerId]?.onAccount || 0,
        );

        let remainingOnAccount = onAccount;

        return sortedRows.map((row) => {
          const customer = this.customerMap[row.customerId] || {};

          const pendingAmount = Number(row.pendingAmount || 0);

          const onAccountApplied = Math.min(
            pendingAmount,
            Math.max(remainingOnAccount, 0),
          );

          remainingOnAccount -= onAccountApplied;

          return {
            ...row,

            pendingAmount,

            onAccountApplied,

            netPendingAmount: pendingAmount - onAccountApplied,

            customerOnAccount: onAccount,

            customerName:
              customer.name || row.customerName || "Unknown Customer",
          };
        });
      });
    },

    filteredRows() {
      const term = (this.search || "").toLowerCase().trim();

      if (!term) {
        return this.rows;
      }

      return this.rows.filter((row) => {
        return [row.invoiceNumber, row.customerName, row.customerId, row.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      });
    },

    oldestFirstRows() {
      return [...this.filteredRows].sort(
        (a, b) => new Date(a.invoiceDate || 0) - new Date(b.invoiceDate || 0),
      );
    },

    customerGroups() {
      const groups = this.filteredRows.reduce((acc, row) => {
        const key = row.customerId || "unknown";

        if (!acc[key]) {
          acc[key] = {
            customerId: key,
            customerName: row.customerName,
            bills: [],
            billAmount: 0,
            pendingAmount: 0,
            onAccountApplied: 0,
            netPendingAmount: 0,
          };
        }

        acc[key].bills.push(row);

        acc[key].billAmount += Number(row.billAmount || 0);

        acc[key].pendingAmount += Number(row.pendingAmount || 0);

        acc[key].onAccountApplied += Number(row.onAccountApplied || 0);

        acc[key].netPendingAmount += Number(row.netPendingAmount || 0);

        return acc;
      }, {});

      return Object.values(groups)
        .map((group) => ({
          ...group,

          bills: group.bills.sort(
            (a, b) =>
              new Date(a.invoiceDate || 0) - new Date(b.invoiceDate || 0),
          ),
        }))
        .sort((a, b) => a.customerName.localeCompare(b.customerName));
    },
  },

  created() {
    this.loadReport();
  },

  methods: {
    async loadReport() {
      this.loading = true;
      this.error = "";

      try {
        await Promise.all([
          this.$store.dispatch("customers/fetchCustomers"),

          this.$store.dispatch("ledger/fetchOutstandingReport", {
            ...this.filters,
            page: 1,
            limit: 500000,
          }),
        ]);
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          error.message ||
          "Failed to load outstanding report.";
      } finally {
        this.loading = false;
      }
    },

    resetFilters() {
      this.filters.startDate = this.defaultStartDate;

      this.filters.endDate = this.defaultEndDate;

      this.search = "";

      this.loadReport();
    },

    formatCurrency(value) {
      return Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      });
    },

    formatDate(value) {
      if (!value) {
        return "-";
      }

      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },

    getInitials(name) {
      if (!name) {
        return "?";
      }

      return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
    },

    statusColor(status) {
      if (status === "UNPAID") {
        return "error";
      }

      if (status === "PARTIAL") {
        return "warning";
      }

      if (status === "OVERPAID") {
        return "success";
      }

      return "grey";
    },
  },
};
</script>

<style scoped>
.outstanding-page {
  background: #f7f8fc;
  min-height: 100vh;
}

/* HEADER */

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
}

/* FILTER */

.filter-card {
  border: 1px solid #e4e7ec;
  border-radius: 16px !important;
  background: #ffffff;
}

.view-toggle {
  display: flex;
  width: 100%;
}

.view-toggle .v-btn {
  min-width: 0 !important;
}

/* SUMMARY */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  min-height: 154px;
  border: 1px solid #e5e7eb;
  border-radius: 16px !important;
  background: #ffffff;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
}

.metric-net {
  border-color: #ffd4d4;
  background: linear-gradient(145deg, #ffffff 0%, #fff7f7 100%);
}

.metric-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.metric-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon.primary {
  background: rgba(25, 118, 210, 0.1);
}

.metric-icon.info {
  background: rgba(33, 150, 243, 0.1);
}

.metric-icon.success {
  background: rgba(76, 175, 80, 0.1);
}

.metric-icon.warning {
  background: rgba(255, 152, 0, 0.12);
}

.metric-icon.error {
  background: rgba(244, 67, 54, 0.1);
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  color: #667085;
}

.metric-value {
  font-size: 22px;
  line-height: 1.2;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.3px;
}

.metric-description {
  margin-top: 8px;
  font-size: 11px;
  color: #98a2b3;
}

/* REPORT CARD */

.report-card {
  border: 1px solid #e4e7ec;
  border-radius: 16px !important;
  overflow: hidden;
  background: #ffffff;
}

.report-card-header {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* CUSTOMER */

.customer-panels {
  background: transparent !important;
}

.customer-panel {
  border-bottom: 1px solid #eef0f4 !important;
}

.customer-panel:last-child {
  border-bottom: 0 !important;
}

.customer-header {
  min-height: 84px;
}

.customer-summary {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding-right: 12px;
}

.customer-avatar {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eef5ff;
  color: #1976d2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.customer-info {
  min-width: 190px;
  flex: 1;
}

.customer-name {
  font-size: 15px;
  font-weight: 700;
  color: #101828;
}

.customer-id {
  margin-top: 3px;
  font-size: 11px;
  color: #98a2b3;
}

.customer-stats {
  display: flex;
  align-items: center;
  gap: 22px;
}

.customer-stat {
  min-width: 80px;
  text-align: right;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: #98a2b3;
  margin-bottom: 3px;
}

.customer-stat strong {
  display: block;
  font-size: 13px;
}

.net-stat {
  min-width: 110px;
}

/* BILL */

.bill-card {
  border-radius: 14px !important;
  border-color: #e5e7eb !important;
}

.bill-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.bill-grid > div {
  min-width: 0;
}

.bill-grid span {
  display: block;
  font-size: 11px;
  color: #98a2b3;
  margin-bottom: 3px;
}

.bill-grid strong {
  font-size: 13px;
  color: #344054;
}

/* EMPTY */

.empty-state {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #667085;
}

/* LOADING */

.loading-card {
  border-radius: 16px !important;
  border: 1px solid #e4e7ec;
}

/* TABLE */

:deep(.v-data-table) {
  background: transparent !important;
}

:deep(.v-data-table > .v-data-table__wrapper > table > thead > tr > th) {
  background: #fafbfc !important;
  color: #667085 !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

:deep(.v-data-table > .v-data-table__wrapper > table > tbody > tr:hover) {
  background: #fafcff !important;
}

:deep(.v-data-table td) {
  font-size: 13px;
}

:deep(.v-expansion-panel::before) {
  box-shadow: none !important;
}

/* TABLET */

@media (max-width: 1260px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .customer-stats {
    gap: 14px;
  }
}

/* MOBILE */

@media (max-width: 768px) {
  .outstanding-page {
    padding-bottom: 24px !important;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .v-btn {
    flex: 1;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .metric-card {
    min-height: 138px;
  }

  .metric-value {
    font-size: 18px;
  }

  .metric-description {
    display: none;
  }

  .report-card-header {
    min-height: 64px;
  }

  .customer-summary {
    gap: 10px;
  }

  .customer-avatar {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
    border-radius: 10px;
  }

  .customer-info {
    min-width: 0;
  }

  .customer-name {
    font-size: 14px;
  }

  .customer-stats {
    margin-left: auto;
  }

  .customer-stat {
    min-width: auto;
  }

  .hide-mobile {
    display: none;
  }

  .net-stat strong {
    font-size: 12px;
  }

  .view-toggle {
    width: 100%;
  }

  .view-toggle .v-btn {
    flex: 1;
  }
}

@media (max-width: 520px) {
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }

  .metric-card {
    min-height: 128px;
  }

  .metric-top {
    margin-bottom: 10px;
  }

  .metric-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
  }

  .metric-label {
    font-size: 10px;
  }

  .metric-value {
    font-size: 16px;
  }

  .customer-header {
    min-height: 72px;
  }

  .customer-summary {
    padding-right: 0;
  }

  .customer-avatar {
    display: none;
  }

  .customer-id {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .net-stat {
    min-width: 82px;
  }

  .bill-grid {
    gap: 12px;
  }

  .report-card-header {
    padding-left: 14px !important;
    padding-right: 14px !important;
  }
}
</style>
