<template>
  <v-card elevation="2">
    <v-card-title>
      <v-icon v-if="icon" left>{{ icon }}</v-icon>
      {{ title }}
      <v-spacer></v-spacer>
      <v-text-field
        v-if="searchable"
        v-model="searchQuery"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        dense
        class="mr-2"
        style="max-width: 300px"
      ></v-text-field>
      <v-btn
        v-if="exportable"
        color="primary"
        outlined
        small
        @click="exportData"
        class="mr-2"
      >
        <v-icon left small>mdi-download</v-icon>
        Export
      </v-btn>
      <v-btn
        v-if="refreshable"
        icon
        small
        :loading="loading"
        @click="$emit('refresh')"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :search="searchQuery"
        :sort-by="sortBy"
        :sort-desc="sortDesc"
        :footer-props="footerProps"
        class="elevation-1"
      >
        <!-- Pass through all slots -->
        <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
          <slot :name="slot" v-bind="scope" />
        </template>

        <!-- Default item slot if not provided -->
        <template v-if="!$scopedSlots.item" v-slot:item="{ item }">
          <tr>
            <td v-for="header in headers" :key="header.value">
              {{ formatCellValue(item[header.value], header.format) }}
            </td>
          </tr>
        </template>

        <!-- Loading slot -->
        <template v-slot:loading>
          <div class="text-center pa-4">
            <v-progress-circular
              indeterminate
              color="primary"
            ></v-progress-circular>
            <div class="mt-2">Loading data...</div>
          </div>
        </template>

        <!-- No data slot -->
        <template v-slot:no-data>
          <div class="text-center pa-4">
            <v-icon large color="grey">mdi-information-outline</v-icon>
            <div class="mt-2">{{ noDataText }}</div>
          </div>
        </template>

        <!-- No results slot -->
        <template v-slot:no-results>
          <div class="text-center pa-4">
            <v-icon large color="grey">mdi-magnify</v-icon>
            <div class="mt-2">No results found for "{{ searchQuery }}"</div>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  exportToCSV,
} from "@/utils/analyticsUtils";

export default {
  name: "DataTableWrapper",
  props: {
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "",
    },
    headers: {
      type: Array,
      required: true,
    },
    items: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    searchable: {
      type: Boolean,
      default: true,
    },
    exportable: {
      type: Boolean,
      default: true,
    },
    refreshable: {
      type: Boolean,
      default: true,
    },
    itemsPerPage: {
      type: Number,
      default: 10,
    },
    sortBy: {
      type: [String, Array],
      default: "",
    },
    sortDesc: {
      type: [Boolean, Array],
      default: false,
    },
    noDataText: {
      type: String,
      default: "No data available",
    },
    exportFilename: {
      type: String,
      default: "export.csv",
    },
  },
  data() {
    return {
      searchQuery: "",
      footerProps: {
        "items-per-page-options": [5, 10, 25, 50, 100],
      },
    };
  },
  methods: {
    formatCellValue(value, format) {
      if (!value && value !== 0) return "-";

      switch (format) {
        case "currency":
          return formatCurrency(value);
        case "number":
          return formatNumber(value);
        case "percentage":
          return formatPercentage(value);
        default:
          return value;
      }
    },
    exportData() {
      if (!this.items || this.items.length === 0) {
        this.$emit("export-error", "No data to export");
        return;
      }

      try {
        // Create a clean data array for export
        const exportData = this.items.map((item) => {
          const row = {};
          this.headers.forEach((header) => {
            if (header.value !== "actions") {
              row[header.text] = item[header.value];
            }
          });
          return row;
        });

        exportToCSV(exportData, this.exportFilename);
        this.$emit("export-success");
      } catch (error) {
        this.$emit("export-error", error);
      }
    },
  },
};
</script>

<style scoped>
/* Add custom styles if needed */
</style>
