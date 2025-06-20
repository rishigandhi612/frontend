<template>
  <v-container fluid>
    <v-row>
      <v-col md="2" cols="12">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12">
        <v-row>
          <v-col>
            <h1 class="text-center">Inventory List</h1>
          </v-col>
        </v-row>

        <!-- Search Controls -->
        <v-row class="mb-3">
          <v-col cols="12" md="6" class="text-right">
            <v-chip
              v-if="hasActiveFilters"
              color="info"
              close
              @click:close="clearAllFilters"
            >
              <v-icon left>mdi-filter</v-icon>
              {{ activeFiltersCount }} filter(s) active
            </v-chip>
          </v-col>
        </v-row>

        <!-- Quick Search Bar -->
        <v-row class="mb-3">
          <v-col>
            <v-text-field
              v-model="quickSearch"
              label="Quick Search"
              placeholder="Search by Roll ID, Product, or Status..."
              prepend-inner-icon="mdi-magnify"
              clearable
              outlined
              dense
              @input="handleQuickSearch"
              @click:clear="clearQuickSearch"
            >
              <template v-slot:append>
                <v-btn
                  icon
                  small
                  @click="showSearchDialog"
                  title="Advanced Search"
                >
                  <v-icon>mdi-tune</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <!-- Bulk Actions Row -->
        <v-row class="mb-3" v-if="selectedItems.length > 0">
          <v-col>
            <v-card outlined class="pa-3">
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-checkbox-marked-circle</v-icon>
                <span class="text-subtitle-1 mr-4">
                  {{ selectedItems.length }} item(s) selected
                </span>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  class="mr-2"
                  @click="printSelectedStickers"
                  :disabled="selectedItems.length === 0"
                >
                  <v-icon left>mdi-printer</v-icon>
                  Print Stickers ({{ selectedItems.length }})
                </v-btn>
                <v-btn
                  text
                  color="error"
                  @click="clearSelection"
                >
                  <v-icon left>mdi-close</v-icon>
                  Clear Selection
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Search Dialog -->
        <InventorySearch
          :is-visible="showDialog"
          title="Advanced Inventory Search"
          confirm-text="Apply Filters"
          cancel-text="Close"
          :show-results="false"
          @close="closeSearchDialog"
          @item-selected="handleItemSelected"
          @confirm="handleSearchConfirm"
        />

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="inventoryWithProductNames"
          :options.sync="options"
          :loading="isTableLoading"
          :server-items-length="totalItems"
          class="elevation-1"
          show-select
          v-model="selectedItems"
          item-key="id"
          :footer-props="{
            'items-per-page-options': [5, 10, 15, 20],
          }"
          @update:options="handleTableOptions"
        >
          <template v-slot:top>
            <!-- Active Filters Display -->
            <div v-if="hasActiveFilters" class="pa-3 bg-grey-lighten-5">
              <div class="d-flex flex-wrap align-center">
                <span class="text-subtitle-2 mr-3">Active Filters:</span>

                <!-- Quick Search Filter -->
                <v-chip
                  v-if="currentFilters.quickSearch"
                  small
                  color="primary"
                  close
                  class="ma-1"
                  @click:close="clearQuickSearch"
                >
                  Search: "{{ currentFilters.quickSearch }}"
                </v-chip>

                <!-- Status Filter -->
                <v-chip
                  v-if="currentFilters.status"
                  small
                  color="success"
                  close
                  class="ma-1"
                  @click:close="clearFilter('status')"
                >
                  Status: {{ currentFilters.status }}
                </v-chip>

                <!-- Type Filter -->
                <v-chip
                  v-if="currentFilters.type"
                  small
                  color="info"
                  close
                  class="ma-1"
                  @click:close="clearFilter('type')"
                >
                  Type: {{ currentFilters.type }}
                </v-chip>

                <!-- Roll ID Filter -->
                <v-chip
                  v-if="currentFilters.rollId"
                  small
                  color="warning"
                  close
                  class="ma-1"
                  @click:close="clearFilter('rollId')"
                >
                  Roll ID: {{ currentFilters.rollId }}
                </v-chip>

                <!-- Weight Range Filter -->
                <v-chip
                  v-if="currentFilters.minWeight || currentFilters.maxWeight"
                  small
                  color="purple"
                  close
                  class="ma-1"
                  @click:close="clearWeightFilter"
                >
                  Weight: {{ formatWeightRange() }}
                </v-chip>

                <!-- Width Range Filter -->
                <v-chip
                  v-if="currentFilters.minWidth || currentFilters.maxWidth"
                  small
                  color="orange"
                  close
                  class="ma-1"
                  @click:close="clearWidthFilter"
                >
                  Width: {{ formatWidthRange() }}
                </v-chip>

                <!-- Clear All Button -->
                <v-btn
                  text
                  small
                  color="error"
                  class="ml-2"
                  @click="clearAllFilters"
                >
                  <v-icon small left>mdi-close</v-icon>
                  Clear All
                </v-btn>
              </div>
            </div>
          </template>

          <template v-slot:item="{ item, isSelected, select }">
            <tr class="clickable-row">
              <td>
                <v-checkbox
                  :input-value="isSelected"
                  @change="select($event)"
                  color="primary"
                ></v-checkbox>
              </td>
              <td @click="handleRowClick(item.id)">{{ item.rollId }}</td>
              <td @click="handleRowClick(item.id)">{{ item.productName || "Unknown Product" }}</td>
              <td @click="handleRowClick(item.id)">{{ item.width }}</td>
              <td @click="handleRowClick(item.id)">{{ item.netWeight }}</td>
              <td @click="handleRowClick(item.id)">
                <v-chip
                  :color="getTypeColor(item.type)"
                  small
                  text-color="white"
                >
                  {{ item.type }}
                </v-chip>
              </td>
              <td @click="handleRowClick(item.id)">
                <v-chip
                  :color="getStatusColor(item.status)"
                  small
                  text-color="white"
                >
                  {{ item.status }}
                </v-chip>
              </td>
              <!-- <td>
                <v-btn
                  icon
                  small
                  color="primary"
                  @click="printSingleSticker(item)"
                  title="Print Sticker"
                >
                  <v-icon small>mdi-printer</v-icon>
                </v-btn>
              </td> -->
            </tr>
          </template>

          <template v-slot:no-data>
            <div class="text-center pa-4">
              <v-icon large color="grey">mdi-package-variant</v-icon>
              <div class="text-h6 mt-2">No inventory data available</div>
              <div class="text-body-2 text--secondary">
                {{
                  hasActiveFilters
                    ? "Try adjusting your search filters"
                    : "Add your first inventory item to get started"
                }}
              </div>
              <v-btn
                v-if="hasActiveFilters"
                color="primary"
                text
                class="mt-2"
                @click="clearAllFilters"
              >
                Clear Filters
              </v-btn>
            </div>
          </template>

          <template v-slot:loading>
            <div class="text-center pa-4">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
              <div class="mt-2">Loading inventory...</div>
            </div>
          </template>
        </v-data-table>
      </v-col>

      <v-col md="2" cols="12">
        <v-row>
          <v-col cols="12" md="12">
            <v-btn @click="refreshInventory" color="primary" block>
              <v-icon>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
          <v-col cols="12" md="12">
            <v-btn @click="goToAddInventory" color="success" block>
              <v-icon>mdi-plus</v-icon> Add Inventory
            </v-btn>
          </v-col>
           <v-col cols="12" md="12">
            <v-btn @click="goToBatchAddInventory" color="secondary" block>
              <v-icon>mdi-plus</v-icon> Batch Add Inventory
            </v-btn>
          </v-col>
          <v-col cols="12" md="12">
            <v-btn 
              @click="printAllStickers" 
              color="orange" 
              block
              :disabled="inventoryWithProductNames.length === 0"
            >
              <v-icon>mdi-printer-multiple</v-icon> 
              Print All ({{ inventoryWithProductNames.length }})
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Sticker Printing Component (Hidden) -->
    <div style="position: absolute; left: -9999px; top: -9999px;">
      <InventorySticker
        v-if="stickerItems.length > 0"
        ref="stickerComponent"
        :inventory-items="stickerItems"
        :product-name="stickerProductName"
      />
    </div>

    <!-- Search Results Snackbar -->
    <v-snackbar
      v-model="searchResultsSnackbar"
      :timeout="4000"
      color="info"
      bottom
    >
      {{ searchResultsMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="searchResultsSnackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Print Confirmation Dialog -->
    <v-dialog v-model="printDialog" max-width="500">
      <v-card>
        <v-card-title>
          <v-icon left color="primary">mdi-printer</v-icon>
          Print Stickers Confirmation
        </v-card-title>
        <v-card-text>
          <p>You are about to print <strong>{{ printItemsCount }}</strong> sticker(s).</p>
          <p v-if="printItemsCount > 4">
            This will use <strong>{{ Math.ceil(printItemsCount / 4) }}</strong> A4 page(s) 
            (4 stickers per page).
          </p>
          <p class="text-caption text--secondary mt-3">
            Make sure your printer is ready and loaded with A4 paper.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="printDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmPrint">
            <v-icon left>mdi-printer</v-icon>
            Print Now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import InventorySearch from "./InventorySearch.vue";
import InventorySticker from "../Printables/InventorySticker.vue";
import { debounce } from "lodash";

export default {
  name: "InventoryList",
  components: {
    InventorySearch,
    InventorySticker,
  },
  data() {
    return {
      showDialog: false,
      quickSearch: "",
      searchResultsSnackbar: false,
      searchResultsMessage: "",
      selectedItems: [],
      stickerItems: [],
      stickerProductName: "",
      printDialog: false,
      printItemsCount: 0,
      pendingPrintAction: null,
      currentFilters: {
        quickSearch: "",
        status: "",
        type: "",
        rollId: "",
        productId: "",
        minWeight: "",
        maxWeight: "",
        minWidth: "",
        maxWidth: "",
      },
      options: {
        page: 1,
        itemsPerPage: 10,
        sortBy: [""],
        sortDesc: [false],
      },
      headers: [
        { text: "Roll ID", value: "rollId", sortable: true },
        { text: "Product", value: "productName", sortable: true },
        { text: "Width", value: "width", sortable: true },
        { text: "Net Weight", value: "netWeight", sortable: true },
        { text: "Type", value: "type", sortable: true },
        { text: "Status", value: "status", sortable: true },
        // { text: "Actions", value: "actions", sortable: false, width: "100px" },
      ],
    };
  },
  computed: {
    ...mapGetters("inventory", ["allInventory", "isLoading", "getTotalCount"]),
    ...mapGetters("products", ["allProducts"]),

    totalItems() {
      return this.getTotalCount || 0;
    },

    inventoryWithProductNames() {
      return this.allInventory.map((item) => {
        const productId = item.productId;
        const product = this.allProducts.find((p) => p._id === productId);
        return {
          ...item,
          productName: product
            ? product.name
            : `Unknown Product (ID: ${productId})`,
        };
      });
    },

    isTableLoading() {
      return (
        this.isLoading ||
        (this.allProducts.length === 0 && this.allInventory.length > 0)
      );
    },

    hasActiveFilters() {
      return Object.values(this.currentFilters).some(
        (value) => value !== "" && value !== null
      );
    },

    activeFiltersCount() {
      return Object.values(this.currentFilters).filter(
        (value) => value !== "" && value !== null
      ).length;
    },
  },

  created() {
    // Create debounced search function
    this.debouncedQuickSearch = debounce(this.performQuickSearch, 500);
    this.initializeComponent();
  },

  methods: {
    async initializeComponent() {
      try {
        // First fetch products to have the product names available
        await this.fetchProducts();
        // Then load inventory items
        await this.loadItems();
      } catch (error) {
        console.error("Error in created hook:", error);
      }
    },

    // Sticker Printing Methods
    printSingleSticker(item) {
      this.printItemsCount = 1;
      this.pendingPrintAction = () => this.executePrint([item]);
      this.printDialog = true;
    },

    printSelectedStickers() {
      if (this.selectedItems.length === 0) {
        this.$toast?.warning?.("Please select items to print stickers for.");
        return;
      }
      this.printItemsCount = this.selectedItems.length;
      this.pendingPrintAction = () => this.executePrint(this.selectedItems);
      this.printDialog = true;
    },

    printAllStickers() {
      if (this.inventoryWithProductNames.length === 0) {
        this.$toast?.warning?.("No inventory items available to print.");
        return;
      }
      this.printItemsCount = this.inventoryWithProductNames.length;
      this.pendingPrintAction = () => this.executePrint(this.inventoryWithProductNames);
      this.printDialog = true;
    },

    async confirmPrint() {
      this.printDialog = false;
      if (this.pendingPrintAction) {
        await this.pendingPrintAction();
        this.pendingPrintAction = null;
      }
    },

    async executePrint(items) {
      try {
        // Transform items to the format expected by the sticker component
        this.stickerItems = items.map(item => ({
          rollId: item.rollId,
          type: item.type,
          micron: item.micron,
          width: item.width,
          netWeight: item.netWeight,
          grossWeight: item.grossWeight,
          mtr:item.mtr,
        }));

        // Set product name (use the first item's product name or a generic name)
        this.stickerProductName = items[0]?.productName || "Mixed Products";

        // Wait for the component to render
        await this.$nextTick();

        // Print the stickers
        if (this.$refs.stickerComponent) {
          this.$refs.stickerComponent.printStickers();
          this.showResultsMessage(`Printing ${items.length} sticker(s)...`);
        } else {
          throw new Error("Sticker component not found");
        }
      } catch (error) {
        console.error("Error printing stickers:", error);
        this.$toast?.error?.("Failed to print stickers. Please try again.");
      }
    },

    clearSelection() {
      this.selectedItems = [];
    },

    // Search Dialog Methods
    showSearchDialog() {
      this.showDialog = true;
    },

    closeSearchDialog() {
      this.showDialog = false;
    },

    handleItemSelected(item) {
      console.log("Selected item:", item);
      this.handleRowClick(item.id);
      this.showResultsMessage(`Selected: ${item.rollId}`);
    },

    async handleSearchConfirm(data) {
      console.log("Search data:", data);

      this.currentFilters = {
        quickSearch: this.quickSearch,
        status: data.searchParams.status || "",
        type: data.searchParams.type || "",
        rollId: data.searchParams.rollId || "",
        productId: data.searchParams.productId || "",
        minWeight: data.searchParams.minWeight || "",
        maxWeight: data.searchParams.maxWeight || "",
        minWidth: data.searchParams.minWidth || "",
        maxWidth: data.searchParams.maxWidth || "",
      };

      this.closeSearchDialog();
      this.options.page = 1;
      await this.loadItems();

      const resultsCount = this.getTotalCount || 0;
      this.showResultsMessage(
        `Found ${resultsCount} items matching your search criteria`
      );
    },

    // Quick Search Methods
    handleQuickSearch() {
      this.currentFilters.quickSearch = this.quickSearch || "";
      this.debouncedQuickSearch();
    },

    async performQuickSearch() {
      this.options.page = 1;
      await this.loadItems();
    },

    clearQuickSearch() {
      this.quickSearch = "";
      this.currentFilters.quickSearch = "";
      this.options.page = 1;
      this.loadItems();
    },

    // Filter Management Methods
    clearFilter(filterKey) {
      this.currentFilters[filterKey] = "";
      this.options.page = 1;
      this.loadItems();
    },

    clearWeightFilter() {
      this.currentFilters.minWeight = "";
      this.currentFilters.maxWeight = "";
      this.options.page = 1;
      this.loadItems();
    },

    clearWidthFilter() {
      this.currentFilters.minWidth = "";
      this.currentFilters.maxWidth = "";
      this.options.page = 1;
      this.loadItems();
    },

    async clearAllFilters() {
      this.currentFilters = {
        quickSearch: "",
        status: "",
        type: "",
        rollId: "",
        productId: "",
        minWeight: "",
        maxWeight: "",
        minWidth: "",
        maxWidth: "",
      };

      this.quickSearch = "";
      this.options.page = 1;
      await this.loadItems();
      this.showResultsMessage("All filters cleared");
    },

    // Formatting Methods
    formatWeightRange() {
      const min = this.currentFilters.minWeight;
      const max = this.currentFilters.maxWeight;
      if (min && max) return `${min} - ${max}`;
      if (min) return `≥ ${min}`;
      if (max) return `≤ ${max}`;
      return "";
    },

    formatWidthRange() {
      const min = this.currentFilters.minWidth;
      const max = this.currentFilters.maxWidth;
      if (min && max) return `${min} - ${max}`;
      if (min) return `≥ ${min}`;
      if (max) return `≤ ${max}`;
      return "";
    },

    // Status and Type Color Methods
    getStatusColor(status) {
      const colors = {
        available: "success",
        reserved: "warning",
        damaged: "error",
        sold: "primary",
        "in-use": "info",
      };
      return colors[status] || "grey";
    },

    getTypeColor(type) {
      const colors = {
        film: "blue",
        "non-film": "green",
      };
      return colors[type] || "grey";
    },

    // Utility Methods
    showResultsMessage(message) {
      this.searchResultsMessage = message;
      this.searchResultsSnackbar = true;
    },

    // Existing Methods
    async fetchProducts() {
      try {
        await this.$store.dispatch("products/fetchProducts");
      } catch (error) {
        console.error("Error fetching products:", error);
        this.$toast?.error?.(
          "Failed to load products. Product names may not display correctly."
        );
      }
    },

    async loadItems() {
      try {
        const params = {
          page: this.options.page,
          limit: this.options.itemsPerPage,
          sortBy: this.options.sortBy[0] || "rollId",
          sortOrder: this.options.sortDesc[0] ? "desc" : "asc",
          search: this.currentFilters.quickSearch,
          status: this.currentFilters.status,
          type: this.currentFilters.type,
          rollId: this.currentFilters.rollId,
          productId: this.currentFilters.productId,
          minWeight: this.currentFilters.minWeight,
          maxWeight: this.currentFilters.maxWeight,
          minWidth: this.currentFilters.minWidth,
          maxWidth: this.currentFilters.maxWidth,
        };

        Object.keys(params).forEach((key) => {
          if (
            params[key] === "" ||
            params[key] === null ||
            params[key] === undefined
          ) {
            delete params[key];
          }
        });

        await this.$store.dispatch("inventory/fetchInventory", params);
      } catch (error) {
        console.error("Error loading inventory items:", error);
        this.$toast?.error?.("Failed to load inventory items.");
      }
    },

    handleTableOptions(options) {
      this.options = options;
      this.loadItems();
    },

    refreshInventory() {
      this.options.page = 1;
      this.loadItems();
    },

    formatDate(dateString) {
      if (!dateString) return "N/A";
      const options = { year: "numeric", month: "2-digit", day: "2-digit" };
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, options);
    },

    handleRowClick(inventoryId) {
      this.$router.push({
        name: "inventoryDetail",
        params: { id: inventoryId },
      });
    },

    goToAddInventory() {
      this.$router.push({ name: "addInventory" });
    },
     goToBatchAddInventory() {
      this.$router.push({ name: "BatchAddInventory" });
    },

    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>

<style scoped>
.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-row:hover {
  background-color: #f5f5f5;
}

.bg-grey-lighten-5 {
  background-color: #fafafa;
}

.text--secondary {
  color: rgba(0, 0, 0, 0.6) !important;
}

.clickable-row td:first-child {
  cursor: default;
}

.clickable-row td:last-child {
  cursor: default;
}
</style>