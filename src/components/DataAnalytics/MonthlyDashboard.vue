<template>
  <v-container fluid class="pa-4">
    <!-- Filter Controls -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="localFilters.year"
              label="Year"
              type="number"
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-switch
              v-model="localFilters.compareWithLastYear"
              label="Compare with Last Year"
              color="primary"
            ></v-switch>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" block @click="fetchData">
              <v-icon left>mdi-reload</v-icon>
              Load Data
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Year Summary Cards -->
    <v-row v-if="yearSummary">
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Total Revenue"
          :value="yearSummary.totalRevenue"
          value-type="currency"
          :subtitle="`Across ${yearSummary.totalInvoices} invoices`"
          icon="mdi-cash-multiple"
          color="primary"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Total Quantity"
          :value="yearSummary.totalQuantity"
          value-type="number"
          subtitle="Units sold"
          icon="mdi-package-variant"
          color="success"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Total Invoices"
          :value="yearSummary.totalInvoices"
          value-type="number"
          subtitle="Orders processed"
          icon="mdi-file-document-multiple"
          color="info"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Avg Monthly Revenue"
          :value="yearSummary.averageMonthlyRevenue"
          value-type="currency"
          subtitle="Per month average"
          icon="mdi-calculator"
          color="warning"
          dark
        />
      </v-col>
    </v-row>

    <!-- Monthly Revenue Bars -->
    <v-card class="mb-4">
      <v-card-title>
        <v-icon left>mdi-chart-bar</v-icon>
        Monthly Revenue Comparison
      </v-card-title>
      <v-card-text>
        <div v-for="month in monthlyData" :key="month.month" class="mb-3">
          <div class="d-flex align-center mb-1">
            <div class="month-label">{{ month.monthName }}</div>
            <v-spacer></v-spacer>
            <div class="text-subtitle-2 success--text font-weight-bold">
              {{ formatCurrency(month.totalRevenue) }}
            </div>
          </div>
          <v-progress-linear
            :value="getRevenuePercentage(month.totalRevenue)"
            height="25"
            :color="getMonthColor(month.month)"
            rounded
          >
            <small class="white--text"
              >{{ month.totalInvoices }} invoices</small
            >
          </v-progress-linear>
        </div>
      </v-card-text>
    </v-card>

    <!-- Monthly Data Table -->
    <data-table-wrapper
      title="Monthly Performance Summary"
      icon="mdi-table-large"
      :headers="headers"
      :items="monthlyData"
      :loading="loading"
      :items-per-page="12"
      export-filename="monthly-dashboard.csv"
      @refresh="fetchData"
    >
      <template v-slot:item="{ item }">
        <tr>
          <td>
            <v-chip small :color="getMonthColor(item.month)" dark>
              {{ item.monthName }}
            </v-chip>
          </td>
          <td class="text-right success--text font-weight-bold">
            {{ formatCurrency(item.totalRevenue) }}
          </td>
          <td class="text-right">
            {{ formatNumber(item.totalQuantity) }}
          </td>
          <td class="text-right">
            <v-chip small color="primary" outlined>
              {{ item.totalInvoices }}
            </v-chip>
          </td>
          <td class="text-right">
            {{ formatCurrency(item.averageInvoiceValue) }}
          </td>
          <td class="text-center">
            <v-btn icon small color="primary" @click="viewDetails(item)">
              <v-icon small>mdi-eye</v-icon>
            </v-btn>
          </td>
        </tr>
      </template>
    </data-table-wrapper>

    <!-- Width Breakdown Dialog -->
    <v-dialog v-model="detailsDialog" max-width="1000px" scrollable>
      <v-card v-if="selectedMonth">
        <v-card-title class="primary white--text">
          <v-icon left dark>mdi-chart-pie</v-icon>
          <span class="text-h5"
            >{{ selectedMonth.monthName }} {{ localFilters.year }} - Width
            Breakdown</span
          >
          <v-spacer></v-spacer>
          <v-btn icon dark @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <v-card outlined class="text-center pa-3">
                <v-icon color="primary" large>mdi-cash-multiple</v-icon>
                <div class="text-caption text--secondary mt-2">
                  Total Revenue
                </div>
                <div class="text-h6 primary--text font-weight-bold">
                  {{ formatCurrency(selectedMonth.totalRevenue) }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card outlined class="text-center pa-3">
                <v-icon color="success" large>mdi-package-variant</v-icon>
                <div class="text-caption text--secondary mt-2">
                  Total Quantity
                </div>
                <div class="text-h6 success--text font-weight-bold">
                  {{ formatNumber(selectedMonth.totalQuantity) }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card outlined class="text-center pa-3">
                <v-icon color="info" large>mdi-file-document-multiple</v-icon>
                <div class="text-caption text--secondary mt-2">
                  Total Invoices
                </div>
                <div class="text-h6 info--text font-weight-bold">
                  {{ selectedMonth.totalInvoices }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card outlined class="text-center pa-3">
                <v-icon color="warning" large>mdi-calculator</v-icon>
                <div class="text-caption text--secondary mt-2">
                  Avg Invoice Value
                </div>
                <div class="text-h6 warning--text font-weight-bold">
                  {{ formatCurrency(selectedMonth.averageInvoiceValue) }}
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <v-data-table
            :headers="widthHeaders"
            :items="topWidthsByRevenue"
            :items-per-page="10"
            class="elevation-1"
            dense
          >
            <template v-slot:item="{ item }">
              <tr>
                <td>
                  <v-chip small color="grey lighten-2">
                    {{ item.width }}
                  </v-chip>
                </td>
                <td class="text-right font-weight-medium">
                  {{ formatNumber(item.quantity) }}
                </td>
                <td class="text-right">
                  <span
                    :class="
                      item.revenue > 0
                        ? 'success--text font-weight-bold'
                        : 'text--secondary'
                    "
                  >
                    {{ formatCurrency(item.revenue) }}
                  </span>
                </td>
                <td>
                  <v-progress-linear
                    :value="getWidthRevenuePercentage(item.revenue)"
                    height="20"
                    color="success"
                    rounded
                  >
                    <small class="white--text">
                      {{ getWidthRevenuePercentage(item.revenue).toFixed(1) }}%
                    </small>
                  </v-progress-linear>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="detailsDialog = false"
            >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import analyticsService from "@/services/analyticsService";
import StatCard from "./StatCard.vue";
import DataTableWrapper from "./DataTableWrapper.vue";
import {
  formatCurrency,
  formatNumber,
  calculatePercentage,
  getMonthColor,
} from "@/utils/analyticsUtils";

export default {
  name: "MonthlyDashboard",
  components: {
    StatCard,
    DataTableWrapper,
  },
  props: {
    filters: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      loading: false,
      monthlyData: [],
      yearSummary: null,
      detailsDialog: false,
      selectedMonth: null,
      localFilters: {
        year: new Date().getFullYear(),
        compareWithLastYear: false,
      },
      headers: [
        { text: "Month", value: "monthName", sortable: true },
        {
          text: "Revenue",
          value: "totalRevenue",
          sortable: true,
          align: "right",
        },
        {
          text: "Quantity",
          value: "totalQuantity",
          sortable: true,
          align: "right",
        },
        {
          text: "Invoices",
          value: "totalInvoices",
          sortable: true,
          align: "right",
        },
        {
          text: "Avg Invoice",
          value: "averageInvoiceValue",
          sortable: true,
          align: "right",
        },
        { text: "Actions", value: "actions", sortable: false, align: "center" },
      ],
      widthHeaders: [
        { text: "Width", value: "width", sortable: true },
        { text: "Quantity", value: "quantity", sortable: true, align: "right" },
        { text: "Revenue", value: "revenue", sortable: true, align: "right" },
        { text: "% of Total", value: "percentage", sortable: false },
      ],
    };
  },
  computed: {
    maxRevenue() {
      if (!this.monthlyData.length) return 0;
      return Math.max(...this.monthlyData.map((m) => m.totalRevenue || 0));
    },
    topWidthsByRevenue() {
      if (!this.selectedMonth) return [];
      return [...this.selectedMonth.widthBreakdown].sort(
        (a, b) => (b.revenue || 0) - (a.revenue || 0)
      );
    },
  },
  watch: {
    filters: {
      handler() {
        this.fetchData();
      },
      deep: true,
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    formatCurrency,
    formatNumber,
    getMonthColor,

    getRevenuePercentage(revenue) {
      return calculatePercentage(revenue, this.maxRevenue);
    },

    getWidthRevenuePercentage(revenue) {
      if (!this.selectedMonth || !this.selectedMonth.totalRevenue) return 0;
      return calculatePercentage(revenue, this.selectedMonth.totalRevenue);
    },

    viewDetails(month) {
      this.selectedMonth = month;
      this.detailsDialog = true;
    },

    async fetchData() {
      this.loading = true;
      try {
        const params = {
          ...this.filters,
          ...this.localFilters,
        };
        const response = await analyticsService.getMonthlySalesDashboard(
          params
        );
        this.monthlyData = response.monthlyData || [];
        this.yearSummary = response.yearSummary || null;
      } catch (error) {
        console.error("Error fetching monthly dashboard:", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.month-label {
  min-width: 100px;
  font-weight: 500;
}
</style>
