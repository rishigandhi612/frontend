<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12" md="2" class="pt-5">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>

      <v-col cols="12" md="8" class="pt-5">
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
                  <v-autocomplete
                    :value="formData.supplierName"
                    @input="updateField('supplierName', $event)"
                    :items="customerOptions"
                    label="Supplier Name *"
                    :rules="[(v) => !!v || 'Required']"
                    outlined
                    dense
                    clearable
                    @change="onSupplierSelect"
                  >
                    <template v-slot:item="{ item }">
                      <v-list-item-content>
                        <v-list-item-title>{{ item.text }}</v-list-item-title>
                        <v-list-item-subtitle
                          v-if="item.details && item.details.email_id"
                        >
                          {{ item.details.email_id }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :value="formData.email"
                    @input="updateField('email', $event)"
                    label="Supplier Email *"
                    :rules="emailRules"
                    outlined
                    dense
                    prepend-icon="mdi-email"
                    readonly
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    :value="formData.orderDate"
                    @input="updateField('orderDate', $event)"
                    label="Order Date *"
                    :rules="[(v) => !!v || 'Required']"
                    outlined
                    dense
                    type="date"
                    prepend-icon="mdi-calendar-month-outline"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    :value="formData.expectedDeliveryDate"
                    @input="updateField('expectedDeliveryDate', $event)"
                    label="Expected Delivery Date"
                    outlined
                    dense
                    type="date"
                    prepend-icon="mdi-calendar-month-outline"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    :value="formData.deliveryType"
                    @input="updateField('deliveryType', $event)"
                    :items="deliveryOptions"
                    label="Delivery Type *"
                    :rules="[(v) => !!v || 'Required']"
                    outlined
                    dense
                    prepend-icon="mdi-truck"
                  ></v-select>
                </v-col>
              </v-row>

              <!-- Third Party Customer Selection (only shown when Third Party Delivery is selected) -->
              <v-row v-if="formData.deliveryType === 'THIRD_PARTY_DELIVERY'">
                <v-col cols="12">
                  <v-autocomplete
                    :value="formData.thirdPartyCustomerId"
                    @input="updateField('thirdPartyCustomerId', $event)"
                    :items="thirdPartyCustomerOptions"
                    label="Select Third Party Customer *"
                    :rules="
                      formData.deliveryType === 'THIRD_PARTY_DELIVERY'
                        ? [(v) => !!v || 'Required for third party delivery']
                        : []
                    "
                    outlined
                    dense
                    clearable
                    prepend-icon="mdi-account-multiple"
                    @change="onThirdPartyCustomerSelect"
                  >
                    <template v-slot:item="{ item }">
                      <v-list-item-content>
                        <v-list-item-title>{{ item.text }}</v-list-item-title>
                        <v-list-item-subtitle
                          v-if="item.details && item.details.email_id"
                        >
                          {{ item.details.email_id }} |
                          {{ item.details.phone_no }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </template>
                  </v-autocomplete>
                </v-col>
              </v-row>

              <!-- Items Section -->
              <v-divider class="my-4"></v-divider>
              <h3 class="mb-3">
                <v-icon left>mdi-format-list-bulleted</v-icon>
                Items
                <v-chip class="ml-2" small color="primary" outlined>
                  {{ formData.items.length }} item{{
                    formData.items.length !== 1 ? "s" : ""
                  }}
                </v-chip>
              </h3>

              <v-card
                outlined
                v-for="(item, index) in formData.items"
                :key="index"
              >
                <v-card-text>
                  <v-row align="start" justify="start" class="mb-n5">
                    <!-- Item Name -->
                    <v-col cols="12" md="3">
                      <v-autocomplete
                        :value="item.name"
                        @input="updateItemField(index, 'name', $event)"
                        :items="productOptions"
                        label="Item Name *"
                        :rules="[(v) => !!v || 'Required']"
                        outlined
                        dense
                        clearable
                        :loading="loadingState.fetchProducts"
                        @change="onProductSelect(index, $event)"
                      >
                        <template v-slot:item="{ item: product }">
                          <v-list-item-content>
                            <v-list-item-title>{{
                              product.text
                            }}</v-list-item-title>
                            <v-list-item-subtitle
                              v-if="
                                product.details && product.details.description
                              "
                            >
                              {{ product.details.description }}
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </template>
                      </v-autocomplete>
                    </v-col>

                    <!-- Description -->
                    <!-- <v-col cols="12" md="6">
                        <v-text-field
                          :value="item.description"
                          @input="updateItemField(index, 'description', $event)"
                          label="Description"
                          outlined
                          dense
                        ></v-text-field>
                      </v-col> -->

                    <!-- Pack Size -->
                    <v-col cols="12" md="3">
                      <v-text-field
                        :value="item.packSize"
                        @input="
                          updateItemField(
                            index,
                            'packSize',
                            parseFloat($event) || 0
                          );
                          calculateTotalQty(index);
                        "
                        label="Pack Size *"
                        :rules="[(v) => !!v || 'Required']"
                        outlined
                        dense
                        type="number"
                        min="0"
                        step="0.01"
                      ></v-text-field>
                    </v-col>

                    <!-- Nos -->
                    <v-col cols="12" md="2">
                      <v-text-field
                        :value="item.nos"
                        @input="
                          updateItemField(index, 'nos', parseInt($event) || 0);
                          calculateTotalQty(index);
                        "
                        label="Nos *"
                        :rules="[(v) => !!v || 'Required']"
                        outlined
                        dense
                        type="number"
                        min="1"
                      ></v-text-field>
                    </v-col>

                    <!-- Total Qty -->
                    <v-col cols="12" md="2">
                      <v-text-field
                        :value="item.totalQty"
                        @input="
                          updateItemField(
                            index,
                            'totalQty',
                            parseInt($event) || 0
                          )
                        "
                        label="Total Qty *"
                        :rules="[(v) => !!v || 'Required']"
                        outlined
                        dense
                        type="number"
                        min="1"
                        readonly
                        @blur="calculateTotalQty(index)"
                      ></v-text-field>
                    </v-col>

                    <!-- Delete Button -->
                    <v-col cols="12" md="1">
                      <v-btn color="secondary" @click="addItem" icon>
                        <v-icon small> mdi-plus </v-icon>
                      </v-btn>
                    </v-col>
                    <v-col cols="12" md="1">
                      <v-btn
                        icon
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

              <!-- Remarks Section -->
              <v-divider class="my-4"></v-divider>
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    :value="formData.remarks"
                    @input="updateField('remarks', $event)"
                    label="Special Remarks / Instructions"
                    outlined
                    auto-grow
                    rows="1"
                    placeholder="Enter any special instructions or remarks for this purchase order..."
                    prepend-icon="mdi-note-text"
                  ></v-textarea>
                </v-col>
              </v-row>

              <!-- Items Summary -->
              <!-- <v-card color="grey lighten-4" class="mb-4">
                <v-card-text>
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-h6">Items Summary:</span>
                    <span class="text-h6 primary--text font-weight-bold">
                      {{ formData.items.length }} item{{
                        formData.items.length !== 1 ? "s" : ""
                      }}
                    </span>
                  </div>
                  <div class="d-flex justify-space-between align-center mt-2">
                    <span class="caption">
                      Total Quantity:
                      {{
                        formData.items.reduce(
                          (sum, item) => sum + (item.totalQty || 0),
                          0
                        )
                      }}
                    </span>
                    <span class="caption">
                      Total Pieces:
                      {{
                        formData.items.reduce(
                          (sum, item) => sum + (item.nos || 0),
                          0
                        )
                      }}
                    </span>
                  </div>
                </v-card-text>
              </v-card> -->

              <!-- Action Buttons -->
              <v-row justify="end" align="center" no-gutters>
                <!-- <v-col cols="12" md="4">
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
                </v-col> -->
                <!-- <v-col cols="12" md="4">
                  <v-btn
                    color="warning"
                    outlined
                    block
                    @click="refreshData"
                    :loading="
                      loadingState.fetchProducts || loadingState.fetchCustomers
                    "
                  >
                    <v-icon left>mdi-database-refresh</v-icon>
                    Refresh Data
                  </v-btn>
                </v-col> -->
                <v-col cols="12" md="4" class="d-flex align-end justify-end">
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

            <!-- Delivery Information Display -->
            <!-- <v-row class="mt-4" v-if="formData.deliveryType">
              <v-col cols="12">
                <v-card outlined class="pa-3">
                  <div class="d-flex align-center mb-2">
                    <v-icon color="info" class="mr-2">mdi-information</v-icon>
                    <span class="font-weight-bold">Delivery Information</span>
                  </div>
                  <div class="body-2">
                    <strong>Delivery Type:</strong>
                    {{
                      formData.deliveryType === "NORMAL_DELIVERY"
                        ? "Normal Delivery"
                        : "Third Party Delivery"
                    }}
                  </div>
                  <div
                    v-if="
                      formData.deliveryType === 'THIRD_PARTY_DELIVERY' &&
                      selectedThirdPartyCustomer
                    "
                    class="body-2 mt-2"
                  >
                    <strong>Third Party Customer:</strong>
                    {{ selectedThirdPartyCustomer.name }}<br />
                    <strong>Email:</strong>
                    {{ selectedThirdPartyCustomer.email_id }}<br />
                    <strong>Phone:</strong>
                    {{ selectedThirdPartyCustomer.phone_no }}<br />
                    <strong>Address:</strong>
                    {{ selectedThirdPartyCustomer.address.line1 }},
                    {{ selectedThirdPartyCustomer.address.city }},
                    {{ selectedThirdPartyCustomer.address.state }} -
                    {{ selectedThirdPartyCustomer.address.pincode }}
                  </div>
                </v-card>
              </v-col>
            </v-row> -->

            <!-- Data Status Cards -->
            <!-- <v-row class="mt-4">
              <v-col cols="12" md="6">
                <v-card outlined class="pa-2">
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-2"
                      >mdi-package-variant</v-icon
                    >
                    <span class="body-2">
                      <strong>Products Available:</strong>
                      {{ availableProducts.length }}
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
                    <v-icon color="success" class="mr-2"
                      >mdi-account-multiple</v-icon
                    >
                    <span class="body-2">
                      <strong>Customers Available:</strong>
                      {{ availableCustomers.length }}
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
            </v-row> -->

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
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapGetters, mapActions } from "vuex";

export default {
  name: "SendPOForm",
  data() {
    return {
      valid: false,
      emailRules: [
        (v) => !!v || "Email is required",
        (v) => /.+@.+\..+/.test(v) || "Email must be valid",
      ],
      // Delivery type options
      deliveryOptions: [
        { text: "Normal Delivery", value: "NORMAL_DELIVERY" },
        { text: "Third Party Delivery", value: "THIRD_PARTY_DELIVERY" },
      ],
      // Contact person dropdown options
      contactPersonOptions: [
        { text: "Rishi Gandhi", value: "Rishi Gandhi" },
        { text: "Hemant Gandhi", value: "Hemant Gandhi" },
      ],
      // Phone number dropdown options
      phoneNumberOptions: [
        { text: "+91 98765 43210 (Rishi Gandhi)", value: "+91 98765 43210" },
        { text: "+91 87654 32109 (Hemant Gandhi)", value: "+91 87654 32109" },
        { text: "+91 76543 21098 (Office)", value: "+91 76543 21098" },
        { text: "+91 65432 10987 (Alternate)", value: "+91 65432 10987" },
      ],
    };
  },

  computed: {
    ...mapState("sendPO", ["loadingState", "selectedThirdPartyCustomer"]),
    ...mapGetters("sendPO", [
      "formData",
      "availableProducts",
      "availableCustomers",
      "successMessage",
      "errorMessage",
      "canSend",
      "productOptions",
      "customerOptions",
      "thirdPartyCustomerOptions",
    ]),
  },

  async created() {
    // Initialize the store when component is created
    await this.initializeStore();
  },

  async mounted() {
    // Fetch customers from API
    await this.fetchCustomersFromAPI();
    // Load sample data for testing products
    this.loadSampleData();
  },

  methods: {
    ...mapActions("sendPO", [
      "initializeStore",
      "fetchProductsFromInvoice",
      "fetchCustomersFromAPI",
      "updateFormData",
      "addItem",
      "removeItem",
      "updateItem",
      "selectProduct",
      "loadSampleData",
      "resetForm",
      "sendPurchaseOrder",
      "clearMessages",
    ]),

    updateField(field, value) {
      this.updateFormData({ field, value });
    },

    // updateItemField(index, field, value) {
    //   this.updateItem({ index, field, value });
    // },
    calculateTotalQty(index) {
      const item = this.formData.items[index];
      if (item.packSize && item.nos) {
        const totalQty = parseFloat(item.packSize) * parseInt(item.nos);
        this.updateItem({ index, field: "totalQty", value: totalQty });
      } else {
        // If either packSize or nos is empty/zero, set totalQty to 0
        this.updateItem({ index, field: "totalQty", value: 0 });
      }
    },

    updateItemField(index, field, value) {
      this.updateItem({ index, field, value });

      // Auto-calculate total when packSize or nos changes
      if (field === "packSize" || field === "nos") {
        this.$nextTick(() => {
          this.calculateTotalQty(index);
        });
      }
    },
    onProductSelect(itemIndex, productId) {
      if (productId) {
        const product = this.availableProducts.find((p) => p._id === productId);
        if (product) {
          this.selectProduct({ itemIndex, product });
        }
      }
    },

    onSupplierSelect(supplierName) {
      if (supplierName) {
        const supplier = this.availableCustomers.find(
          (c) => c.name === supplierName
        );
        if (supplier) {
          // Auto-fill email from customer data
          this.updateField("email", supplier.email_id || "");
          // Store selected supplier for potential use
          this.updateField("selectedSupplier", supplier);
        }
      }
    },

    onThirdPartyCustomerSelect(customerId) {
      if (customerId) {
        const customer = this.availableCustomers.find(
          (c) => c._id === customerId
        );
        if (customer) {
          // Store selected third party customer details
          this.updateFormData({
            field: "selectedThirdPartyCustomer",
            value: customer,
          });
        }
      }
    },

    onContactPersonSelect(contactPerson) {
      // Auto-select corresponding phone number when contact person is selected
      if (contactPerson === "Rishi Gandhi") {
        this.updateField("phoneNumber", "+91 98765 43210");
      } else if (contactPerson === "Hemant Gandhi") {
        this.updateField("phoneNumber", "+91 87654 32109");
      }
    },
    goBack() {
      this.$router.go(-1);
    },

    // async refreshData() {
    //   try {
    //     // Fetch customers from API and products
    //     await Promise.all([
    //       this.fetchCustomersFromAPI(),
    //       this.fetchProductsFromInvoice(),
    //     ]);
    //     this.$refs.form?.resetValidation();
    //   } catch (error) {
    //     console.error("Error refreshing data:", error);
    //   }
    // },

    async sendEmail() {
      if (!this.$refs.form.validate()) {
        return;
      }

      try {
        await this.sendPurchaseOrder();
        this.$refs.form.resetValidation();
        this.$refs.form.reset();
        this.$router.push("/dashboard");
      } catch (error) {
        console.error("Error sending purchase order:", error);
      }
    },
  },
};
</script>
