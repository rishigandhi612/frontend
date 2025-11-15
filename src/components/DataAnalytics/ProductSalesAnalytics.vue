<template>
  <v-container fluid class="pa-4">
    <!-- Filter Controls -->
    <v-card class="mb-4 elevation-2">
      <v-card-title class="primary white--text py-3">
        <v-icon left color="white">mdi-filter-variant</v-icon>
        Filters & Controls
      </v-card-title>
      <v-card-text class="pt-4">
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="localFilters.groupBy"
              :items="groupByOptions"
              label="Group By"
              outlined
              dense
              prepend-inner-icon="mdi-group"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="localFilters.sortBy"
              :items="sortByOptions"
              label="Sort By"
              outlined
              dense
              prepend-inner-icon="mdi-sort"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="localFilters.limit"
              label="Limit Results"
              type="number"
              outlined
              dense
              prepend-inner-icon="mdi-numeric"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn color="primary" block @click="fetchData" large elevation="2">
              <v-icon left>mdi-reload</v-icon>
              Refresh Data
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Summary Cards -->
    <v-row v-if="summary" class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" color="success" dark>
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h4 font-weight-bold mb-1">
                  {{ formatCurrency(summary.totalRevenue) }}
                </div>
                <div class="text-subtitle-2">Total Revenue</div>
              </div>
              <v-avatar size="56" color="rgba(255,255,255,0.2)">
                <v-icon size="32">mdi-cash-multiple</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" color="info" dark>
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h4 font-weight-bold mb-1">
                  {{ formatNumber(summary.totalQuantitySold) }}
                </div>
                <div class="text-subtitle-2">Total Quantity (Kg)</div>
              </div>
              <v-avatar size="56" color="rgba(255,255,255,0.2)">
                <v-icon size="32">mdi-package-variant</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" color="warning" dark>
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h4 font-weight-bold mb-1">
                  {{ formatNumber(summary.productsAnalyzed) }}
                </div>
                <div class="text-subtitle-2">Total Products</div>
              </div>
              <v-avatar size="56" color="rgba(255,255,255,0.2)">
                <v-icon size="32">mdi-tag-multiple</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" color="purple darken-1" dark>
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h4 font-weight-bold mb-1">
                  {{ formatNumber(summary.totalInvoices) }}
                </div>
                <div class="text-subtitle-2">Total Invoices</div>
              </div>
              <v-avatar size="56" color="rgba(255,255,255,0.2)">
                <v-icon size="32">mdi-file-document-multiple</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <data-table-wrapper
      title="Product Sales Details"
      icon="mdi-chart-bar"
      :headers="headers"
      :items="salesData"
      :loading="loading"
      :sort-by="['totalRevenue']"
      :sort-desc="[true]"
      :items-per-page="20"
      export-filename="product-sales-analytics.csv"
      @refresh="fetchData"
    >
      <template v-slot:item="{ item }">
        <tr>
          <td>
            <div class="py-2">
              <v-btn class="font-weight-bold text-subtitle-2 mb-1" text>
                {{ item.productName }}
              </v-btn>
            </div>
          </td>
          <td class="text-center">
            <v-chip small color="blue" dark class="font-weight-medium">
              {{ formatNumber(item.totalQuantitySold) }} Kg
            </v-chip>
          </td>
          <td class="text-center">
            <div class="success--text font-weight-bold text-subtitle-2 mb-1">
              {{ formatCurrency(item.totalRevenue) }}
            </div>
          </td>
          <td class="text-center">
            <v-chip small color="purple" outlined>
              {{ item.invoiceCount }}
            </v-chip>
          </td>
          <td class="text-center">
            <v-chip small color="orange" outlined>
              {{ item.uniqueInvoiceCount }} Invoices
            </v-chip>
          </td>
          <td class="text-center">
            <v-chip small color="purple" outlined>
              {{ item.uniqueCustomerCount }} Customers
            </v-chip>
          </td>

          <td class="text-center">
            <div class="font-weight-medium">
              {{ formatNumber(item.averageQuantityPerInvoice) }} Kg
            </div>
          </td>
          <td class="text-center">
            <v-chip small color="teal" dark>
              ₹{{ formatNumber(item.averageSalePrice) }}/Kg
            </v-chip>
            <div class="text-caption text--secondary mt-1">
              {{ formatNumber(item.minSalePrice) }} -
              {{ formatNumber(item.maxSalePrice) }}
            </div>
          </td>
          <td>
            <v-menu offset-y max-width="400">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  small
                  color="primary"
                  outlined
                  v-bind="attrs"
                  v-on="on"
                  :disabled="
                    !item.widthsSold ||
                    item.widthsSold.length === 0 ||
                    (item.widthsSold.length === 1 && item.widthsSold[0] === 0)
                  "
                >
                  <v-icon small left>mdi-ruler</v-icon>
                  {{ getUniqueWidthCount(item.widthsSold) }} Widths
                </v-btn>
              </template>
              <v-card>
                <v-card-title class="text-subtitle-1 py-2">
                  Available Widths (mm)
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-chip
                    v-for="(width, idx) in getUniqueWidths(item.widthsSold)"
                    :key="idx"
                    small
                    class="ma-1"
                    color="indigo"
                    dark
                  >
                    {{ width }} mm
                  </v-chip>
                </v-card-text>
              </v-card>
            </v-menu>
          </td>
          <td>
            <v-progress-linear
              :value="getRevenuePercentage(item.totalRevenue)"
              :color="getProgressColor(getRevenuePercentage(item.totalRevenue))"
              height="24"
              rounded
              class="elevation-1"
            >
              <small class="white--text font-weight-bold">
                {{ getRevenuePercentage(item.totalRevenue).toFixed(1) }}%
              </small>
            </v-progress-linear>
          </td>
        </tr>
      </template>
    </data-table-wrapper>
  </v-container>
