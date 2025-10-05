<template>
  <v-container fluid>
    <!-- Header Row -->
    <v-row>
      <v-col md="2" cols="12">
        <v-btn @click="goBack" block color="primary" outlined>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12" class="text-center">
        <h1 class="text-h4 font-weight-bold">Monthly Summary</h1>
      </v-col>
      <v-col md="2" cols="12">
        <v-btn
          @click="fetchMonthlySummary()"
          block
          color="primary"
          :loading="isLoading"
        >
          <v-icon left>mdi-refresh</v-icon> Refresh
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filters Row -->
    <v-row class="mt-4">
      <v-col cols="12" md="3">
        <v-select
          v-model="groupBy"
          :items="groupByOptions"
          label="Group By"
          outlined
          dense
          @change="applyFilters"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model="startDate"
          label="Start Date"
          type="date"
          outlined
          dense
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model="endDate"
          label="End Date"
          type="date"
          outlined
          dense
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-btn @click="applyFilters" block color="success" :loading="isLoading">
          <v-icon left>mdi-filter</v-icon> Apply Filters
        </v-btn>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="isLoading" class="mt-8">
      <v-col cols="12" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <p class="mt-4">Loading data...</p>
      </v-col>
    </v-row>

    <!-- Content -->
    <template v-else-if="summaryData">
      <!-- Overall Statistics Cards -->
      <v-row class="mt-4">
        <v-col cols="12" md="3">
          <v-card elevation="2" color="primary" dark>
            <v-card-text>
              <div class="text-overline">Total Revenue</div>
              <div class="text-h5 font-weight-bold">
                ₹{{
                  formatCurrency(
                    summaryData.overallStatistics?.totalRevenue || 0
                  )
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card elevation="2" color="success" dark>
            <v-card-text>
              <div class="text-overline">Total Invoices</div>
              <div class="text-h5 font-weight-bold">
                {{ summaryData.overallStatistics?.totalInvoices || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card elevation="2" color="info" dark>
            <v-card-text>
              <div class="text-overline">Average Invoice</div>
              <div class="text-h5 font-weight-bold">
                ₹{{
                  formatCurrency(
                    summaryData.overallStatistics?.averageInvoiceValue || 0
                  )
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card elevation="2" color="orange" dark>
            <v-card-text>
              <div class="text-overline">Unique Customers</div>
              <div class="text-h5 font-weight-bold">
                {{ summaryData.overallStatistics?.uniqueCustomerCount || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tax Breakdown Cards -->
      <v-row class="mt-2">
        <v-col cols="12" md="3">
          <v-card elevation="1">
            <v-card-text>
              <div class="text-caption grey--text">Total Tax</div>
              <div class="text-h6">
                ₹{{
                  formatCurrency(summaryData.overallStatistics?.totalTax || 0)
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card elevation="1">
            <v-card-text>
              <div class="text-caption grey--text">CGST</div>
              <div class="text-h6">
                ₹{{
                  formatCurrency(summaryData.overallStatistics?.totalCGST || 0)
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card elevation="1">
            <v-card-text>
              <div class="text-caption grey--text">SGST</div>
              <div class="text-h6">
                ₹{{
                  formatCurrency(summaryData.overallStatistics?.totalSGST || 0)
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card elevation="1">
            <v-card-text>
              <div class="text-caption grey--text">IGST</div>
              <div class="text-h6">
                ₹{{
                  formatCurrency(summaryData.overallStatistics?.totalIGST || 0)
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Comparison Card (if available) -->
      <v-row v-if="summaryData.comparison" class="mt-4">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="text-h6">Period Comparison</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <div class="text-caption grey--text">Revenue Change</div>
                  <div
                    class="text-h6"
                    :class="
                      summaryData.comparison.changes.revenueChangePercent >= 0
                        ? 'success--text'
                        : 'error--text'
                    "
                  >
                    <v-icon
                      :color="
                        summaryData.comparison.changes.revenueChangePercent >= 0
                          ? 'success'
                          : 'error'
                      "
                    >
                      {{
                        summaryData.comparison.changes.revenueChangePercent >= 0
                          ? "mdi-trending-up"
                          : "mdi-trending-down"
                      }}
                    </v-icon>
                    {{ summaryData.comparison.changes.revenueChangePercent }}%
                    (₹{{
                      formatCurrency(
                        summaryData.comparison.changes.revenueChange
                      )
                    }})
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption grey--text">
                    Invoice Count Change
                  </div>
                  <div
                    class="text-h6"
                    :class="
                      summaryData.comparison.changes.invoiceChangePercent >= 0
                        ? 'success--text'
                        : 'error--text'
                    "
                  >
                    <v-icon
                      :color="
                        summaryData.comparison.changes.invoiceChangePercent >= 0
                          ? 'success'
                          : 'error'
                      "
                    >
                      {{
                        summaryData.comparison.changes.invoiceChangePercent >= 0
                          ? "mdi-trending-up"
                          : "mdi-trending-down"
                      }}
                    </v-icon>
                    {{ summaryData.comparison.changes.invoiceChangePercent }}%
                    ({{ summaryData.comparison.changes.invoiceChange }})
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Trends Card (if available) -->
      <v-row v-if="summaryData.trends" class="mt-4">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="text-h6">Trends</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="4">
                  <div class="text-caption grey--text">Average Growth Rate</div>
                  <div class="text-h6">
                    {{ summaryData.trends.averageGrowthRate }}%
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-caption grey--text">Best Period</div>
                  <div class="text-body-1 font-weight-bold">
                    {{
                      summaryData.trends.bestPeriod.period ||
                      summaryData.trends.bestPeriod.monthName
                    }}
                  </div>
                  <div class="text-caption">
                    ₹{{
                      formatCurrency(summaryData.trends.bestPeriod.totalRevenue)
                    }}
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-caption grey--text">Worst Period</div>
                  <div class="text-body-1 font-weight-bold">
                    {{
                      summaryData.trends.worstPeriod.period ||
                      summaryData.trends.worstPeriod.monthName
                    }}
                  </div>
                  <div class="text-caption">
                    ₹{{
                      formatCurrency(
                        summaryData.trends.worstPeriod.totalRevenue
                      )
                    }}
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Period Breakdown Table -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title>
              <span class="text-h6">Period Breakdown</span>
              <v-spacer></v-spacer>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
                dense
                outlined
              ></v-text-field>
            </v-card-title>
            <v-data-table
              :headers="headers"
              :items="summaryData.periodBreakdown"
              :search="search"
              :items-per-page="10"
              class="elevation-0"
            >
              <template slot="item.period" slot-scope="{ item }">
                <span class="font-weight-bold">{{
                  item.period || item.monthName
                }}</span>
              </template>
              <template slot="item.totalRevenue" slot-scope="{ item }">
                <span class="font-weight-bold primary--text"
                  >₹{{ formatCurrency(item.totalRevenue) }}</span
                >
              </template>
              <template slot="item.invoiceCount" slot-scope="{ item }">
                <v-chip small color="success" dark>{{
                  item.invoiceCount
                }}</v-chip>
              </template>
              <template slot="item.averageInvoiceValue" slot-scope="{ item }">
                ₹{{ formatCurrency(item.averageInvoiceValue) }}
              </template>
              <template slot="item.totalTax" slot-scope="{ item }">
                ₹{{ formatCurrency(item.totalTax) }}
              </template>
              <template slot="item.actions" slot-scope="{ item }">
                <v-tooltip bottom>
                  <template slot="activator" slot-scope="{ on }">
                    <v-btn
                      icon
                      small
                      color="info"
                      v-on="on"
                      @click="showDetails(item)"
                    >
                      <v-icon small>mdi-information</v-icon>
                    </v-btn>
                  </template>
                  <span>View Details</span>
                </v-tooltip>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Empty State -->
    <v-row v-else class="mt-8">
      <v-col cols="12" class="text-center">
        <v-icon size="64" color="grey">mdi-chart-box-outline</v-icon>
        <p class="text-h6 grey--text mt-4">No data available</p>
        <p class="grey--text">Try adjusting your filters or refresh the data</p>
      </v-col>
    </v-row>

    <!-- Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="600px">
      <v-card v-if="selectedPeriod">
        <v-card-title class="text-h6">
          Period Details:
          {{ selectedPeriod.period || selectedPeriod.monthName }}
        </v-card-title>
        <v-card-text>
          <v-simple-table>
            <tbody>
              <tr>
                <td class="font-weight-bold">Total Revenue</td>
                <td>₹{{ formatCurrency(selectedPeriod.totalRevenue) }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">Total Amount (Pre-Tax)</td>
                <td>₹{{ formatCurrency(selectedPeriod.totalAmount) }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">Invoice Count</td>
                <td>{{ selectedPeriod.invoiceCount }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">Average Invoice</td>
                <td>
                  ₹{{ formatCurrency(selectedPeriod.averageInvoiceValue) }}
                </td>
              </tr>
              <tr>
                <td class="font-weight-bold">Max Invoice</td>
                <td>₹{{ formatCurrency(selectedPeriod.maxInvoiceValue) }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">Min Invoice</td>
                <td>₹{{ formatCurrency(selectedPeriod.minInvoiceValue) }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">CGST</td>
                <td>₹{{ formatCurrency(selectedPeriod.totalCGST) }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">SGST</td>
                <td>₹{{ formatCurrency(selectedPeriod.totalSGST) }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">IGST</td>
                <td>₹{{ formatCurrency(selectedPeriod.totalIGST) }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">Other Charges</td>
                <td>₹{{ formatCurrency(selectedPeriod.totalOtherCharges) }}</td>
              </tr>
            </tbody>
          </v-simple-table>

          <v-divider class="my-4"></v-divider>

          <div class="text-subtitle-2 font-weight-bold mb-2">
            Invoice Numbers:
          </div>
          <v-chip-group column>
            <v-chip
              v-for="invoice in selectedPeriod.invoiceNumbers"
              :key="invoice"
              small
              outlined
            >
              {{ invoice }}
            </v-chip>
          </v-chip-group>
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
import { mapActions, mapState } from "vuex";

export default {
  name: "MonthlySummary",
  data() {
    return {
      search: "",
      groupBy: "month",
      startDate: null,
      endDate: null,
      detailsDialog: false,
      selectedPeriod: null,
      groupByOptions: [
        { text: "Monthly", value: "month" },
        { text: "Quarterly", value: "quarter" },
        { text: "Yearly", value: "year" },
        { text: "Weekly", value: "week" },
      ],
      headers: [
        { text: "Period", value: "period", sortable: true },
        { text: "Revenue", value: "totalRevenue", sortable: true },
        { text: "Invoices", value: "invoiceCount", sortable: true },
        { text: "Avg Invoice", value: "averageInvoiceValue", sortable: true },
        { text: "Total Tax", value: "totalTax", sortable: true },
        { text: "Actions", value: "actions", sortable: false, align: "center" },
      ],
    };
  },
  computed: {
    ...mapState("summary", ["loading", "summaries"]),
    isLoading() {
      return this.loading;
    },
    summaryData() {
      return this.summaries;
    },
  },
  methods: {
    ...mapActions("summary", ["fetchMonthlySummary"]),

    goBack() {
      this.$router.go(-1);
    },

    async applyFilters() {
      try {
        let params = `?groupBy=${this.groupBy}`;

        if (this.startDate) {
          params += `&startDate=${this.startDate}`;
        }
        if (this.endDate) {
          params += `&endDate=${this.endDate}`;
        }

        // If both dates are provided, enable comparison
        if (this.startDate && this.endDate) {
          params += `&comparisonPeriod=true`;
        }

        await this.$store.dispatch("summary/fetchMonthlySummary", params);
      } catch (error) {
        console.error("Error applying filters:", error);
      }
    },

    formatCurrency(value) {
      if (!value) return "0.00";
      return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    },

    showDetails(item) {
      this.selectedPeriod = item;
      this.detailsDialog = true;
    },
  },

  mounted() {
    this.fetchMonthlySummary();
  },
};
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>
