<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <!-- Header Card with Filter Button -->
        <v-card class="mb-4 elevation-3">
          <v-card-title
            class="primary white--text d-flex justify-space-between align-center"
          >
            <div class="d-flex align-center">
              <v-icon left dark size="28">mdi-chart-box-outline</v-icon>
              <span class="text-h5">Analytics Dashboard</span>
            </div>
            <div class="d-flex align-center">
              <!-- Active Filter Indicator -->
              <v-chip
                v-if="hasActiveFilters"
                small
                color="white"
                text-color="primary"
                class="mr-3"
              >
                <v-icon small left>mdi-filter-check</v-icon>
                Filters Active
              </v-chip>
              <!-- Filter Button -->
              <v-btn
                color="white"
                text
                @click="filterDialog = true"
                class="text-none"
              >
                <v-icon left>mdi-filter-variant</v-icon>
                Filters
              </v-btn>
            </div>
          </v-card-title>
        </v-card>

        <!-- Navigation Tabs with Enhanced Design -->
        <v-card class="mb-2 elevation-2">
          <v-tabs
            v-model="activeTab"
            background-color="grey lighten-4"
            color="primary"
            slider-color="primary"
            slider-size="3"
            show-arrows
          >
            <v-tab class="text-none">
              <v-icon left small>mdi-view-dashboard</v-icon>
              Monthly Dashboard
            </v-tab>
            <v-tab class="text-none">
              <v-icon left small>mdi-package-variant</v-icon>
              Product Sales
            </v-tab>
            <v-tab class="text-none">
              <v-icon left small>mdi-ruler</v-icon>
              Width Analysis
            </v-tab>
            <v-tab class="text-none">
              <v-icon left small>mdi-account-group</v-icon>
              Customer Patterns
            </v-tab>
            <v-tab class="text-none">
              <v-icon left small>mdi-trending-up</v-icon>
              Sales Trends
            </v-tab>
            <v-tab class="text-none">
              <v-icon left small>mdi-trophy</v-icon>
              Top Products
            </v-tab>
          </v-tabs>
        </v-card>

        <!-- Tab Content -->
        <v-tabs-items v-model="activeTab" class="transparent">
          <!-- Monthly Dashboard -->
          <v-tab-item>
            <monthly-dashboard :filters="appliedFilters" />
          </v-tab-item>

          <!-- Product Sales -->
          <v-tab-item>
            <product-sales-analytics :filters="appliedFilters" />
          </v-tab-item>

          <!-- Width Analysis -->
          <v-tab-item>
            <width-analysis :filters="appliedFilters" />
          </v-tab-item>

          <!-- Customer Patterns -->
          <v-tab-item>
            <customer-patterns :filters="appliedFilters" />
          </v-tab-item>

          <!-- Sales Trends -->
          <v-tab-item>
            <sales-trends :filters="appliedFilters" />
          </v-tab-item>

          <!-- Top Products -->
          <v-tab-item>
            <top-products :filters="appliedFilters" />
          </v-tab-item>
        </v-tabs-items>
      </v-col>
    </v-row>

    <!-- Filter Dialog -->
    <v-dialog v-model="filterDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="primary white--text">
          <v-icon left dark>mdi-filter-variant</v-icon>
          Filter Options
        </v-card-title>
        <v-card-text class="pt-6">
          <v-row>
            <v-col cols="12">
              <v-subheader class="px-0 font-weight-bold">
                Date Range
              </v-subheader>
            </v-col>
            <v-col cols="12" sm="6">
              <v-menu
                v-model="startDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="290px"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="filters.startDate"
                    label="Start Date"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    clearable
                    outlined
                    dense
                    @click:clear="filters.startDate = null"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="filters.startDate"
                  @input="startDateMenu = false"
                  no-title
                  scrollable
                ></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="6">
              <v-menu
                v-model="endDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="290px"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="filters.endDate"
                    label="End Date"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    clearable
                    outlined
                    dense
                    @click:clear="filters.endDate = null"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="filters.endDate"
                  @input="endDateMenu = false"
                  no-title
                  scrollable
                ></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" v-if="filters.startDate || filters.endDate">
              <v-alert dense outlined type="info" text class="mb-0">
                <div class="d-flex align-center">
                  <v-icon small left>mdi-information</v-icon>
                  <span class="caption">
                    {{ getDateRangeText() }}
                  </span>
                </div>
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn
            text
            color="grey darken-1"
            @click="clearFilters"
            :disabled="!hasActiveFilters"
          >
            <v-icon left small>mdi-filter-off</v-icon>
            Clear All
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn text color="grey darken-1" @click="cancelFilters">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="applyFilters" depressed>
            <v-icon left small>mdi-check</v-icon>
            Apply Filters
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import MonthlyDashboard from "./MonthlyDashboard.vue";
import ProductSalesAnalytics from "./ProductSalesAnalytics.vue";
import WidthAnalysis from "./WidthAnalysis.vue";
import CustomerPatterns from "./CustomerPatterns.vue";
import SalesTrends from "./SalesTrends.vue";
import TopProducts from "./TopProducts.vue";

export default {
  name: "AnalyticsDashboard",
  components: {
    MonthlyDashboard,
    ProductSalesAnalytics,
    WidthAnalysis,
    CustomerPatterns,
    SalesTrends,
    TopProducts,
  },
  data() {
    return {
      activeTab: 0,
      filterDialog: false,
      startDateMenu: false,
      endDateMenu: false,
      filters: {
        startDate: null,
        endDate: null,
      },
      appliedFilters: {},
    };
  },
  computed: {
    hasActiveFilters() {
      return (
        this.appliedFilters.startDate !== null ||
        this.appliedFilters.endDate !== null
      );
    },
  },
  methods: {
    applyFilters() {
      this.appliedFilters = { ...this.filters };
      this.filterDialog = false;
    },
    clearFilters() {
      this.filters = {
        startDate: null,
        endDate: null,
      };
    },
    cancelFilters() {
      this.filters = { ...this.appliedFilters };
      this.filterDialog = false;
    },
    getDateRangeText() {
      if (this.filters.startDate && this.filters.endDate) {
        return `Showing data from ${this.formatDate(
          this.filters.startDate
        )} to ${this.formatDate(this.filters.endDate)}`;
      } else if (this.filters.startDate) {
        return `Showing data from ${this.formatDate(
          this.filters.startDate
        )} onwards`;
      } else if (this.filters.endDate) {
        return `Showing data up to ${this.formatDate(this.filters.endDate)}`;
      }
      return "";
    },
    formatDate(date) {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
};
</script>

<style scoped>
.v-tabs-items {
  background-color: transparent !important;
}
</style>
