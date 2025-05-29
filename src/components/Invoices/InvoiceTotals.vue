<template>
    <v-row class="mt-3">
      <!-- Total Items Price -->
      <v-col cols="12" md="4">
        <v-text-field
          :value="calculateTotalItemsPrice()"
          label="Total Items Price"
          readonly
        />
      </v-col>
  
      <!-- Other Charges -->
      <v-col cols="12" md="4">
        <v-text-field
          :value="otherCharges"
          @input="updateOtherCharges"
          label="Other Charges"
          type="number"
          min="0"
        />
      </v-col>
  
      <!-- Debug Info -->
      <v-col cols="12" v-if="debug">
        <div class="debug-info" style="color: red; font-size: 12px;">
          Debug: GST Starts with 27: {{ gstStartsWith27 }} | 
          GST Number: {{ customerGstNumber }} | 
          Is Intra-State: {{ isIntraStateTransaction }}
        </div>
      </v-col>
  
      <!-- For intra-state transactions: CGST and SGST -->
      <template v-if="isIntraStateTransaction">
        <!-- Total CGST -->
        <v-col cols="12" md="4">
          <v-text-field
            :value="calculateTax(0.09)"
            label="Total CGST (9%)"
            @input="updateCgst"
            readonly
          />
        </v-col>
  
        <!-- Total SGST -->
        <v-col cols="12" md="4">
          <v-text-field
            :value="calculateTax(0.09)"
            label="Total SGST (9%)"
            @input="updateSgst"
            readonly
          />
        </v-col>
      </template>
  
      <!-- For inter-state transactions: IGST -->
      <template v-else>
        <!-- Total IGST -->
        <v-col cols="12" md="4">
          <v-text-field
            :value="calculateTax(0.18)"
            label="Total IGST (18%)"
            @input="updateIgst"
            readonly
          />
        </v-col>
      </template>
      
      <!-- Grand Total -->
      <v-col cols="12" md="4" class="mt-3">
        <v-text-field
          :value="calculateGrandTotal()"
          label="Grand Total"
          readonly
        />
      </v-col>
    </v-row>
  </template>
  
  <script>
  export default {
    name: 'InvoiceTotals',
    
    props: {
      invoiceProducts: {
        type: Array,
        required: true
      },
      otherCharges: {
        type: [Number, String],
        default: 0
      },
      selectedCustomer: {
        type: Object,
        default: null
      }
    },
    
    data() {
      return {
        debug: true // Set to false in production
      };
    },
    
    computed: {
      customerGstNumber() {
        // Check different possible properties where GST number might be stored
        if (!this.selectedCustomer) return null;
        
        return this.selectedCustomer.gstin
      },
      
      gstStartsWith27() {
        if (!this.customerGstNumber) return false;
        return this.customerGstNumber.toString().startsWith('27');
      },
      
      isIntraStateTransaction() {
        console.log('Selected Customer:', this.selectedCustomer);
        console.log('GST Number:', this.customerGstNumber);
        console.log('Starts with 27:', this.gstStartsWith27);
        
        return this.gstStartsWith27;
      }
    },
    
    created() {
      console.log('InvoiceTotals component created with customer:', this.selectedCustomer);
      this.$emit('intra-state-update', this.isIntraStateTransaction);
    },
    
    watch: {
      isIntraStateTransaction(newValue) {
        console.log('isIntraStateTransaction changed to:', newValue);
        this.$emit('intra-state-update', newValue);
      }
    },
    
    methods: {
      updateOtherCharges(value) {
        this.$emit('update:other-charges', value);
      },
      
      updateCgst(value) {
        this.$emit('update:cgst', value);
      },
      
      updateSgst(value) {
        this.$emit('update:sgst', value);
      },
      
      updateIgst(value) {
        this.$emit('update:igst', value);
      },
      
      calculateTotalItemsPrice() {
        return this.invoiceProducts
          .reduce((sum, product) => {
            const totalPrice = parseFloat(product.quantity * product.unit_price) || 0;
            return sum + totalPrice;
          }, 0)
          .toFixed(2);
      },
      
      calculateTax(rate) {
        const totalItemsPrice = parseFloat(this.calculateTotalItemsPrice());
        const totalWithOtherCharges = totalItemsPrice + (parseFloat(this.otherCharges) || 0);
        return (totalWithOtherCharges * rate).toFixed(2);
      },
      
      calculateGrandTotal() {
        const totalItemsPrice = this.invoiceProducts.reduce((sum, product) => {
          const totalPrice = parseFloat(product.quantity * product.unit_price) || 0;
          return sum + totalPrice;
        }, 0);
  
        const otherCharges = parseFloat(this.otherCharges) || 0;
        const totalWithOtherCharges = totalItemsPrice + otherCharges;
  
        // Tax is always 18% total, either split as CGST+SGST or as single IGST
        const tax = totalWithOtherCharges * 0.18;
  
        return Math.round(totalWithOtherCharges + tax);
      }
    }
  };
  </script>
  
  <style scoped>
  .v-text-field[readonly] {
    background-color: #f5f5f5;
  }
  
  .debug-info {
    border: 1px dashed red;
    padding: 5px;
    margin-bottom: 10px;
    background-color: #fff9f9;
  }
  </style>