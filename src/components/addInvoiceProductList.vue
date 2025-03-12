// components/ProductList.vue
<template>
  <div>
    <v-row v-for="(product, index) in invoiceProducts" :key="index">
      <!-- Product Selection Column -->
      <v-col cols="12" md="3" class="pa-n ma-n">
        <v-select
          v-model="product.productId"
          :items="allProducts"
          item-text="name"
          item-value="_id"
          label="Select Product"
          return-object
          required
        />
      </v-col>

      <!-- Width Column -->
      <v-col cols="12" md="2" class="mt-0 py-0 pa-n ma-n">
        <v-text-field
          v-model="product.width"
          label="Width"
          :rules="[rules.required, rules.numeric]"
          required
          type="number"
          min="1"
          @input="updateTotalPrice(index)"
        />
      </v-col>

      <!-- Quantity Column -->
      <v-col cols="12" md="2" class="mt-0 py-0 pa-n ma-n">
        <v-text-field
          v-model="product.quantity"
          label="Quantity"
          :rules="[rules.required, rules.numeric]"
          required
          type="number"
          min="1"
          @input="updateTotalPrice(index)"
        />
      </v-col>

      <!-- Unit Price Column -->
      <v-col cols="12" md="2" class="mt-0 py-0 pa-n ma-n">
        <v-text-field
          v-model="product.unit_price"
          label="Unit Price"
          :rules="[rules.required, rules.numeric]"
          required
          type="number"
          min="0"
          @input="updateTotalPrice(index)"
        />
      </v-col>

      <!-- Total Price Column -->
      <v-col cols="12" md="2" class="mt-0 py-0 pa-n ma-n">
        <v-text-field
          :value="getTotalPrice(index)"
          label="Total Price"
          readonly
        />
      </v-col>

      <!-- Remove Product Button -->
      <v-col cols="12" md="1" class="d-flex align-center justify-start pl-n1 pa-n ma-n">
        <v-btn color="error" @click="removeProduct(index)" icon aria-label="Remove Product">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'ProductList',
  
  props: {
    invoiceProducts: {
      type: Array,
      required: true
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
  
  methods: {
    getTotalPrice(index) {
      const product = this.invoiceProducts[index];
      return (product.quantity * product.unit_price).toFixed(2);
    },
    
    updateTotalPrice(index) {
      const product = this.invoiceProducts[index];
      product.totalPrice = this.getTotalPrice(index);
      this.$emit('product-total-update');
    },
    
    removeProduct(index) {
      this.$emit('product-removed', index);
    }
  }
};
</script>

<style scoped>
.v-text-field[readonly] {
  background-color: #f5f5f5;
}
</style>