</template>

<script>
import analyticsService from "@/services/analyticsService";
import DataTableWrapper from "./DataTableWrapper.vue";
import {
  formatCurrency,
  formatNumber,
  calculatePercentage,
  getProgressColor,
} from "@/utils/analyticsUtils";

export default {
  name: "ProductSalesAnalytics",
  components: {
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
      salesData: [],
      summary: null,
      localFilters: {
        groupBy: "product",
        sortBy: "revenue",
        limit: 50,
      },
      groupByOptions: [
        { text: "By Product", value: "product" },
        { text: "By Month", value: "month" },
        { text: "By Customer", value: "customer" },
      ],
      sortByOptions: [
        { text: "Revenue", value: "revenue" },
        { text: "Quantity", value: "quantity" },
      ],
      headers: [
        {
          text: "Product Name",
          value: "productName",
          sortable: true,
          width: "200px",
        },
        {
          text: "Total Quantity",
          value: "totalQuantitySold",
          sortable: true,
          align: "center",
        },
        {
          text: "Total Revenue",
          value: "totalRevenue",
          sortable: true,
          align: "center",
        },
        {
          text: "Total Pieces Sold",
          value: "invoiceCount",
          sortable: true,
          align: "center",
        },
        {
          text: "Invoices",
          value: "uniqueInvoiceCount",
          sortable: true,
          align: "center",
        },
        {
          text: "Customers",
          value: "uniqueCustomerCount",
          sortable: true,
          align: "center",
        },
        {
          text: "Avg Qty/Invoice",
          value: "averageQuantityPerInvoice",
          sortable: true,
          align: "center",
        },
        {
          text: "Price Range",
          value: "averageSalePrice",
          sortable: true,
          align: "center",
        },
        { text: "Widths Available", value: "widths", sortable: false },
        { text: "Revenue Share", value: "percentage", sortable: false },
      ],
    };
  },
  computed: {
    maxRevenue() {
      if (!this.salesData.length) return 0;
      return Math.max(...this.salesData.map((item) => item.totalRevenue || 0));
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
    getProgressColor,

    getRevenuePercentage(revenue) {
      return calculatePercentage(revenue, this.maxRevenue);
    },

    getUniqueWidths(widths) {
      if (!widths || widths.length === 0) return [];
      const unique = [...new Set(widths)].filter((w) => w !== 0);
      return unique.sort((a, b) => a - b);
    },

    getUniqueWidthCount(widths) {
      const unique = this.getUniqueWidths(widths);
      return unique.length || 0;
    },

    async fetchData() {
      this.loading = true;
      try {
        const params = {
          ...this.filters,
          ...this.localFilters,
        };
        const response = await analyticsService.getProductSales(params);
        this.salesData = response.data || [];
        this.summary = response.summary || null;
        console.log(
          "Fetched product sales data:",
          this.salesData[0]?.productName
        );
      } catch (error) {
        console.error("Error fetching product sales:", error);
        this.$emit("error", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}
</style>
