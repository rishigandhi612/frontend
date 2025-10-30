<template>
  <v-container fluid class="pa-4">
    <!-- Filter Controls -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="localFilters.groupBy"
              :items="groupByOptions"
              label="Group By"
              outlined
              dense
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="localFilters.sortBy"
              :items="sortByOptions"
              label="Sort By"
              outlined
              dense
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="localFilters.widthRange"
              label="Width Range (e.g., 100-200)"
              outlined
              dense
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn color="primary" block @click="fetchData">
              <v-icon left>mdi-reload</v-icon>
              Load Data
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Summary Cards -->
    <v-row v-if="summary">
      <v-col cols="12" sm="6" md="4">
        <stat-card
          title="Total Quantity"
          :value="summary.totalQuantity"
          value-type="number"
          icon="mdi-ruler"
          color="primary"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <stat-card
          title="Total Revenue"
          :value="summary.totalRevenue"
          value-type="currency"
          icon="mdi-cash"
          color="success"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <stat-card
          title="Unique Widths"
          :value="summary.uniqueWidths"
          value-type="number"
          icon="mdi-format-columns"
          color="info"
          dark
        />
      </v-col>
    </v-row>

    <!-- Top Width Distribution -->
    <v-card class="mb-4">
      <v-card-title>
        <v-icon left>mdi-chart-bar</v-icon>
        Width Distribution
      </v-card-title>
      <v-card-text>
        <div v-for="item in topWidths" :key="item.width" class="mb-3">
          <div class="d-flex align-center mb-1">
            <v-chip small color="primary" class="mr-2">
              {{ formatWidth(item.width) }}
            </v-chip>
            <span class="text-caption"
              >{{ formatNumber(item.quantity) }} units</span
            >
            <v-spacer />
            <span class="success--text font-weight-bold">
              {{ formatCurrency(item.revenue) }}
            </span>
          </div>
          <v-progress-linear
            :value="getWidthPercentage(item.quantity)"
            :color="getProgressColor(getWidthPercentage(item.quantity))"
            height="25"
            rounded
          >
            <small class="white--text">
              {{ getWidthPercentage(item.quantity).toFixed(1) }}%
            </small>
          </v-progress-linear>
        </div>
      </v-card-text>
    </v-card>

    <!-- Data Table -->
    <data-table-wrapper
      title="Width Analysis Data"
      icon="mdi-table-large"
      :headers="headers"
      :items="widthData"
      :loading="loading"
      :sort-by="['quantity']"
      :sort-desc="[true]"
      export-filename="width-analysis.csv"
    >
      <template v-slot:item="{ item }">
        <tr>
          <td>
            <v-chip small :color="getWidthColor(item.width)">
              {{ formatWidth(item.width) }}
            </v-chip>
          </td>
          <td class="text-right font-weight-bold">
            {{ formatNumber(item.quantity) }}
          </td>
          <td class="text-right success--text font-weight-bold">
            {{ formatCurrency(item.revenue) }}
          </td>
          <td class="text-right">
            {{ formatCurrency(item.averagePrice) }}
          </td>
          <td class="text-right">
            <v-chip small outlined>{{ item.orderCount || 0 }}</v-chip>
          </td>
          <td class="text-left">
            <div class="d-flex flex-wrap">
              <v-chip
                v-for="(prod, idx) in item.productNames"
                :key="idx"
                small
                outlined
                color="deep-purple"
                class="mr-1 mb-1"
              >
                {{ prod }}
              </v-chip>
              <span
                v-if="!item.productNames || !item.productNames.length"
                class="grey--text text-caption"
              >
                No Products Listed
              </span>
            </div>
          </td>
          <td>
            <v-progress-linear
              :value="getWidthPercentage(item.quantity)"
              :color="getProgressColor(getWidthPercentage(item.quantity))"
              height="20"
              rounded
            >
              <small class="white--text">
                {{ getWidthPercentage(item.quantity).toFixed(1) }}%
              </small>
            </v-progress-linear>
          </td>
        </tr>
      </template>
    </data-table-wrapper>
  </v-container>
</template>

<script>
import StatCard from "./StatCard.vue";
import DataTableWrapper from "./DataTableWrapper.vue";
import analyticsService from "@/services/analyticsService";
import {
  formatCurrency,
  formatNumber,
  calculatePercentage,
  getProgressColor,
} from "@/utils/analyticsUtils";

export default {
  name: "WidthAnalysis",
  components: { StatCard, DataTableWrapper },
  data() {
    return {
      loading: false,
      widthData: [],
      summary: null,
      localFilters: {
        groupBy: "month",
        sortBy: "quantity",
        widthRange: "",
      },
      groupByOptions: [
        { text: "By Month", value: "month" },
        { text: "By Quarter", value: "quarter" },
        { text: "By Year", value: "year" },
        { text: "By Week", value: "week" },
      ],
      sortByOptions: [
        { text: "Quantity", value: "quantity" },
        { text: "Width", value: "width" },
        { text: "Revenue", value: "revenue" },
      ],
      headers: [
        { text: "Width", value: "width", sortable: true },
        { text: "Quantity", value: "quantity", sortable: true, align: "right" },
        { text: "Revenue", value: "revenue", sortable: true, align: "right" },
        {
          text: "Avg Price",
          value: "averagePrice",
          sortable: true,
          align: "right",
        },
        { text: "Orders", value: "orderCount", sortable: true, align: "right" },
        { text: "Products", value: "productNames", sortable: false },
        { text: "% of Total", value: "percentage", sortable: false },
      ],
    };
  },
  computed: {
    maxQuantity() {
      return this.widthData.length
        ? Math.max(...this.widthData.map((item) => item.quantity || 0))
        : 0;
    },
    topWidths() {
      return [...this.widthData]
        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        .slice(0, 10);
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    formatCurrency,
    formatNumber,
    getProgressColor,

    formatWidth(width) {
      if (!width || width === 0) return "—";
      return `${width}`;
    },

    getWidthColor(width) {
      const num = parseFloat(width);
      if (isNaN(num) || num <= 0) return "grey";
      if (num < 100) return "blue";
      if (num < 300) return "green";
      if (num < 500) return "orange";
      return "red";
    },

    getWidthPercentage(qty) {
      return calculatePercentage(qty, this.maxQuantity);
    },

    async fetchData() {
      this.loading = true;
      try {
        const params = { ...this.filters, ...this.localFilters };
        const response = await analyticsService.getQuantityByWidth(params);

        // Normalize the API data
        this.widthData = (response.data || []).map((d) => ({
          width: d.width,
          quantity: d.totalQuantity || 0,
          revenue: d.totalRevenue || 0,
          averagePrice: d.averageUnitPrice || 0,
          orderCount: d.invoiceCount || 0,
          productNames: d.productNames || [],
        }));

        this.summary = response.summary || null;
      } catch (err) {
        console.error("Error fetching width analysis:", err);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
