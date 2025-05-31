// components/BatchDialog.vue
<template>
  <v-dialog v-model="showDialog" max-width="800px">
    <v-card>
      <v-card-title class="headline">Batch Add Product</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-select
              v-model="batchProduct.productId"
              :items="allProducts"
              item-text="name"
              item-value="_id"
              label="Select Product"
              return-object
              required
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="batchProduct.unit_price"
              label="Unit Price"
              type="number"
              :rules="[rules.required, rules.numeric]"
              required
              min="0"
            />
          </v-col>
        </v-row>
        
        <!-- Batch Items Table -->
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th>Width</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in batchItems" :key="i">
                <td>
                  <v-text-field
                    v-model="item.width"
                    type="number"
                    dense
                    min="1"
                    hide-details
                    :rules="[rules.required, rules.numeric]"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model="item.quantity"
                    type="number" 
                    dense
                    min="1"
                    hide-details
                    :rules="[rules.required, rules.numeric]"
                  />
                </td>
                <td>
                  {{ calculateBatchItemTotal(item) }}
                </td>
                <td>
                  <v-btn 
                    icon 
                    color="error" 
                    @click="removeBatchItem(i)"
                    small
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
        
        <v-row class="mt-3">
          <v-col cols="12" class="d-flex justify-center">
            <v-btn color="primary" @click="addBatchItem">
              <v-icon left>mdi-plus</v-icon> Add Item
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey darken-1" text @click="closeBatchDialog">
          Cancel
        </v-btn>
        <v-btn 
          color="primary" 
          @click="addBatchProducts" 
          :disabled="!isBatchValid"
        >
          Add to Invoice
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'BatchDialog',
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    allProducts: {
      type: Array,
      required: true
    },
    rules: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      batchProduct: {
        productId: null,
        unit_price: 0
      },
      batchItems: [
        { width: 0, quantity: 1 }
      ]
    };
  },
  
  computed: {
    showDialog: {
      get() {
        return this.show;
      },
      set(value) {
        this.$emit('update:show', value);
      }
    },
    
    isBatchValid() {
      return this.batchProduct.productId && 
             this.batchProduct.unit_price > 0 && 
             this.batchItems.length > 0 &&
             !this.batchItems.some(item => 
               !item.width || isNaN(item.width) || 
               !item.quantity || isNaN(item.quantity)
             );
    }
  },
  
  watch: {
    show(newVal) {
      if (newVal) {
        this.resetForm();
      }
    }
  },
  
  methods: {
    resetForm() {
      this.batchProduct = {
        productId: null,
        unit_price: 0
      };
      this.batchItems = [
        { width: 0, quantity: 1 }
      ];
    },
    
    addBatchItem() {
  const lastItem = this.batchItems[this.batchItems.length - 1];
  const lastWidth = lastItem ? parseFloat(lastItem.width) || 0 : 0;
  const lastQty = lastItem ? parseFloat(lastItem.quantity) || 1 : 1;
  this.batchItems.push({ width: lastWidth, quantity: lastQty });
  },
  removeBatchItem(index) {
      this.batchItems.splice(index, 1);
    },
    
    calculateBatchItemTotal(item) {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(this.batchProduct.unit_price) || 0;
      return (quantity * unitPrice).toFixed(2);
    },
    
    closeBatchDialog() {
      this.showDialog = false;
    },
    
    addBatchProducts() {
      if (!this.batchProduct.productId || this.batchItems.length === 0) {
        return;
      }
      
      // Create products from batch items
      const batchProducts = this.batchItems.map(item => ({
        productId: this.batchProduct.productId,
        width: parseFloat(item.width),
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(this.batchProduct.unit_price),
        totalPrice: this.calculateBatchItemTotal(item)
      }));
      
      this.$emit('batch-products-added', batchProducts);
    }
  }
};
</script>