<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col cols="12" md="10">
        <v-card class="pa-4">
          <v-card-title class="text-h4 justify-center">
            Import Inventory from CSV
          </v-card-title>

          <v-divider class="my-4"></v-divider>

          <!-- CSV Upload Section -->
          <v-card outlined class="mb-4">
            <v-card-title class="text-h6">
              Step 1: Upload CSV File
            </v-card-title>
            <v-card-text>
              <v-file-input
                v-model="csvFile"
                accept=".csv"
                label="Select CSV File"
                prepend-icon="mdi-file-delimited"
                show-size
                @change="handleFileUpload"
                :disabled="loading"
                outlined
              ></v-file-input>

              <!-- Download Template Button -->
              <v-btn @click="downloadTemplate" color="info" outlined small>
                <v-icon left small>mdi-download</v-icon>
                Download CSV Template
              </v-btn>

              <!-- CSV Format Instructions -->
              <v-alert type="info" text class="mt-4">
                <div class="font-weight-bold mb-2">CSV Format:</div>
                <ul>
                  <li>
                    <strong>Product Name</strong> - Name of the product (must
                    match existing products)
                  </li>
                  <li><strong>Type</strong> - "film" or "non-film"</li>
                  <li>
                    <strong>Batch Number</strong> - Required for non-film items
                  </li>
                  <li><strong>Width</strong> - For film items (optional)</li>
                  <li><strong>Micron</strong> - For film items (optional)</li>
                  <li><strong>Gross Weight</strong> - In kg (optional)</li>
                  <li><strong>Net Weight</strong> - In kg (required)</li>
                  <li>
                    <strong>Length</strong> - For film items in meters
                    (optional)
                  </li>
                  <li>
                    <strong>Status</strong> - available, damaged, or reserved
                    (default: available)
                  </li>
                </ul>
              </v-alert>
            </v-card-text>
          </v-card>

          <!-- Preview Section -->
          <v-card outlined v-if="inventoryItems.length > 0">
            <v-card-title class="text-h6">
              Step 2: Review & Edit Imported Data
              <v-spacer></v-spacer>
              <v-chip color="success" outlined>
                {{ validItemsCount }} Valid
              </v-chip>
              <v-chip
                color="error"
                outlined
                class="ml-2"
                v-if="invalidItemsCount > 0"
              >
                {{ invalidItemsCount }} Invalid
              </v-chip>
            </v-card-title>

            <v-data-table
              :headers="headers"
              :items="inventoryItems"
              :hide-default-footer="true"
              disable-pagination
              class="elevation-0"
              :items-per-page="-1"
            >
              <!-- Product Column -->
              <template slot="item.product" slot-scope="{ item, index }">
                <v-autocomplete
                  v-model="item.product"
                  :items="productList"
                  item-text="name"
                  item-value="_id"
                  label="Select Product"
                  dense
                  hide-details
                  @change="handleProductSelection(index)"
                  return-object
                  :error="!!item.errors.product"
                  style="min-width: 200px"
                ></v-autocomplete>
                <div v-if="item.errors.product" class="error--text caption">
                  {{ item.errors.product }}
                </div>
              </template>

              <!-- Type Column -->
              <template slot="item.type" slot-scope="{ item }">
                <v-select
                  v-model="item.type"
                  :items="typeOptions"
                  label="Type"
                  dense
                  hide-details
                  :error="!!item.errors.type"
                  style="min-width: 120px"
                ></v-select>
              </template>

              <!-- Batch Number Column -->
              <template slot="item.rollId" slot-scope="{ item }">
                <v-text-field
                  v-if="item.type === 'non-film'"
                  v-model="item.rollId"
                  label="Batch #"
                  dense
                  hide-details
                  :error="!!item.errors.rollId"
                  style="min-width: 120px"
                ></v-text-field>
                <span v-else class="grey--text">N/A</span>
              </template>

              <!-- Width Column -->
              <template slot="item.width" slot-scope="{ item }">
                <v-text-field
                  v-if="item.type === 'film'"
                  v-model.number="item.width"
                  label="Width"
                  type="number"
                  step="0.01"
                  min="0"
                  dense
                  hide-details
                  style="min-width: 100px"
                ></v-text-field>
                <span v-else class="grey--text">N/A</span>
              </template>

              <!-- Micron Column -->
              <template slot="item.micron" slot-scope="{ item }">
                <v-text-field
                  v-if="item.type === 'film'"
                  v-model.number="item.micron"
                  label="Micron"
                  type="number"
                  step="0.01"
                  min="0"
                  dense
                  hide-details
                  style="min-width: 100px"
                ></v-text-field>
                <span v-else class="grey--text">N/A</span>
              </template>

              <!-- Gross Weight Column -->
              <template slot="item.grossWeight" slot-scope="{ item }">
                <v-text-field
                  v-model.number="item.grossWeight"
                  label="Gross Weight"
                  type="number"
                  step="0.001"
                  min="0"
                  dense
                  hide-details
                  suffix="kg"
                  style="min-width: 120px"
                ></v-text-field>
              </template>

              <!-- Net Weight Column -->
              <template slot="item.netWeight" slot-scope="{ item }">
                <v-text-field
                  v-model.number="item.netWeight"
                  label="Net Weight"
                  type="number"
                  step="0.001"
                  min="0"
                  dense
                  hide-details
                  suffix="kg"
                  :error="!!item.errors.netWeight"
                  style="min-width: 120px"
                ></v-text-field>
              </template>

              <!-- Length Column -->
              <template slot="item.mtr" slot-scope="{ item }">
                <v-text-field
                  v-if="item.type === 'film'"
                  v-model.number="item.mtr"
                  label="Length"
                  type="number"
                  step="0.01"
                  min="0"
                  dense
                  hide-details
                  suffix="m"
                  style="min-width: 100px"
                ></v-text-field>
                <span v-else class="grey--text">N/A</span>
              </template>

              <!-- Status Column -->
              <template slot="item.status" slot-scope="{ item }">
                <v-select
                  v-model="item.status"
                  :items="statusOptions"
                  label="Status"
                  dense
                  hide-details
                  style="min-width: 120px"
                ></v-select>
              </template>

              <!-- Row Status Indicator -->
              <template slot="item.rowStatus" slot-scope="{ item }">
                <v-icon v-if="hasErrors(item)" color="error"
                  >mdi-alert-circle</v-icon
                >
                <v-icon v-else color="success">mdi-check-circle</v-icon>
              </template>

              <!-- Actions Column -->
              <template slot="item.actions" slot-scope="{ index }">
                <v-btn
                  @click="removeRow(index)"
                  color="error"
                  icon
                  small
                  :disabled="loading"
                >
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>

          <v-divider class="my-4" v-if="inventoryItems.length > 0"></v-divider>

          <!-- Submit Actions -->
          <v-card-actions
            class="justify-center"
            v-if="inventoryItems.length > 0"
          >
            <v-btn
              @click="clearAll"
              color="error"
              outlined
              large
              :disabled="loading"
            >
              <v-icon left>mdi-close</v-icon>
              Clear All
            </v-btn>
            <v-btn
              @click="validateAndSave"
              color="primary"
              large
              :loading="loading"
              :disabled="loading || inventoryItems.length === 0"
            >
              <v-icon left>mdi-content-save</v-icon>
              Save All Items ({{ validItemsCount }})
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Progress Dialog -->
        <v-dialog v-model="progressDialog" persistent width="400">
          <v-card>
            <v-card-title> Saving Inventory Items </v-card-title>
            <v-card-text>
              <v-progress-linear
                :value="progressPercentage"
                color="primary"
                height="20"
                striped
              >
                {{ savedCount }}/{{ inventoryItems.length }}
              </v-progress-linear>
              <p class="mt-2 mb-0">
                {{ progressMessage }}
              </p>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- Error Alert -->
        <v-alert
          v-if="error"
          type="error"
          class="mt-4"
          dismissible
          @input="error = null"
        >
          {{ error }}
        </v-alert>

        <!-- Success Alert -->
        <v-alert
          v-if="success"
          type="success"
          class="mt-4"
          dismissible
          @input="success = null"
        >
          {{ success }}
        </v-alert>

        <!-- Validation Errors -->
        <v-alert
          v-if="validationErrors.length > 0"
          type="warning"
          class="mt-4"
          dismissible
          @input="validationErrors = []"
        >
          <div class="font-weight-bold mb-2">
            Please fix the following errors:
          </div>
          <ul class="mb-0">
            <li v-for="(error, idx) in validationErrors" :key="idx">
              {{ error }}
            </li>
          </ul>
        </v-alert>

        <!-- Parse Errors -->
        <v-alert
          v-if="parseErrors.length > 0"
          type="error"
          class="mt-4"
          dismissible
          @input="parseErrors = []"
        >
          <div class="font-weight-bold mb-2">CSV Parsing Errors:</div>
          <ul class="mb-0">
            <li v-for="(error, idx) in parseErrors" :key="idx">{{ error }}</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "CSVImportInventory",
  data() {
    return {
      csvFile: null,
      loading: false,
      error: null,
      success: null,
      validationErrors: [],
      parseErrors: [],
      progressDialog: false,
      savedCount: 0,
      progressMessage: "",
      inventoryItems: [],
      productList: [],
      statusOptions: [
        { text: "Available", value: "available" },
        { text: "Damaged", value: "damaged" },
        { text: "Reserved", value: "reserved" },
      ],
      typeOptions: [
        { text: "Film", value: "film" },
        { text: "Non-Film", value: "non-film" },
      ],
      headers: [
        { text: "Status", value: "rowStatus", sortable: false, width: "60px" },
        { text: "Product", value: "product", sortable: false, width: "200px" },
        { text: "Type", value: "type", sortable: false, width: "120px" },
        { text: "Batch #", value: "rollId", sortable: false, width: "120px" },
        { text: "Micron", value: "micron", sortable: false, width: "100px" },
        { text: "Width", value: "width", sortable: false, width: "100px" },
        {
          text: "Gross Weight (kg)",
          value: "grossWeight",
          sortable: false,
          width: "120px",
        },
        {
          text: "Net Weight (kg)",
          value: "netWeight",
          sortable: false,
          width: "120px",
        },
        { text: "Length (m)", value: "mtr", sortable: false, width: "100px" },
        { text: "Status", value: "status", sortable: false, width: "120px" },
        { text: "Actions", value: "actions", sortable: false, width: "80px" },
      ],
    };
  },
  computed: {
    ...mapGetters("products", ["allProducts"]),

    progressPercentage() {
      if (this.inventoryItems.length === 0) return 0;
      return (this.savedCount / this.inventoryItems.length) * 100;
    },

    validItemsCount() {
      return this.inventoryItems.filter((item) => !this.hasErrors(item)).length;
    },

    invalidItemsCount() {
      return this.inventoryItems.filter((item) => this.hasErrors(item)).length;
    },
  },
  async created() {
    await this.fetchProducts();
  },
  methods: {
    async fetchProducts() {
      try {
        await this.$store.dispatch("products/fetchProducts");
        this.productList = this.allProducts.map((product) => ({
          _id: product._id,
          name: product.name,
        }));
      } catch (error) {
        console.error("Error fetching products:", error);
        this.error = "Failed to load product list";
      }
    },

    downloadTemplate() {
      const headers = [
        "Product Name",
        "Type",
        "Batch Number",
        "Width",
        "Micron",
        "Gross Weight",
        "Net Weight",
        "Length",
        "Status",
      ];

      const sampleData = [
        [
          "Product A",
          "film",
          "",
          "100",
          "25",
          "50.5",
          "48.2",
          "1000",
          "available",
        ],
        [
          "Product B",
          "non-film",
          "BATCH001",
          "",
          "",
          "25.0",
          "24.5",
          "",
          "available",
        ],
      ];

      const csvContent = [
        headers.join(","),
        ...sampleData.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inventory_template.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    },

    async handleFileUpload(file) {
      if (!file) {
        return;
      }

      this.parseErrors = [];
      this.validationErrors = [];
      this.error = null;
      this.success = null;

      try {
        const text = await file.text();
        this.parseCSV(text);
      } catch (error) {
        console.error("Error reading file:", error);
        this.error = "Failed to read CSV file";
      }
    },

    parseCSV(text) {
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        this.parseErrors.push("CSV file is empty or has no data rows");
        return;
      }

      // Parse header
      const headers = lines[0].split(",").map((h) => h.trim());

      // Parse data rows
      const items = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());

        if (values.length !== headers.length) {
          this.parseErrors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        // Map CSV columns to item structure
        const productName = rowData["Product Name"] || "";
        const matchedProduct = this.productList.find(
          (p) => p.name.toLowerCase() === productName.toLowerCase()
        );

        const item = {
          product: matchedProduct || null,
          type: (rowData["Type"] || "film").toLowerCase(),
          rollId: rowData["Batch Number"] || "",
          width: this.parseNumber(rowData["Width"]),
          micron: this.parseNumber(rowData["Micron"]),
          grossWeight: this.parseNumber(rowData["Gross Weight"]),
          netWeight: this.parseNumber(rowData["Net Weight"]),
          mtr: this.parseNumber(rowData["Length"]),
          status: (rowData["Status"] || "available").toLowerCase(),
          errors: {},
          _originalProductName: productName,
        };

        // Validate product
        if (!matchedProduct && productName) {
          item.errors.product = `Product "${productName}" not found`;
        }

        items.push(item);
      }

      this.inventoryItems = items;

      if (items.length === 0) {
        this.parseErrors.push("No valid data rows found in CSV");
      } else {
        this.success = `Imported ${items.length} rows from CSV`;
        // Auto-validate after import
        setTimeout(() => {
          this.validateItems();
        }, 100);
      }
    },

    parseNumber(value) {
      if (!value || value === "") return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    },

    hasErrors(item) {
      return Object.keys(item.errors).length > 0;
    },

    handleProductSelection(index) {
      this.$set(this.inventoryItems[index].errors, "product", null);
    },

    removeRow(index) {
      this.inventoryItems.splice(index, 1);
    },

    clearAll() {
      this.inventoryItems = [];
      this.csvFile = null;
      this.validationErrors = [];
      this.parseErrors = [];
      this.error = null;
      this.success = null;
    },

    validateItems() {
      let isValid = true;
      const errors = [];

      this.inventoryItems.forEach((item, index) => {
        const itemErrors = {};
        const rowNumber = index + 1;

        // Reset errors for this item
        item.errors = {};

        // Validate required fields
        if (!item.product) {
          itemErrors.product = "Product is required";
          errors.push(`Row ${rowNumber}: Product is required`);
          isValid = false;
        }

        if (!item.type) {
          itemErrors.type = "Type is required";
          errors.push(`Row ${rowNumber}: Type is required`);
          isValid = false;
        }

        if (item.type === "non-film" && !item.rollId) {
          itemErrors.rollId = "Batch number is required for non-film items";
          errors.push(
            `Row ${rowNumber}: Batch number is required for non-film items`
          );
          isValid = false;
        }

        if (
          item.netWeight === null ||
          item.netWeight === undefined ||
          item.netWeight === "" ||
          item.netWeight < 0
        ) {
          itemErrors.netWeight = "Valid net weight is required";
          errors.push(`Row ${rowNumber}: Valid net weight is required`);
          isValid = false;
        }

        // Set errors for this item
        this.$set(this.inventoryItems, index, { ...item, errors: itemErrors });
      });

      this.validationErrors = errors;
      return isValid;
    },

    async validateAndSave() {
      if (!this.validateItems()) {
        return;
      }

      await this.saveAllItems();
    },

    async saveAllItems() {
      this.loading = true;
      this.progressDialog = true;
      this.savedCount = 0;
      this.error = null;
      this.success = null;

      const failedItems = [];

      try {
        for (let i = 0; i < this.inventoryItems.length; i++) {
          const item = this.inventoryItems[i];
          this.progressMessage = `Saving item ${i + 1}: ${item.product.name}`;

          try {
            const inventoryData = {
              productId: item.product._id,
              width: item.width || null,
              netWeight: Number(item.netWeight),
              grossWeight: item.grossWeight ? Number(item.grossWeight) : null,
              rollId: item.rollId || null,
              micron: item.micron || null,
              mtr: item.mtr || null,
              type: item.type,
              status: item.status,
            };

            await this.$store.dispatch("inventory/saveInventory", {
              inventoryId: null,
              inventoryData,
            });

            this.savedCount++;
          } catch (error) {
            console.error(`Error saving item ${i + 1}:`, error);
            failedItems.push(`Row ${i + 1}: ${item.product.name}`);
          }
        }

        // Show results
        if (failedItems.length === 0) {
          this.success = `Successfully saved all ${this.inventoryItems.length} inventory items`;
          this.inventoryItems = [];
          this.csvFile = null;
        } else {
          this.success = `Successfully saved ${this.savedCount} out of ${this.inventoryItems.length} items`;
          this.error = `Failed to save: ${failedItems.join(", ")}`;
        }

        // Auto-navigate after successful save
        if (failedItems.length === 0) {
          setTimeout(() => {
            this.$router.push({ name: "inventoryList" });
          }, 2000);
        }
      } catch (error) {
        console.error("Batch save error:", error);
        this.error = "An unexpected error occurred during batch save";
      } finally {
        this.loading = false;
        this.progressDialog = false;
        this.progressMessage = "";
      }
    },

    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>

<style scoped>
.v-data-table >>> .v-data-table__wrapper {
  overflow-x: auto;
}

.v-data-table >>> td {
  padding: 8px 4px !important;
}

.v-data-table >>> th {
  padding: 8px 4px !important;
}

.v-data-table >>> .v-input--dense .v-input__control {
  min-height: 32px;
}

.v-data-table >>> .v-text-field--outlined.v-input--dense .v-input__control {
  min-height: 32px;
}
</style>
