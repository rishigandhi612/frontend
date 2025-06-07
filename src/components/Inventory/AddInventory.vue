<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <v-card-title class="text-h4 justify-center">
            {{ isEditing ? 'Edit' : 'Add' }} Inventory Item
          </v-card-title>
          
          <v-divider class="my-4"></v-divider>
          
          <v-form ref="form" v-model="valid" @submit.prevent="saveInventory">
            <v-card-text>
              <v-row>
                <!-- Product Selection -->
                <v-col cols="12">
                  <v-autocomplete
                    v-model="form.productId"
                    :items="productList"
                    item-text="name"
                    item-value="_id"
                    label="Select Product"
                    :rules="[v => !!v || 'Product is required']"
                    @change="handleProductSelection"
                    return-object
                  ></v-autocomplete>
                </v-col>
                
                <!-- Product Name (shown when product selected) -->
                <v-col cols="12">
                  <v-text-field
                    v-model="selectedProductName"
                    label="Product Name"
                    readonly
                    :rules="[v => !!v || 'Product name is required']"
                  ></v-text-field>
                </v-col>
                
                <!-- Type Selection -->
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.type"
                    :items="typeOptions"
                    label="Type"
                    :rules="[v => !!v || 'Type is required']"
                  ></v-select>
                </v-col>
                
                <!-- Roll ID (Required for non-film) -->
                <v-col cols="12" sm="6" v-if="form.type === 'non-film'">
                  <v-text-field
                    v-model="form.rollId"
                    label="Batch Number"
                    :rules="[v => !!v || 'Batch Number is required']"
                    placeholder="Enter unique batch identifier"
                  ></v-text-field>
                </v-col>
                
                <!-- Net Weight (Required) -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="form.netWeight"
                    label="Net Weight"
                    type="number"
                    step="0.001"
                    min="0"
                    :rules="[
                      v => v !== null && v !== undefined && v !== '' || 'Net weight is required',
                      v => v >= 0 || 'Net weight must be positive'
                    ]"
                    suffix="kg"
                  ></v-text-field>
                </v-col>
                
                <!-- Status -->
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.status"
                    :items="statusOptions"
                    label="Status"
                    :rules="[v => !!v || 'Status is required']"
                  ></v-select>
                </v-col>
                
                <!-- Width (Optional) -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="form.width"
                    label="Width (Optional)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter width"
                  ></v-text-field>
                </v-col>
                
                <!-- Gross Weight (Optional) -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="form.grossWeight"
                    label="Gross Weight (Optional)"
                    type="number"
                    step="0.001"
                    min="0"
                    suffix="kg"
                    placeholder="Enter gross weight"
                  ></v-text-field>
                </v-col>
                
                <!-- Micron (Optional) -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="form.micron"
                    label="Micron (Optional)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter micron thickness"
                  ></v-text-field>
                </v-col>
                
                <!-- Meter (Optional) -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="form.mtr"
                    label="Length in Meters (Optional)"
                    type="number"
                    step="0.01"
                    min="0"
                    suffix="m"
                    placeholder="Enter length in meters"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
            
            <v-divider class="my-4"></v-divider>
            
            <v-card-actions class="justify-center">
              <v-btn
                type="submit"
                color="primary"
                :loading="loading"
                :disabled="!valid || loading"
              >
                <v-icon left>{{ isEditing ? 'mdi-content-save' : 'mdi-plus' }}</v-icon>
                {{ isEditing ? 'Update' : 'Create' }} Inventory Item
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
        
        <v-alert
          v-if="error"
          type="error"
          class="mt-4"
          dismissible
        >
          {{ error }}
        </v-alert>
        
        <v-alert
          v-if="success"
          type="success"
          class="mt-4"
          dismissible
        >
          {{ success }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'InventoryForm',
  data() {
    return {
      valid: false,
      loading: false,
      error: null,
      success: null,
      selectedProductName: '',
      form: {
        productId: null,
        width: null,
        netWeight: null,
        grossWeight: null,
        rollId: '',
        micron: null,
        mtr: null,
        type: 'film',
        status: 'available'
      },
      statusOptions: [
        { text: 'Available', value: 'available' },
        { text: 'Damaged', value: 'damaged' },
        { text: 'Reserved', value: 'reserved' }
      ],
      typeOptions: [
        { text: 'Film', value: 'film' },
        { text: 'Non-Film', value: 'non-film' }
      ],
      productList: []
    };
  },
  computed: {
    ...mapGetters('inventory', ['inventoryDetail']),
    ...mapGetters('products', ['allProducts']),
    
    isEditing() {
      return !!this.$route.params.id;
    },
    
    inventoryId() {
      return this.$route.params.id;
    }
  },
  async created() {
    await this.fetchProducts();
    
    if (this.isEditing) {
      await this.loadInventoryData();
    }
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
    
    async loadInventoryData() {
      this.loading = true;
      try {
        await this.$store.dispatch('inventory/fetchInventoryDetail', this.inventoryId);
        const inventoryItem = this.inventoryDetail;
        
        if (!inventoryItem) {
          this.error = 'Inventory item not found';
          return;
        }
        
        // Find the matching product in the product list
        const product = this.productList.find(p => p._id === inventoryItem.productId);
        
        // Populate the form with existing data
        this.form = {
          productId: product || null,
          width: inventoryItem.width,
          netWeight: inventoryItem.netWeight,
          grossWeight: inventoryItem.grossWeight,
          rollId: inventoryItem.rollId || '',
          micron: inventoryItem.micron,
          mtr: inventoryItem.mtr,
          type: inventoryItem.type || 'film',
          status: inventoryItem.status || 'available'
        };
        
        // Set the selected product name
        if (product) {
          this.selectedProductName = product.name;
        }
      } catch (error) {
        console.error('Error loading inventory data:', error);
        this.error = 'Failed to load inventory data';
      } finally {
        this.loading = false;
      }
    },
    
    handleProductSelection(product) {
      if (product) {
        this.selectedProductName = product.name;
      } else {
        this.selectedProductName = '';
      }
    },
    
    async saveInventory() {
      if (!this.$refs.form.validate()) return;
      
      this.loading = true;
      this.error = null;
      this.success = null;
      
      try {
        // Prepare the data to be sent to the API
        const inventoryData = {
          productId: this.form.productId._id,
          width: this.form.width || null,
          netWeight: Number(this.form.netWeight),
          grossWeight: this.form.grossWeight ? Number(this.form.grossWeight) : null,
          rollId: this.form.rollId || null,
          micron: this.form.micron || null,
          mtr: this.form.mtr || null,
          type: this.form.type,
          status: this.form.status
        };
        
        // Save the inventory item
        await this.$store.dispatch('inventory/saveInventory', {
          inventoryId: this.isEditing ? this.inventoryId : null,
          inventoryData
        });
        
        this.success = `Inventory item successfully ${this.isEditing ? 'updated' : 'created'}`;
        
        // If creating a new item, reset the form
        if (!this.isEditing) {
          this.$refs.form.reset();
          this.form = {
            productId: null,
            width: null,
            netWeight: null,
            grossWeight: null,
            rollId: '',
            micron: null,
            mtr: null,
            type: 'film',
            status: 'available'
          };
          this.selectedProductName = '';
        }
        
        // Optionally navigate back to inventory list
        setTimeout(() => {
          this.$router.push({ name: 'inventoryList' });
        }, 1500);
      } catch (error) {
        console.error('Error saving inventory:', error);
        this.error = `Failed to ${this.isEditing ? 'update' : 'create'} inventory item`;
      } finally {
        this.loading = false;
      }
    },
    
    goBack() {
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped>
/* Add component-specific styles here */
</style>