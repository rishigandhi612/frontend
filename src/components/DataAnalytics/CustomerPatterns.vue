<template>
  <v-container fluid class="pa-4">
    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="localFilters.minPurchaseValue"
              label="Min Purchase Value"
              type="number"
              outlined
              dense
              prefix="₹"
              clearable
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="localFilters.limit"
              label="Limit Results"
              type="number"
              outlined
              dense
            />
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

    <!-- Summary -->
    <v-row v-if="summary">
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Total Customers"
          :value="summary.customersAnalyzed"
          value-type="number"
          icon="mdi-account-group"
          color="primary"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Total Purchase Value"
          :value="summary.totalValueAnalyzed"
          value-type="currency"
          icon="mdi-cash-multiple"
          color="success"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Avg Purchase Value"
          :value="averagePurchaseValue"
          value-type="currency"
          icon="mdi-calculator"
          color="info"
          dark
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <stat-card
          title="Repeat Customers"
          :value="repeatCustomers"
          :subtitle="`${repeatPercentage}% of total`"
          value-type="number"
          icon="mdi-account-convert"
          color="warning"
          dark
        />
      </v-col>
    </v-row>

    <!-- Customer Segments -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-chart-pie</v-icon>
            Customer Segments
          </v-card-title>
          <v-card-text>
            <div
              v-for="segment in customerSegments"
              :key="segment.name"
              class="mb-3"
            >
              <div class="d-flex align-center mb-1">
                <v-chip small :color="segment.color" dark class="mr-2">
                  {{ segment.name }}
                </v-chip>
                <span class="text-caption">{{ segment.count }} customers</span>
                <v-spacer></v-spacer>
                <span class="font-weight-bold">
                  {{ formatCurrency(segment.totalValue) }}
                </span>
              </div>
              <v-progress-linear
                :value="segment.percentage"
                :color="segment.color"
                height="20"
                rounded
              >
                <small class="white--text">
                  {{ segment.percentage.toFixed(1) }}%
                </small>
              </v-progress-linear>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Top Customers -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-star</v-icon>
            Top Customers by Value
          </v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item
                v-for="(customer, index) in topCustomers"
                :key="customer.customerId"
              >
                <v-list-item-avatar>
                  <v-avatar :color="getAvatarColor(index)" size="40">
                    <span class="white--text">{{ index + 1 }}</span>
                  </v-avatar>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-medium">
                    {{ customer.customerName }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ customer.totalInvoices }} invoices
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <div class="text-right">
                    <div class="success--text font-weight-bold">
                      {{ formatCurrency(customer.totalPurchaseValue) }}
                    </div>
                    <div class="text-caption">
                      Avg: {{ formatCurrency(customer.averageInvoiceValue) }}
                    </div>
                  </div>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <data-table-wrapper
      title="Customer Purchase Patterns"
      icon="mdi-table-large"
      :headers="headers"
      :items="customerData"
      :loading="loading"
      :sort-by="['totalPurchaseValue']"
      :sort-desc="[true]"
      export-filename="customer-patterns.csv"
      @refresh="fetchData"
    >
      <template v-slot:item="{ item }">
        <tr>
          <td>
            <div class="font-weight-medium">{{ item.customerName }}</div>
          </td>
          <td class="text-right">
            <v-chip small color="primary" outlined>
              {{ item.totalInvoices }}
            </v-chip>
          </td>
          <td class="text-right success--text font-weight-bold">
            {{ formatCurrency(item.totalPurchaseValue) }}
          </td>
          <td class="text-right">
            {{ formatCurrency(item.averageInvoiceValue) }}
          </td>
          <td class="text-right">{{ item.daysSinceLastPurchase }} days ago</td>
          <td class="text-right">{{ item.customerLifetimeDays }} days</td>
        </tr>
      </template>
    </data-table-wrapper>
  </v-container>
</template>

<script>
import analyticsService from "@/services/analyticsService";
import StatCard from "./StatCard.vue";
import DataTableWrapper from "./DataTableWrapper.vue";
import { formatCurrency } from "@/utils/analyticsUtils";

export default {
  name: "CustomerPatterns",
  components: { StatCard, DataTableWrapper },
  data() {
    return {
      loading: false,
      customerData: [],
      summary: null,
      localFilters: {
        minPurchaseValue: null,
        limit: 20,
      },
      headers: [
        { text: "Customer", value: "customerName", sortable: true },
        {
          text: "Invoices",
          value: "totalInvoices",
          sortable: true,
          align: "right",
        },
        {
          text: "Total Purchase",
          value: "totalPurchaseValue",
          sortable: true,
          align: "right",
        },
        {
          text: "Avg Invoice",
          value: "averageInvoiceValue",
          sortable: true,
          align: "right",
        },
        {
          text: "Days Since Last Purchase",
          value: "daysSinceLastPurchase",
          sortable: true,
          align: "right",
        },
        {
          text: "Customer Lifetime (Days)",
          value: "customerLifetimeDays",
          sortable: true,
          align: "right",
        },
      ],
    };
  },
  computed: {
    averagePurchaseValue() {
      if (!this.customerData.length) return 0;
      const total = this.customerData.reduce(
        (sum, c) => sum + (c.totalPurchaseValue || 0),
        0
      );
      return total / this.customerData.length;
    },
    repeatCustomers() {
      return this.customerData.filter((c) => c.totalInvoices > 1).length;
    },
    repeatPercentage() {
      if (!this.summary?.customersAnalyzed) return 0;
      return (
        (this.repeatCustomers / this.summary.customersAnalyzed) *
        100
      ).toFixed(1);
    },
    topCustomers() {
      return [...this.customerData]
        .sort((a, b) => b.totalPurchaseValue - a.totalPurchaseValue)
        .slice(0, 5);
    },
    customerSegments() {
      const segments = [
        { name: "VIP", color: "purple", min: 100000 },
        { name: "Premium", color: "indigo", min: 50000 },
        { name: "Regular", color: "blue", min: 10000 },
        { name: "New", color: "grey", min: 0 },
      ];
      const totalCustomers = this.summary?.customersAnalyzed || 1;
      return segments.map((segment) => {
        const customers = this.customerData.filter(
          (c) => c.totalPurchaseValue >= segment.min
        );
        const totalValue = customers.reduce(
          (sum, c) => sum + c.totalPurchaseValue,
          0
        );
        return {
          ...segment,
          count: customers.length,
          totalValue,
          percentage: (customers.length / totalCustomers) * 100,
        };
      });
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    formatCurrency,
    getAvatarColor(index) {
      const colors = ["purple", "indigo", "blue", "teal", "green"];
      return colors[index % colors.length];
    },
    async fetchData() {
      this.loading = true;
      try {
        const params = { ...this.localFilters };
        const response = await analyticsService.getCustomerPatterns(params);
        this.customerData = response.data || [];
        this.summary = response.summary || null;
      } catch (error) {
        console.error("Error fetching customer patterns:", error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
