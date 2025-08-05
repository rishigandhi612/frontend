<template>
  <v-container fluid class="pa-6">
    <v-card class="mx-auto" max-width="800" elevation="4">
      <v-card-title class="primary white--text">
        <v-icon left color="white">mdi-email-send</v-icon>
        Send Purchase Order Email
      </v-card-title>
      
      <v-card-text class="pt-6">
        <v-form ref="form" v-model="valid" lazy-validation>
          <!-- Basic Information -->
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                :value="formData.email"
                @input="updateField('email', $event)"
                label="Supplier Email *"
                :rules="emailRules"
                outlined
                dense
                prepend-icon="mdi-email"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                :value="formData.supplierName"
                @input="updateField('supplierName', $event)"
                :items="customerOptions"
                label="Supplier Name *"
                :rules="[v => !!v || 'Required']"
                outlined
                dense
                clearable
                @change="onSupplierSelect"
              >
                <template v-slot:item="{ item }">
                  <v-list-item-content>
                    <v-list-item-title>{{ item.text }}</v-list-item-title>
                    <v-list-item-subtitle v-if="item.details && item.details.email">
                      {{ item.details.email }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                :value="formData.poNumber"
                @input="updateField('poNumber', $event)"
                label="PO Number *"
                :rules="[v => !!v || 'Required']"
                outlined
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                :value="calculatedTotal.toFixed(2)"
                label="Total Amount *"
                outlined
                dense
                readonly
                prefix="₹"
                class="font-weight-bold"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                :value="formData.orderDate"
                @input="updateField('orderDate', $event)"
                label="Order Date *"
                :rules="[v => !!v || 'Required']"
                outlined
                dense
                type="date"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                :value="formData.expectedDeliveryDate"
                @input="updateField('expectedDeliveryDate', $event)"
                label="Expected Delivery Date"
                outlined
                dense
                type="date"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Contact Information -->
          <v-row>
            <v-col cols="12">
              <v-textarea
                :value="formData.deliveryAddress"
                @input="updateField('deliveryAddress', $event)"
                label="Delivery Address"
                outlined
                rows="2"
                dense
              ></v-textarea>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                :value="formData.contactPerson"
                @input="updateField('contactPerson', $event)"
                label="Contact Person"
                outlined
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                :value="formData.phoneNumber"
                @input="updateField('phoneNumber', $event)"
                label="Phone Number"
                outlined
                dense
                prepend-icon="mdi-phone"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-text-field
                :value="formData.paymentTerms"
                @input="updateField('paymentTerms', $event)"
                label="Payment Terms"
                outlined
                dense
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Items Section -->
          <v-divider class="my-4"></v-divider>
          <h3 class="mb-3">
            <v-icon left>mdi-format-list-bulleted</v-icon>
            Items
            <v-chip class="ml-2" small color="primary" outlined>
              {{ formData.items.length }} item{{ formData.items.length !== 1 ? 's' : '' }}
            </v-chip>
          </h3>

          <div v-for="(item, index) in formData.items" :key="index" class="mb-4">
            <v-card outlined>
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" md="4">
                    <v-autocomplete
                      :value="item.name"
                      @input="updateItemField(index, 'name', $event)"
                      :items="productOptions"
                      label="Item Name *"
                      :rules="[v => !!v || 'Required']"
                      outlined
                      dense
                      clearable
                      :loading="loadingState.fetchProducts"
                      @change="onProductSelect(index, $event)"
                    >
                      <template v-slot:item="{ item: product }">
                        <v-list-item-content>
                          <v-list-item-title>{{ product.text }}</v-list-item-title>
                          <v-list-item-subtitle v-if="product.price">
                            ₹{{ product.price.toFixed(2) }}
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </template>
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      :value="item.quantity"
                      @input="updateItemField(index, 'quantity', parseInt($event) || 0)"
                      label="Quantity *"
                      :rules="[v => !!v || 'Required']"
                      outlined
                      dense
                      type="number"
                      min="1"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      :value="item.price"
                      @input="updateItemField(index, 'price', parseFloat($event) || 0)"
                      label="Price per unit *"
                      :rules="[v => !!v || 'Required']"
                      outlined
                      dense
                      type="number"
                      step="0.01"
                      prefix="₹"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="2" class="text-center">
                    <div class="subtitle-1 font-weight-bold text-primary">
                      ₹{{ ((item.quantity || 0) * (item.price || 0)).toFixed(2) }}
                    </div>
                    <v-btn 
                      icon 
                      small 
                      color="error" 
                      @click="removeItem(index)"
                      :disabled="formData.items.length === 1"
                      class="mt-1"
                    >
                      <v-icon small>mdi-delete</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>

          <v-btn 
            color="secondary" 
            outlined 
            @click="addItem"
            class="mb-4"
          >
            <v-icon left>mdi-plus</v-icon>
            Add Item
          </v-btn>

          <!-- Total Display -->
          <v-card color="grey lighten-4" class="mb-4">
            <v-card-text>
              <div class="d-flex justify-space-between align-center">
                <span class="text-h6">Total Amount:</span>
                <span class="text-h5 primary--text font-weight-bold">
                  ₹{{ calculatedTotal.toFixed(2) }}
                </span>
              </div>
              <div class="d-flex justify-space-between align-center mt-2">
                <span class="caption">Items: {{ formData.items.length }}</span>
                <span class="caption">
                  Total Qty: {{ formData.items.reduce((sum, item) => sum + (item.quantity || 0), 0) }}
                </span>
              </div>
            </v-card-text>
          </v-card>

          <!-- Action Buttons -->
          <v-row>
            <v-col cols="12" md="3">
              <v-btn 
                color="info" 
                outlined 
                block 
                @click="loadSampleData"
                :disabled="loadingState.sendEmail"
              >
                <v-icon left>mdi-auto-fix</v-icon>
                Load Sample
              </v-btn>
            </v-col>
            <v-col cols="12" md="3">
              <v-btn 
                color="secondary" 
                outlined 
                block 
                @click="resetForm"
                :disabled="loadingState.sendEmail"
              >
                <v-icon left>mdi-refresh</v-icon>
                Reset Form
              </v-btn>
            </v-col>
            <v-col cols="12" md="3">
              <v-btn 
                color="warning" 
                outlined 
                block 
                @click="refreshData"
                :loading="loadingState.fetchProducts || loadingState.fetchCustomers"
              >
                <v-icon left>mdi-database-refresh</v-icon>
                Refresh Data
              </v-btn>
            </v-col>
            <v-col cols="12" md="3">
              <v-btn 
                color="primary" 
                block 
                :disabled="!canSend || loadingState.sendEmail"
                :loading="loadingState.sendEmail"
                @click="sendEmail"
              >
                <v-icon left>mdi-send</v-icon>
                Send PO
              </v-btn>
            </v-col>
          </v-row>
        </v-form>

        <!-- Data Status Cards -->
        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <v-card outlined class="pa-2">
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-package-variant</v-icon>
                <span class="body-2">
                  <strong>Products Available:</strong> {{ availableProducts.length }}
                </span>
                <v-spacer></v-spacer>
                <v-progress-circular 
                  v-if="loadingState.fetchProducts" 
                  size="16" 
                  width="2" 
                  indeterminate
                ></v-progress-circular>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card outlined class="pa-2">
              <div class="d-flex align-center">
                <v-icon color="success" class="mr-2">mdi-account-multiple</v-icon>
                <span class="body-2">
                  <strong>Customers/Suppliers:</strong> {{ availableCustomers.length }}
                </span>
                <v-spacer></v-spacer>
                <v-progress-circular 
                  v-if="loadingState.fetchCustomers" 
                  size="16" 
                  width="2" 
                  indeterminate
                ></v-progress-circular>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Success/Error Messages -->
        <v-alert 
          v-if="successMessage" 
          type="success" 
          class="mt-4"
          dismissible
          @input="clearMessages"
        >
          {{ successMessage }}
        </v-alert>

        <v-alert 
          v-if="errorMessage" 
          type="error" 
          class="mt-4"
          dismissible
          @input="clearMessages"
        >
          {{ errorMessage }}
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'SendPOForm',
  data() {
    return {
      valid: false,
      emailRules: [
        v => !!v || 'Email is required',
        v => /.+@.+\..+/.test(v) || 'Email must be valid'
      ]
    }
  },
  
  computed: {
    ...mapState('sendPO', [
      'loadingState'
    ]),
    ...mapGetters('sendPO', [
      'formData',
      'availableProducts',
      'availableCustomers',
      'successMessage',
      'errorMessage',
      'calculatedTotal',
      'canSend',
      'productOptions',
      'customerOptions'
    ])
  },
  
  async created() {
    // Initialize the store when component is created
    await this.initializeStore();
  },
  
  async mounted() {
    // Load sample data for testing
    this.loadSampleData();
  },
  
  methods: {
    ...mapActions('sendPO', [
      'initializeStore',
      'fetchProductsFromInvoice',
      'fetchCustomersFromInvoice',
      'updateFormData',
      'addItem',
      'removeItem',
      'updateItem',
      'selectProduct',
      'loadSampleData',
      'resetForm',
      'sendPurchaseOrder',
      'clearMessages'
    ]),
    ...mapActions('invoices', {
      fetchInvoices: 'fetchInvoices'
    }),
    
    updateField(field, value) {
      this.updateFormData({ field, value });
    },
    
    updateItemField(index, field, value) {
      this.updateItem({ index, field, value });
    },
    
    onProductSelect(itemIndex, productId) {
      if (productId) {
        const product = this.availableProducts.find(p => p._id === productId);
        if (product) {
          this.selectProduct({ itemIndex, product });
        }
      }
    },
    
    onSupplierSelect(supplierName) {
      if (supplierName) {
        const supplier = this.availableCustomers.find(c => 
          (c.name || c.customerName) === supplierName
        );
        if (supplier && supplier.email) {
          this.updateField('email', supplier.email);
        }
        if (supplier && supplier.address) {
          this.updateField('deliveryAddress', supplier.address);
        }
        if (supplier && supplier.phone) {
          this.updateField('phoneNumber', supplier.phone);
        }
      }
    },
    
    async refreshData() {
      try {
        // First fetch invoices to get latest data
        await this.fetchInvoices();
        // Then fetch products and customers from updated invoices
        await Promise.all([
          this.fetchProductsFromInvoice(),
          this.fetchCustomersFromInvoice()
        ]);
        this.$refs.form?.resetValidation();
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    },
    
    async sendEmail() {
      if (!this.$refs.form.validate()) {
        return;
      }
      
      try {
        await this.sendPurchaseOrder();
        this.$refs.form.resetValidation();
      } catch (error) {
        console.error('Error sending purchase order:', error);
      }
    }
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}

.v-alert {
  border-radius: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .v-container {
    padding: 12px !important;
  }
}

/* Form styling */
.v-text-field, .v-textarea, .v-autocomplete {
  margin-bottom: 8px;
}

/* Item cards */
.v-card.outlined {
  border: 1px solid #e0e0e0;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.v-card.outlined:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
}

/* Total display */
.grey.lighten-4 {
  background-color: #f5f5f5 !important;
}

/* Loading state */
.v-btn--loading {
  pointer-events: none;
}

/* Status cards */
.v-card.outlined .v-card__text {
  padding: 8px 12px !important;
}

/* Enhanced autocomplete styling */
.v-autocomplete .v-input__slot {
  background-color: #fafafa;
}

.v-autocomplete.v-input--is-focused .v-input__slot {
  background-color: white;
}

/* Item total styling */
.text-primary {
  color: #1976d2 !important;
}

/* Chip styling */
.v-chip.v-chip--outlined {
  border-width: 1px;
}
</style>