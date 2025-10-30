<template>
  <v-container fluid class="pa-4">
    <!-- Filter Controls -->
    <v-card class="mb-4 elevation-2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="localFilters.metric"
              :items="metricOptions"
              label="Rank By"
              outlined
              dense
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="localFilters.limit"
              label="Top N Products"
              type="number"
              outlined
              dense
              hide-details
              min="1"
              max="50"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" block @click="fetchData" :loading="loading">
              <v-icon left>mdi-reload</v-icon>
              Load Data
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Summary Stats Row -->
    <v-row class="mb-4" v-if="summaryStats">
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Total Products Analyzed"
          :value="productsData.length"
          icon="mdi-package-variant"
          color="primary"
          value-type="number"
          :decimals="0"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Total Revenue"
          :value="summaryStats.totalRevenue"
          icon="mdi-currency-inr"
          color="success"
          value-type="currency"
          :decimals="0"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Total Quantity Sold"
          :value="summaryStats.totalQuantity"
          icon="mdi-weight-kilogram"
          color="info"
          value-type="number"
          subtitle="Kgs"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Average Price/Kg"
          :value="summaryStats.avgPrice"
          icon="mdi-chart-line"
          color="orange"
          value-type="currency"
        />
      </v-col>
    </v-row>

    <!-- Top 3 Podium -->
    <v-row class="mb-4" v-if="topThree.length > 0">
      <v-col
        cols="12"
        md="4"
        v-for="(product, index) in topThree"
        :key="product.productId"
      >
        <v-card
          :color="getPodiumColor(index)"
          dark
          elevation="8"
          class="podium-card"
        >
          <v-card-text class="text-center">
            <v-avatar
              :color="getPodiumBadgeColor(index)"
              size="80"
              class="mb-3"
            >
              <v-icon x-large>{{ getPodiumIcon(index) }}</v-icon>
            </v-avatar>
            <div class="text-h6 font-weight-bold mb-2">
              {{ product.productName }}
            </div>
            <v-chip dark outlined class="mb-2"> Rank #{{ index + 1 }} </v-chip>
            <div class="text-h4 font-weight-bold mb-1">
              {{ formatMetricValue(product) }}
            </div>
            <div class="text-caption">
              {{ formatNumber(product.totalQuantitySold) }} Kgs sold
            </div>
            <v-divider dark class="my-3"></v-divider>
            <v-row dense>
              <v-col cols="6">
                <div class="text-caption">Revenue</div>
                <div class="font-weight-bold">
                  {{ formatCurrency(product.totalRevenue) }}
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption">Customers</div>
                <div class="font-weight-bold">
                  {{ product.uniqueCustomerCount }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- All Products Table -->
    <data-table-wrapper
      title="Top Performing Products"
      icon="mdi-trophy"
      :headers="headers"
      :items="productsData"
      :loading="loading"
      :sort-by="[sortByField]"
      :sort-desc="[true]"
      export-filename="top-products.csv"
      @refresh="fetchData"
    >
      <template v-slot:item="{ item, index }">
        <tr :class="{ 'yellow lighten-5': index < 3 }">
          <td class="text-center">
            <v-avatar
              :color="getRankColor(index)"
              size="32"
              class="white--text font-weight-bold"
            >
              {{ index + 1 }}
            </v-avatar>
          </td>
          <td>
            <div class="d-flex align-center">
              <v-icon
                v-if="index < 3"
                :color="getPodiumBadgeColor(index)"
                class="mr-2"
              >
                {{ getPodiumIcon(index) }}
              </v-icon>
              <div>
                <div class="font-weight-medium">{{ item.productName }}</div>
              </div>
            </div>
          </td>
          <td class="text-right">
            <v-chip small color="success" outlined>
              {{ formatNumber(item.totalQuantitySold) }} Kgs
            </v-chip>
          </td>
          <td class="text-right success--text font-weight-bold">
            {{ formatCurrency(item.totalRevenue) }}
          </td>
          <td class="text-center">
            {{ formatCurrency(item.averagePrice || 0) }}
          </td>
          <td class="text-center">
            <v-chip small color="primary" outlined>
              {{ item.invoiceCount || 0 }}
            </v-chip>
          </td>
          <td class="text-center">
            <v-chip small color="info" outlined>
              {{ item.uniqueCustomerCount || 0 }}
            </v-chip>
          </td>
          <td>
            <v-progress-linear
              :value="getPercentage(item)"
              :color="getProgressColor(getPercentage(item))"
              height="20"
              rounded
            >
              <small class="white--text">
                {{ getPercentage(item).toFixed(1) }}%
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
import StatCard from "./StatCard.vue";
import {
  formatCurrency,
  formatNumber,
  calculatePercentage,
  getProgressColor,
} from "@/utils/analyticsUtils";

export default {
  name: "TopProducts",
  components: {
    DataTableWrapper,
    StatCard,
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
      productsData: [],
      localFilters: {
        metric: "revenue",
        limit: 10,
      },
      metricOptions: [
        { text: "Revenue", value: "revenue" },
        { text: "Quantity", value: "quantity" },
      ],
      headers: [
        { text: "Rank", value: "rank", sortable: false, align: "center" },
        { text: "Product", value: "productName", sortable: true },
        {
          text: "Quantity (Kgs)",
          value: "totalQuantitySold",
          sortable: true,
          align: "right",
        },
        {
          text: "Revenue",
          value: "totalRevenue",
          sortable: true,
          align: "right",
        },
        {
          text: "Average Price",
          value: "averagePrice",
          sortable: true,
          align: "center",
        },
        {
          text: "Invoices",
          value: "invoiceCount",
          sortable: true,
          align: "center",
        },
        {
          text: "Customers",
          value: "uniqueCustomerCount",
          sortable: true,
          align: "center",
        },
        { text: "Performance", value: "percentage", sortable: false },
      ],
    };
  },
  computed: {
    topThree() {
      return this.productsData.slice(0, 3);
    },
    sortByField() {
      return this.localFilters.metric === "revenue"
        ? "totalRevenue"
        : "totalQuantitySold";
    },
    maxMetricValue() {
      if (!this.productsData.length) return 0;
      const field = this.sortByField;
      return Math.max(...this.productsData.map((item) => item[field] || 0));
    },
    summaryStats() {
      if (!this.productsData.length) return null;

      const totalRevenue = this.productsData.reduce(
        (sum, item) => sum + (item.totalRevenue || 0),
        0
      );
      const totalQuantity = this.productsData.reduce(
        (sum, item) => sum + (item.totalQuantitySold || 0),
        0
      );
      const avgPrice = totalRevenue / totalQuantity || 0;

      return {
        totalRevenue,
        totalQuantity,
        avgPrice,
      };
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

    getPodiumColor(index) {
      const colors = ["amber darken-2", "grey darken-1", "orange darken-3"];
      return colors[index] || "primary";
    },

    getPodiumBadgeColor(index) {
      const colors = [
        "yellow darken-2",
        "grey lighten-1",
        "deep-orange darken-1",
      ];
      return colors[index] || "primary";
    },

    getPodiumIcon(index) {
      const icons = ["mdi-trophy", "mdi-medal", "mdi-trophy-award"];
      return icons[index] || "mdi-star";
    },

    getRankColor(index) {
      if (index === 0) return "amber darken-2";
      if (index === 1) return "grey darken-1";
      if (index === 2) return "orange darken-3";
      return "primary";
    },

    formatMetricValue(product) {
      const metric = this.localFilters.metric;

      if (metric === "revenue") {
        return formatCurrency(product.totalRevenue);
      } else if (metric === "quantity") {
        return formatNumber(product.totalQuantitySold) + " Kgs";
      }
      return "N/A";
    },

    getPercentage(item) {
      const field = this.sortByField;
      const value = item[field] || 0;
      return calculatePercentage(value, this.maxMetricValue);
    },

    async fetchData() {
      this.loading = true;
      try {
        const params = {
          ...this.filters,
          metric: this.localFilters.metric,
          limit: this.localFilters.limit.toString(),
        };
        const response = await analyticsService.getTopProducts(params);

        if (response.success && response.data) {
          this.productsData = response.data;
        } else {
          this.productsData = [];
          console.warn("No data returned from API");
        }
      } catch (error) {
        console.error("Error fetching top products:", error);
        this.productsData = [];
        // Optionally show error notification
        this.$notify?.error?.({
          title: "Error",
          message: "Failed to load top products data",
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.podium-card {
  transition: transform 0.3s;
}

.podium-card:hover {
  transform: translateY(-5px);
}
</style>
