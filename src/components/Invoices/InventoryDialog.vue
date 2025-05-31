<!-- components/InventoryDialog.vue -->
<template>
  <v-dialog v-model="showDialog" max-width="1000px" persistent>
    <v-card>
      <v-card-title class="headline">
        <span>Add from Inventory</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Product Selection -->
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedProduct"
              :items="allProducts"
              item-text="name"
              item-value="_id"
              label="Select Product"
              return-object
              required
              @change="onProductChange"
              :loading="loadingProducts"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="unitPrice"
              label="Unit Price (Same for all selected items)"
              type="number"
              :rules="[rules.required, rules.numeric]"
              required
              min="0"
              step="0.01"
            />
          </v-col>
        </v-row>

        <!-- Loading State -->
        <v-row v-if="loadingInventory">
          <v-col cols="12" class="text-center">
            <v-progress-circular
              indeterminate
              color="primary"
            ></v-progress-circular>
            <p class="mt-2">Loading inventory items...</p>
          </v-col>
        </v-row>

        <!-- No Inventory Items -->
        <v-row
          v-if="
            !loadingInventory && inventoryItems.length === 0 && selectedProduct
          "
        >
          <v-col cols="12">
            <v-alert type="info">
              No inventory items found for the selected product.
            </v-alert>
          </v-col>
        </v-row>

        <!-- Inventory Items Table -->
        <v-row v-if="!loadingInventory && inventoryItems.length > 0">
          <v-col cols="12">
            <div class="d-flex justify-space-between align-center mb-3">
              <h3>Available Inventory Items</h3>
              <div>
                <v-btn
                  color="primary"
                  text
                  small
                  @click="selectAll"
                  :disabled="allSelected"
                >
                  Select All
                </v-btn>
                <v-btn
                  color="grey"
                  text
                  small
                  @click="deselectAll"
                  :disabled="noneSelected"
                  class="ml-2"
                >
                  Deselect All
                </v-btn>
              </div>
            </div>

            <v-data-table
              v-model="selectedInventoryItems"
              :headers="inventoryHeaders"
              :items="inventoryItems"
              :items-per-page="10"
              item-key="rollId"
              show-select
              class="elevation-1"
              :loading="loadingInventory"
            >
              <!-- Custom slot for width display -->
              <template slot="item.width" slot-scope="{ item }">
                {{ item.width || "N/A" }}
              </template>

              <!-- Custom slot for net weight display -->
              <template slot="item.netWeight" slot-scope="{ item }">
                {{ item.netWeight || "N/A" }}
              </template>

              <!-- Custom slot for status with chip -->
              <template slot="item.status" slot-scope="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  small
                  text-color="white"
                >
                  {{ item.status || "Unknown" }}
                </v-chip>
              </template>

              <!-- Custom slot for meters -->
              <template slot="item.mtr" slot-scope="{ item }">
                {{ item.mtr || "N/A" }}
              </template>
            </v-data-table>
          </v-col>
        </v-row>

        <!-- Selected Items Summary -->
        <v-row v-if="selectedInventoryItems.length > 0">
          <v-col cols="12">
            <v-divider class="my-4"></v-divider>
            <h4 class="mb-2">Selected Items Summary</h4>
            <v-chip-group column>
              <v-chip
                v-for="item in selectedInventoryItems"
                :key="item.rollId"
                small
                close
                @click:close="removeFromSelection(item)"
              >
                Roll: {{ item.rollId }} | Width: {{ item.width }} | Net Weight:
                {{ item.netWeight }}
              </v-chip>
            </v-chip-group>
            <p class="mt-2 text-subtitle-2">
              Total Items: {{ selectedInventoryItems.length }}
            </p>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey darken-1" text @click="closeDialog"> Cancel </v-btn>
        <v-btn
          color="primary"
          @click="addInventoryToInvoice"
          :disabled="!canAddToInvoice"
        >
          Add to Invoice ({{ selectedInventoryItems.length }} items)
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "InventoryDialog",

  props: {
    show: {
      type: Boolean,
      default: false,
    },
    allProducts: {
      type: Array,
      required: true,
    },
    rules: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      selectedProduct: null,
      unitPrice: 0,
      inventoryItems: [],
      selectedInventoryItems: [],
      loadingInventory: false,
      loadingProducts: false,
      inventoryHeaders: [
        { text: "Roll ID", value: "rollId", sortable: true },
        { text: "Width", value: "width", sortable: true },
        { text: "Net Weight", value: "netWeight", sortable: true },
        { text: "Status", value: "status", sortable: true },
        { text: "Meters", value: "mtr", sortable: true },
        { text: "Type", value: "type", sortable: true },
      ],
    };
  },

  computed: {
    showDialog: {
      get() {
        return this.show;
      },
      set(value) {
        this.$emit("update:show", value);
      },
    },

    canAddToInvoice() {
      return (
        this.selectedProduct &&
        this.unitPrice > 0 &&
        this.selectedInventoryItems.length > 0
      );
    },

    allSelected() {
      return (
        this.inventoryItems.length > 0 &&
        this.selectedInventoryItems.length === this.inventoryItems.length
      );
    },

    noneSelected() {
      return this.selectedInventoryItems.length === 0;
    },
  },

  watch: {
    show(newVal) {
      if (newVal) {
        this.resetForm();
      }
    },
  },

  methods: {
    resetForm() {
      this.selectedProduct = null;
      this.unitPrice = 0;
      this.inventoryItems = [];
      this.selectedInventoryItems = [];
    },

    async onProductChange() {
      if (!this.selectedProduct) {
        this.inventoryItems = [];
        this.selectedInventoryItems = [];
        return;
      }

      await this.fetchInventoryForProduct();
    },

    async fetchInventoryForProduct() {
      if (!this.selectedProduct) return;

      this.loadingInventory = true;
      try {
        // Call the inventory store action to fetch inventory items for the selected product
        const response = await this.$store.dispatch(
          "inventory/fetchInventory",
          {
            productId: this.selectedProduct._id,
            page: 1,
            limit: 1000, // Get all items for this product
            sortBy: "rollId",
            sortOrder: "asc",
          }
        );

        if (response && response.data) {
          // Filter for items that are available/in-stock (you can adjust status filter as needed)
          this.inventoryItems = response.data.filter(
            (item) =>
              item.status &&
              item.status.toLowerCase() !== "sold" &&
              item.status.toLowerCase() !== "used"
          );
        } else {
          this.inventoryItems = [];
        }

        // Reset selection when new inventory is loaded
        this.selectedInventoryItems = [];
      } catch (error) {
        console.error("Error fetching inventory for product:", error);
        this.inventoryItems = [];
        this.$toast?.error?.(
          "Failed to load inventory items for selected product."
        );
      } finally {
        this.loadingInventory = false;
      }
    },

    selectAll() {
      this.selectedInventoryItems = [...this.inventoryItems];
    },

    deselectAll() {
      this.selectedInventoryItems = [];
    },

    removeFromSelection(item) {
      const index = this.selectedInventoryItems.findIndex(
        (selected) => selected.rollId === item.rollId
      );
      if (index > -1) {
        this.selectedInventoryItems.splice(index, 1);
      }
    },

    getStatusColor(status) {
      if (!status) return "grey";

      const statusLower = status.toLowerCase();
      switch (statusLower) {
        case "available":
        case "in-stock":
          return "green";
        case "reserved":
          return "orange";
        case "sold":
        case "used":
          return "red";
        case "damaged":
          return "red darken-2";
        default:
          return "blue";
      }
    },

    addInventoryToInvoice() {
      if (!this.canAddToInvoice) {
        return;
      }

      // Create invoice products from selected inventory items
      // Match the EXACT payload structure as BatchDialog
      const inventoryProducts = this.selectedInventoryItems.map((item) => ({
        productId: this.selectedProduct._id,
        width: parseFloat(item.width) || 0,
        quantity: parseFloat(item.netWeight) || 1,
        unit_price: parseFloat(this.unitPrice),
        totalPrice: (
          (parseFloat(item.netWeight) || 1) * parseFloat(this.unitPrice)
        ).toFixed(2),
      }));

      this.$emit("inventory-products-added", inventoryProducts);
      this.closeDialog();
    },

    closeDialog() {
      this.showDialog = false;
    },
  },
};
</script>

<style scoped>
.v-data-table {
  border-radius: 4px;
}

.v-chip-group {
  max-height: 200px;
  overflow-y: auto;
}
</style>
