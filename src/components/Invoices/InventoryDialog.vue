<!-- components/InventoryDialog.vue - UPDATED to use fetchInventoryForProduct -->
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
              clearable
            >
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-title>
                    No products available
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
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
              :disabled="!selectedProduct"
            />
          </v-col>
        </v-row>

        <!-- Product Selection Instructions -->
        <v-row v-if="!selectedProduct">
          <v-col cols="12">
            <v-alert type="info" outlined>
              <v-icon slot="prepend">mdi-information-outline</v-icon>
              Please select a product to view available inventory items.
            </v-alert>
          </v-col>
        </v-row>

        <!-- Loading State -->
        <v-row v-if="loadingInventory && selectedProduct">
          <v-col cols="12" class="text-center">
            <v-progress-circular
              indeterminate
              color="primary"
            ></v-progress-circular>
            <p class="mt-2">Loading inventory items for {{ selectedProduct.name }}...</p>
          </v-col>
        </v-row>

        <!-- No Inventory Items -->
        <v-row
          v-if="
            !loadingInventory && 
            inventoryItems.length === 0 && 
            selectedProduct && 
            hasSearchedInventory
          "
        >
          <v-col cols="12">
            <v-alert type="warning">
              <v-icon slot="prepend">mdi-package-variant</v-icon>
              No available inventory items found for "{{ selectedProduct.name }}".
              <br>
              <small>Only items with status other than 'sold' or 'used' are shown.</small>
            </v-alert>
          </v-col>
        </v-row>

        <!-- Inventory Items Table -->
        <v-row v-if="!loadingInventory && inventoryItems.length > 0">
          <v-col cols="12">
            <div class="d-flex justify-space-between align-center mb-3">
              <h3>Available Inventory Items for "{{ selectedProduct.name }}"</h3>
              <div>
                <v-btn
                  color="primary"
                  text
                  small
                  @click="selectAll"
                  :disabled="allSelected"
                >
                  Select All ({{ inventoryItems.length }})
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
                {{ formatValue(item.width) }}
              </template>

              <!-- Custom slot for net weight display -->
              <template slot="item.netWeight" slot-scope="{ item }">
                {{ formatValue(item.netWeight) }}
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
                {{ formatValue(item.mtr) }}
              </template>

              <!-- Custom slot for type -->
              <template slot="item.type" slot-scope="{ item }">
                {{ item.type || "N/A" }}
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
                color="primary"
                outlined
              >
                Roll: {{ item.rollId }} | Width: {{ formatValue(item.width) }} | Weight: {{ formatValue(item.netWeight) }}
              </v-chip>
            </v-chip-group>
            <div class="mt-2">
              <v-chip color="success" small>
                <v-icon left small>mdi-counter</v-icon>
                Total Items: {{ selectedInventoryItems.length }}
              </v-chip>
              <v-chip color="info" small class="ml-2">
                <v-icon left small>mdi-currency-inr</v-icon>
                Est. Total: ₹{{ calculateEstimatedTotal() }}
              </v-chip>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey darken-1" text @click="closeDialog"> 
          Cancel 
        </v-btn>
        <v-btn
          color="primary"
          @click="addInventoryToInvoice"
          :disabled="!canAddToInvoice"
        >
          <v-icon left>mdi-plus</v-icon>
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
      hasSearchedInventory: false, // Track if we've attempted to search
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
      this.hasSearchedInventory = false;
    },

    async onProductChange() {
      // Reset inventory data when product changes
      this.inventoryItems = [];
      this.selectedInventoryItems = [];
      this.hasSearchedInventory = false;

      if (!this.selectedProduct) {
        return;
      }

      console.log(`Product selected: ${this.selectedProduct.name} (ID: ${this.selectedProduct._id})`);
      await this.fetchInventoryForProduct();
    },

    async fetchInventoryForProduct() {
      if (!this.selectedProduct) return;

      this.loadingInventory = true;
      this.hasSearchedInventory = false;

      try {
        console.log(`Fetching inventory for product ID: ${this.selectedProduct._id}`);
        
        // ✅ UPDATED: Use the new fetchInventoryForProduct action
        const response = await this.$store.dispatch(
          "inventory/fetchInventoryForProduct",
          {
            productId: this.selectedProduct._id,
            params: {
              page: 1,
              limit: 1000, // Get all items for this product
              sortBy: "rollId",
              sortOrder: "asc",
            }
          }
        );

        if (response && response.data) {
          console.log(`Found ${response.data.length} total inventory items for product ${this.selectedProduct._id}`);
          
          // Filter for items that are available/in-stock
          // Exclude sold, used, damaged items
          const availableItems = response.data.filter((item) => {
            const status = item.status ? item.status.toLowerCase() : '';
            const excludedStatuses = ['sold', 'used', 'damaged', 'out-of-stock'];
            return !excludedStatuses.includes(status);
          });

          console.log(`Filtered to ${availableItems.length} available inventory items`);
          this.inventoryItems = availableItems;
        } else {
          console.log('No inventory data received for product');
          this.inventoryItems = [];
        }

        // Reset selection when new inventory is loaded
        this.selectedInventoryItems = [];
        this.hasSearchedInventory = true;

      } catch (error) {
        console.error("Error fetching inventory for product:", error);
        this.inventoryItems = [];
        this.hasSearchedInventory = true;
        
        // Show user-friendly error message
        this.$toast?.error?.(
          `Failed to load inventory items for "${this.selectedProduct.name}". Please try again.`
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

    formatValue(value) {
      if (value === null || value === undefined || value === '') {
        return 'N/A';
      }
      return typeof value === 'number' ? value.toFixed(2) : value;
    },

    calculateEstimatedTotal() {
      const total = this.selectedInventoryItems.reduce((sum, item) => {
        const weight = parseFloat(item.netWeight) || 1;
        return sum + (weight * parseFloat(this.unitPrice || 0));
      }, 0);
      return total.toFixed(2);
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
        case "pending":
          return "blue";
        default:
          return "blue-grey";
      }
    },

    addInventoryToInvoice() {
      if (!this.canAddToInvoice) {
        this.$toast?.warning?.("Please select products and set unit price before adding to invoice.");
        return;
      }

      // Create inventory products with correct structure
      const inventoryProducts = this.selectedInventoryItems.map((item) => ({
        // Product reference as object with _id
        productId: {
          _id: this.selectedProduct._id,
          name: this.selectedProduct.name // Include name for better debugging
        },
        width: parseFloat(item.width) || 0,
        quantity: parseFloat(item.netWeight) || 1,
        unit_price: parseFloat(this.unitPrice),
        totalPrice: (
          (parseFloat(item.netWeight) || 1) * parseFloat(this.unitPrice)
        ).toFixed(2),
        // Add roll ID reference for inventory tracking
        rollId: item.rollId,
        inventoryItemId: item.id || item._id, // Include inventory item ID if available
        // Add additional metadata for better tracking
        inventoryMeta: {
          type: item.type,
          status: item.status,
          mtr: item.mtr
        }
      }));

      console.log(`Adding ${inventoryProducts.length} inventory products to invoice:`, inventoryProducts);
      this.$emit("inventory-products-added", inventoryProducts);
      
      // Show success message
      this.$toast?.success?.(
        `Successfully added ${inventoryProducts.length} items from inventory for "${this.selectedProduct.name}".`
      );
      
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

.v-alert {
  margin-bottom: 16px;
}

.headline {
  font-weight: 500;
}
</style>