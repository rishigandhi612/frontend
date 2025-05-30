<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <v-card-title class="text-h4 justify-center">
            Batch Add Inventory Items
          </v-card-title>
          
          <v-divider class="my-4"></v-divider>
          
          <!-- Batch Controls -->
          <v-row class="mb-4">
            <v-col cols="12" sm="6">
              <v-btn 
                @click="addRow" 
                color="primary" 
                :disabled="loading"
              >
                <v-icon left>mdi-plus</v-icon>
                Add Row
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6" class="text-right">
              <v-chip color="info" outlined>
                Total Items: {{ inventoryItems.length }}
              </v-chip>
            </v-col>
          </v-row>
          
          <!-- Batch Inventory Table -->
          <v-card outlined>
            <v-card-title class="text-h6">
              Inventory Items
              <v-spacer></v-spacer>
              <v-btn 
                @click="clearAll" 
                color="error" 
                text 
                small
                :disabled="loading || inventoryItems.length === 0"
              >
                <v-icon left small>mdi-delete</v-icon>
                Clear All
              </v-btn>
            </v-card-title>
            
            <v-data-table
              :headers="headers"
              :items="inventoryItems"
              :hide-default-footer="true"
              disable-pagination
              class="elevation-0"
            >
              <!-- Product Selection Column -->
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
                  style="min-width: 200px;"
                ></v-autocomplete>
                <div v-if="item.errors.product" class="error--text caption">
                  {{ item.errors.product }}
                </div>
              </template>
              
              <!-- Type Selection Column -->
              <template slot="item.type" slot-scope="{ item }">
                <v-select
                  v-model="item.type"
                  :items="typeOptions"
                  label="Type"
                  dense
                  hide-details
                  :error="!!item.errors.type"
                  style="min-width: 120px;"
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
                  style="min-width: 120px;"
                ></v-text-field>
                <span v-else class="grey--text">N/A</span>
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
                  style="min-width: 120px;"
                ></v-text-field>
              </template>
              
              <!-- Width Column -->
              <template slot="item.width" slot-scope="{ item }">
                <v-text-field
                  v-model.number="item.width"
                  label="Width"
                  type="number"
                  step="0.01"
                  min="0"
                  dense
                  hide-details
                  style="min-width: 100px;"
                ></v-text-field>
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
                  style="min-width: 120px;"
                ></v-text-field>
              </template>
              
              <!-- Micron Column -->
              <template slot="item.micron" slot-scope="{ item }">
                <v-text-field
                  v-model.number="item.micron"
                  label="Micron"
                  type="number"
                  step="0.01"
                  min="0"
                  dense
                  hide-details
                  style="min-width: 100px;"
                ></v-text-field>
              </template>
              
              <!-- Meter Column -->
              <template slot="item.mtr" slot-scope="{ item }">
                <v-text-field
                  v-model.number="item.mtr"
                  label="Length"
                  type="number"
                  step="0.01"
                  min="0"
                  dense
                  hide-details
                  suffix="m"
                  style="min-width: 100px;"
                ></v-text-field>
              </template>
              
              <!-- Status Column -->
              <template slot="item.status" slot-scope="{ item }">
                <v-select
                  v-model="item.status"
                  :items="statusOptions"
                  label="Status"
                  dense
                  hide-details
                  style="min-width: 120px;"
                ></v-select>
              </template>
              
              <!-- Actions Column -->
              <template slot="item.actions" slot-scope="{index}">
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
            
            <!-- Empty State -->
            <div v-if="inventoryItems.length === 0" class="text-center pa-8">
              <v-icon size="64" color="grey lighten-2">mdi-package-variant</v-icon>
              <p class="grey--text mt-4">No inventory items added yet</p>
              <v-btn @click="addRow" color="primary">
                <v-icon left>mdi-plus</v-icon>
                Add First Item
              </v-btn>
            </div>
          </v-card>
          
          <v-divider class="my-4"></v-divider>
          
          <!-- Submit Actions -->
          <v-card-actions class="justify-center">
            <v-btn
              @click="validateAndSave"
              color="primary"
              large
              :loading="loading"
              :disabled="loading || inventoryItems.length === 0"
            >
              <v-icon left>mdi-content-save</v-icon>
              Save All Inventory Items ({{ inventoryItems.length }})
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <!-- Progress Dialog -->
        <v-dialog v-model="progressDialog" persistent width="400">
          <v-card>
            <v-card-title>
              Saving Inventory Items
            </v-card-title>
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
          <div class="font-weight-bold mb-2">Please fix the following errors:</div>
          <ul class="mb-0">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'BatchInventoryForm',
  data() {
    return {
      loading: false,
      error: null,
      success: null,
      validationErrors: [],
      progressDialog: false,
      savedCount: 0,
      progressMessage: '',
      inventoryItems: [],
      productList: [],
      statusOptions: [
        { text: 'Available', value: 'available' },
        { text: 'Damaged', value: 'damaged' },
        { text: 'Reserved', value: 'reserved' }
      ],
      typeOptions: [
        { text: 'Film', value: 'film' },
        { text: 'Non-Film', value: 'non-film' }
      ],
      headers: [
        { text: 'Product', value: 'product', sortable: false, width: '200px' },
        { text: 'Type', value: 'type', sortable: false, width: '120px' },
        { text: 'Batch #', value: 'rollId', sortable: false, width: '120px' },
        { text: 'Net Weight (kg)', value: 'netWeight', sortable: false, width: '120px' },
        { text: 'Width', value: 'width', sortable: false, width: '100px' },
        { text: 'Gross Weight (kg)', value: 'grossWeight', sortable: false, width: '120px' },
        { text: 'Micron', value: 'micron', sortable: false, width: '100px' },
        { text: 'Length (m)', value: 'mtr', sortable: false, width: '100px' },
        { text: 'Status', value: 'status', sortable: false, width: '120px' },
        { text: 'Actions', value: 'actions', sortable: false, width: '80px' }
      ]
    };
  },
  computed: {
    ...mapGetters('products', ['allProducts']),
    
    progressPercentage() {
      if (this.inventoryItems.length === 0) return 0;
      return (this.savedCount / this.inventoryItems.length) * 100;
    }
  },
  async created() {
    await this.fetchProducts();
    // Add one initial row
    this.addRow();
  },
  methods: {
    async fetchProducts() {
      try {
        await this.$store.dispatch('products/fetchProducts');
        this.productList = this.allProducts.map(product => ({
          _id: product._id,
          name: product.name
        }));
      } catch (error) {
        console.error('Error fetching products:', error);
        this.error = 'Failed to load product list';
      }
    },
    
    createEmptyItem() {
      return {
        product: null,
        width: null,
        netWeight: null,
        grossWeight: null,
        rollId: '',
        micron: null,
        mtr: null,
        type: 'film',
        status: 'available',
        errors: {}
      };
    },
    
    addRow() {
      this.inventoryItems.push(this.createEmptyItem());
    },
    
    removeRow(index) {
      this.inventoryItems.splice(index, 1);
    },
    
    clearAll() {
      this.inventoryItems = [];
      this.validationErrors = [];
      this.error = null;
      this.success = null;
    },
    
    handleProductSelection(index) {
      // Clear any previous product error
      this.$set(this.inventoryItems[index].errors, 'product', null);
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
          itemErrors.product = 'Product is required';
          errors.push(`Row ${rowNumber}: Product is required`);
          isValid = false;
        }
        
        if (!item.type) {
          itemErrors.type = 'Type is required';
          errors.push(`Row ${rowNumber}: Type is required`);
          isValid = false;
        }
        
        if (item.type === 'non-film' && !item.rollId) {
          itemErrors.rollId = 'Batch number is required for non-film items';
          errors.push(`Row ${rowNumber}: Batch number is required for non-film items`);
          isValid = false;
        }
        
        if (item.netWeight === null || item.netWeight === undefined || item.netWeight === '' || item.netWeight < 0) {
          itemErrors.netWeight = 'Valid net weight is required';
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
              status: item.status
            };
            
            await this.$store.dispatch('inventory/saveInventory', {
              inventoryId: null,
              inventoryData
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
          this.addRow(); // Add one new empty row
        } else {
          this.success = `Successfully saved ${this.savedCount} out of ${this.inventoryItems.length} items`;
          this.error = `Failed to save: ${failedItems.join(', ')}`;
        }
        
        // Auto-navigate after successful save
        if (failedItems.length === 0) {
          setTimeout(() => {
            this.$router.push({ name: 'inventoryList' });
          }, 2000);
        }
        
      } catch (error) {
        console.error('Batch save error:', error);
        this.error = 'An unexpected error occurred during batch save';
      } finally {
        this.loading = false;
        this.progressDialog = false;
        this.progressMessage = '';
      }
    },
    
    goBack() {
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped>
/* Custom styles for the batch form */
.v-data-table >>> .v-data-table__wrapper {
  overflow-x: auto;
}

.v-data-table >>> td {
  padding: 8px 4px !important;
}

.v-data-table >>> th {
  padding: 8px 4px !important;
}

/* Make form fields more compact in table */
.v-data-table >>> .v-input--dense .v-input__control {
  min-height: 32px;
}

.v-data-table >>> .v-text-field--outlined.v-input--dense .v-input__control {
  min-height: 32px;
}
</style>