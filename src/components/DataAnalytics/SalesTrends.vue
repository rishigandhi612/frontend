<template>
  <v-container fluid class="pa-4">
    <!-- Filter Controls -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="localFilters.months"
              label="Number of Months"
              type="number"
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="localFilters.groupBy"
              :items="groupByOptions"
              label="Group By"
              outlined
              dense
            ></v-select>
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

    <!-- Trend Summary Cards -->
    <v-row v-if="trendSummary">
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Average Growth"
          :value="trendSummary.avgGrowth"
          value-type="percentage"
          :trend="trendSummary.avgGrowth"
          icon="mdi-trending-up"
          :color="trendSummary.avgGrowth > 0 ? 'success' : 'error'"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Highest Month"
          :value="trendSummary.highestRevenue"
          :subtitle="trendSummary.highestMonth"
          value-type="currency"
          icon="mdi-arrow-up-bold"
          color="primary"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Lowest Month"
          :value="trendSummary.lowestRevenue"
          :subtitle="trendSummary.lowestMonth"
          value-type="currency"
          icon="mdi-arrow-down-bold"
          color="warning"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Total Period Revenue"
          :value="trendSummary.totalRevenue"
          value-type="currency"
          icon="mdi-cash-multiple"
          color="info"
          dark
        />
      </v-col>
    </v-row>

    <!-- Trend Visualization -->
    <v-card class="mb-4">
      <v-card-title>
        <v-icon left>mdi-chart-line</v-icon>
        Sales Trend Analysis
      </v-card-title>
      <v-card-text>
        <div v-for="(item, index) in trendsData" :key="index" class="mb-4">
          <v-row align="center">
            <v-col cols="12" md="2">
              <div class="text-subtitle-1 font-weight-bold">
                {{ item.period }}
              </div>
              <div class="text-caption text--secondary">
                {{ item.date }}
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-h6 success--text font-weight-bold">
                {{ formatCurrency(item.totalRevenue) }}
              </div>
              <div class="text-caption">
                {{ formatNumber(item.totalQuantity) }} Kgs
              </div>
            </v-col>
            <v-col cols="12" md="5">
              <v-progress-linear
                :value="getRevenuePercentage(item.totalRevenue)"
                :color="getMonthColor(index)"
                height="30"
                rounded
              >
                <small class="white--text font-weight-medium">
                  {{ getRevenuePercentage(item.totalRevenue).toFixed(1) }}%
                </small>
              </v-progress-linear>
            </v-col>
            <v-col cols="12" md="2" class="text-right">
              <v-chip small :color="getTrendColor(item.growthRate)" dark>
                <v-icon small left>{{ getTrendIcon(item.growthRate) }}</v-icon>
                {{ formatGrowth(item.growthRate) }}
              </v-chip>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>

    <!-- Detailed Table -->
    <data-table-wrapper
      title="Detailed Trend Data"
      icon="mdi-table-large"
      :headers="headers"
      :items="trendsData"
      :loading="loading"
      :sort-by="['date']"
      :sort-desc="[true]"
      export-filename="sales-trends.csv"
      @refresh="fetchData"
    >
      <template v-slot:item="{ item }">
        <tr>
          <td class="font-weight-medium">{{ item.period }}</td>
          <td class="text-center success--text font-weight-bold">
            {{ formatCurrency(item.totalRevenue) }}
          </td>
          <td class="text-center">
            {{ formatNumber(item.totalQuantity) }} Kgs
          </td>
          <td class="text-center">
            {{ formatCurrency(item.averageInvoiceValue) }}
          </td>
          <td class="text-center">
            <v-chip small :color="getTrendColor(item.growthRate)" dark>
              <v-icon small left>{{ getTrendIcon(item.growthRate) }}</v-icon>
              {{ formatGrowth(item.growthRate) }}
            </v-chip>
          </td>
          <td>
            <v-progress-linear
              :value="Math.abs(item.growthRate || 0)"
              :color="getTrendColor(item.growthRate)"
              height="20"
              rounded
            >
              <small class="white--text">
                {{ Math.abs(item.growthRate || 0).toFixed(1) }}%
              </small>
            </v-progress-linear>
          </td>
        </tr>
      </template>
    </data-table-wrapper>

    <!-- Forecast Section -->
    <v-card v-if="forecast" class="mt-4">
      <v-card-title class="primary white--text">
        <v-icon left dark>mdi-crystal-ball</v-icon>
        Sales Forecast
      </v-card-title>
      <v-card-text class="pt-4">
        <v-alert type="info" outlined>
          <div class="text-subtitle-1 font-weight-bold mb-2">
            Projected Next Period
          </div>
          <v-row>
            <v-col cols="12" md="3">
              <div class="text-caption">Estimated Revenue</div>
              <div class="text-h6 success--text">
                {{ formatCurrency(forecast.nextPeriodEstimate) }}
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-caption">Confidence Level</div>
              <div class="text-h6">
                {{ forecast.confidence }}
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-caption">Based On Periods</div>
              <div class="text-h6">
                {{ forecast.basedOnPeriods }}
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-caption">Growth Trend</div>
              <div
                class="text-h6"
                :class="`${getTrendColor(forecast.trendDirection)}--text`"
              >
                {{ forecast.trendDirection > 0 ? "Upward" : "Downward" }}
              </div>
            </v-col>
          </v-row>
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import analyticsService from "@/services/analyticsService";
import StatCard from "./StatCard.vue";
import DataTableWrapper from "./DataTableWrapper.vue";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  calculatePercentage,
  getTrendIcon,
  getTrendColor,
  getMonthColor,
} from "@/utils/analyticsUtils";

export default {
  name: "SalesTrends",
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
      trendsData: [],
      trendSummary: null,
      forecast: null,
      localFilters: {
        months: 12,
        groupBy: "month",
      },
      groupByOptions: [
        { text: "By Month", value: "month" },
        { text: "By Week", value: "week" },
      ],
      headers: [
        { text: "Period", value: "period", sortable: true },
        {
          text: "Revenue",
          value: "totalRevenue",
          sortable: true,
          align: "center",
        },
        {
          text: "Quantity",
          value: "totalQuantity",
          sortable: true,
          align: "center",
        },
        // { text: "Orders", value: "orderCount", sortable: true, align: "center" },
        {
          text: "Avg Order",
          value: "averageInvoiceValue",
          sortable: true,
          align: "center",
        },
        {
          text: "Growth",
          value: "growthRate",
          sortable: true,
          align: "center",
        },
        { text: "Trend", value: "trend", sortable: false },
      ],
    };
  },
  computed: {
    maxRevenue() {
      if (!this.trendsData.length) return 0;
      return Math.max(...this.trendsData.map((item) => item.totalRevenue || 0));
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
    formatPercentage,
    getTrendIcon,
    getTrendColor,
    getMonthColor,

    getRevenuePercentage(revenue) {
      return calculatePercentage(revenue, this.maxRevenue);
    },

    formatGrowth(growth) {
      if (!growth && growth !== 0) return "N/A";
      const sign = growth > 0 ? "+" : "";
      return `${sign}${formatNumber(growth, 1)}%`;
    },

    async fetchData() {
      this.loading = true;
      try {
        const params = {
          ...this.filters,
          ...this.localFilters,
        };
        const response = await analyticsService.getSalesTrends(params);
        this.trendsData = response.data || [];
        this.trendSummary = response.summary || null;
        this.forecast = response.forecast || null;
      } catch (error) {
        console.error("Error fetching sales trends:", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
