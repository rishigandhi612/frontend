<template>
  <div class="receipt-container">
    <v-card>
      <v-card-title>Record Receipt</v-card-title>
      <v-card-subtitle
        >Enter payment details and allocate against bills</v-card-subtitle
      >

      <v-card-text>
        <v-form ref="form" @submit.prevent="submitReceipt">
          <!-- Row 1: Customer Selection and Total Amount -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="receipt.customerId"
                :items="allCustomers"
                item-text="name"
                item-value="_id"
                label="Select Customer *"
                placeholder="Search customer..."
                :loading="isLoadingCustomers"
                outlined
                dense
                clearable
                :rules="[(v) => !!v || 'Customer is required']"
                @change="onCustomerChange"
              >
                <template v-slot:item="{ item }">
                  <div>
                    <strong>{{ item.name }}</strong
                    ><br />
                    <small>ID: {{ item._id }}</small>
                  </div>
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="receipt.totalAmount"
                label="Total Amount Received *"
                type="number"
                outlined
                dense
                :rules="[
                  (v) => !!v || 'Amount is required',
                  (v) => v > 0 || 'Amount must be greater than 0',
                ]"
              />
            </v-col>
          </v-row>

          <!-- Row 2: Payment Method and Bank -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-select
                v-model="receipt.paymentMethod"
                :items="paymentMethods"
                label="Payment Method *"
                outlined
                dense
                :rules="[(v) => !!v || 'Payment method is required']"
                @change="resetPaymentFields"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="receipt.bankId"
                :items="allBanks"
                item-text="name"
                item-value="_id"
                label="Select Bank *"
                placeholder="Search bank..."
                :loading="isLoadingBanks"
                outlined
                dense
                clearable
                :rules="[(v) => !!v || 'Bank is required']"
              >
                <template v-slot:item="{ item }">
                  <div>
                    <strong>{{ item.name }}</strong
                    ><br />
                    <small>{{ item.accountNumber }}</small>
                  </div>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>

          <!-- Row 3: Payment-specific Fields -->
          <v-row v-if="receipt.paymentMethod === 'NEFT_RTGS'">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="receipt.utrNumber"
                label="UTR Number *"
                outlined
                dense
                :rules="[(v) => !!v || 'UTR Number is required for NEFT/RTGS']"
              />
            </v-col>
          </v-row>

          <v-row v-if="receipt.paymentMethod === 'UPI'">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="receipt.upiId"
                label="UPI ID / Transaction ID *"
                outlined
                dense
                :rules="[(v) => !!v || 'UPI ID is required']"
              />
            </v-col>
          </v-row>

          <v-row v-if="receipt.paymentMethod === 'CHEQUE'">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="receipt.chequeNumber"
                label="Cheque Number *"
                outlined
                dense
                :rules="[(v) => !!v || 'Cheque Number is required']"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="receipt.chequeDate"
                label="Cheque Date *"
                type="date"
                outlined
                dense
                :rules="[(v) => !!v || 'Cheque Date is required']"
              />
            </v-col>
          </v-row>

          <!-- Row 4: Voucher Date and Narration -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="receipt.voucherDate"
                label="Voucher Date *"
                type="date"
                outlined
                dense
                :rules="[(v) => !!v || 'Voucher Date is required']"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="receipt.narration"
                label="Narration/Description"
                outlined
                dense
              />
            </v-col>
          </v-row>

          <!-- Bill Allocation Section -->
          <v-divider class="my-4"></v-divider>

          <h3 class="mb-3">Bill Allocations</h3>

          <v-row v-if="!receipt.customerId" class="mb-3">
            <v-col cols="12">
              <v-alert type="info" outlined>
                Please select a customer to view their bills
              </v-alert>
            </v-col>
          </v-row>

          <v-row v-else>
            <v-col cols="12">
              <bill-allocation-table
                :bills="customerBills"
                :loading="isLoadingBills"
                :total-amount="receipt.totalAmount"
                :allocations="receipt.allocations"
                @update-allocation="updateAllocation"
                @add-bill="addBillAllocation"
                @remove-bill="removeBillAllocation"
              />
            </v-col>
          </v-row>

          <!-- Summary Section -->
          <v-row class="mt-4">
            <v-col cols="12">
              <v-card outlined>
                <v-card-text>
                  <v-row dense>
                    <v-col cols="12">
                      <v-alert
                        v-if="getUnallocatedAmount() !== 0"
                        :type="getUnallocatedAmount() < 0 ? 'error' : 'warning'"
                        dense
                        outlined
                        class="mb-2"
                      >
                        {{
                          getUnallocatedAmount() < 0
                            ? "Allocated amount exceeds total receipt amount."
                            : "Please allocate the full amount before saving."
                        }}
                      </v-alert>
                    </v-col>
                    <v-col cols="6">
                      <strong>Total Amount:</strong> ₹{{
                        formatCurrency(receipt.totalAmount)
                      }}
                    </v-col>
                    <v-col cols="6">
                      <strong>Total Allocated:</strong>
                      ₹{{ formatCurrency(getTotalAllocated()) }}
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col cols="6">
                      <strong>Unallocated Amount:</strong>
                      <span :class="getUnallocatedClass()">
                        ₹{{ formatCurrency(getUnallocatedAmount()) }}
                      </span>
                    </v-col>
                    <v-col cols="6">
                      <strong>Status:</strong>
                      <v-chip
                        :color="getStatusColor()"
                        text-color="white"
                        small
                      >
                        {{ getAllocationStatus() }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Action Buttons -->
          <v-row class="mt-4">
            <v-col cols="12" class="d-flex gap-2">
              <v-btn
                color="primary"
                @click="submitReceipt"
                :loading="isCreatingReceipt"
                :disabled="!canSubmit || isCreatingReceipt"
              >
                Save Receipt
              </v-btn>
              <v-btn text @click="resetForm"> Clear </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import BillAllocationTable from "./BillAllocationTable.vue";

export default {
  name: "AddReceipt",
  components: {
    BillAllocationTable,
  },
  data() {
    return {
      receipt: {
        customerId: null,
        totalAmount: null,
        paymentMethod: null,
        bankId: null,
        utrNumber: "",
        upiId: "",
        chequeNumber: "",
        chequeDate: "",
        voucherDate: new Date().toISOString().split("T")[0],
        narration: "",
        allocations: [],
      },
      paymentMethods: ["NEFT_RTGS", "CASH", "UPI", "CHEQUE"],
      step: 1,
    };
  },
  computed: {
    ...mapGetters("customers", ["allCustomers", "isLoading: isLoading"]),
    ...mapGetters("banks", ["allBanks", "isLoading: isLoading"]),
    ...mapGetters("accounting", [
      "customerBills",
      "isLoadingBills",
      "getLoadingState",
    ]),
    isLoadingCustomers() {
      return this.$store.state.customers.loading;
    },
    isLoadingBanks() {
      return this.$store.state.banks.loading;
    },
    isCreatingReceipt() {
      return this.getLoadingState.createReceipt;
    },
    canSubmit() {
      // require customer, amount, at least one allocation, and no unallocated remainder
      return (
        this.receipt.customerId &&
        this.receipt.totalAmount &&
        this.receipt.allocations.length > 0 &&
        this.getUnallocatedAmount() === 0
      );
    },
    stepOneValid() {
      // basic required fields for the first step
      if (!this.receipt.customerId || !this.receipt.totalAmount) return false;
      if (!this.receipt.paymentMethod || !this.receipt.bankId) return false;
      // payment-specific validations
      if (this.receipt.paymentMethod === "NEFT_RTGS" && !this.receipt.utrNumber)
        return false;
      if (this.receipt.paymentMethod === "UPI" && !this.receipt.upiId)
        return false;
      if (
        this.receipt.paymentMethod === "CHEQUE" &&
        (!this.receipt.chequeNumber || !this.receipt.chequeDate)
      )
        return false;
      if (!this.receipt.voucherDate) return false;
      return true;
    },
    stepTwoValid() {
      return (
        this.receipt.allocations.length > 0 && this.getUnallocatedAmount() === 0
      );
    },
  },
  methods: {
    ...mapActions("customers", ["fetchCustomers"]),
    ...mapActions("banks", ["fetchBanks"]),
    ...mapActions("accounting", ["fetchCustomerBills", "createReceipt"]),

    goToStep(n) {
      // allow manual step navigation from UI buttons
      this.step = n;
    },

    async onCustomerChange() {
      if (this.receipt.customerId) {
        try {
          await this.fetchCustomerBills(this.receipt.customerId);
          this.receipt.allocations = [];
        } catch (error) {
          this.$store.commit("snackbar/SHOW_SNACKBAR", {
            message: "Failed to fetch customer bills",
            color: "error",
          });
        }
      }
    },

    updateAllocation(allocation) {
      const index = this.receipt.allocations.findIndex(
        (a) => a.billId === allocation.billId,
      );
      if (index !== -1) {
        this.receipt.allocations[index] = allocation;
      }
    },

    addBillAllocation(billId) {
      const bill = this.customerBills.find((b) => b.id === billId);
      if (bill) {
        this.receipt.allocations.push({
          billId: bill.id,
          allocatedAmount: 0,
        });
      }
    },

    removeBillAllocation(billId) {
      this.receipt.allocations = this.receipt.allocations.filter(
        (a) => a.billId !== billId,
      );
    },

    getTotalAllocated() {
      return this.receipt.allocations.reduce(
        (sum, alloc) => sum + (alloc.allocatedAmount || 0),
        0,
      );
    },

    getUnallocatedAmount() {
      return (this.receipt.totalAmount || 0) - this.getTotalAllocated();
    },

    getAllocationStatus() {
      const unallocated = this.getUnallocatedAmount();
      if (unallocated === 0) return "Fully Allocated";
      if (unallocated < 0) return "Over Allocated";
      return "Partially Allocated";
    },

    getStatusColor() {
      const unallocated = this.getUnallocatedAmount();
      if (unallocated === 0) return "green";
      if (unallocated < 0) return "red";
      return "orange";
    },

    getUnallocatedClass() {
      const unallocated = this.getUnallocatedAmount();
      if (unallocated < 0) return "text-error";
      return "text-warning";
    },

    formatCurrency(value) {
      if (!value) return "0.00";
      return value.toFixed(2);
    },

    resetPaymentFields() {
      this.receipt.utrNumber = "";
      this.receipt.upiId = "";
      this.receipt.chequeNumber = "";
      this.receipt.chequeDate = "";
    },

    async submitReceipt() {
      if (!this.$refs.form.validate()) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Please fill all required fields correctly",
          color: "error",
        });
        return;
      }

      // Validate allocations
      if (this.receipt.allocations.length === 0) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Please allocate at least one bill",
          color: "error",
        });
        return;
      }

      // Prepare payload based on payment method
      const payload = {
        customerId: this.receipt.customerId,
        totalAmount: this.receipt.totalAmount,
        paymentMethod: this.receipt.paymentMethod,
        bankId: this.receipt.bankId,
        voucherDate: this.receipt.voucherDate,
        narration: this.receipt.narration,
        allocations: this.receipt.allocations,
      };

      // Add payment-specific fields
      if (this.receipt.paymentMethod === "NEFT_RTGS") {
        payload.utrNumber = this.receipt.utrNumber;
      } else if (this.receipt.paymentMethod === "UPI") {
        payload.upiId = this.receipt.upiId;
      } else if (this.receipt.paymentMethod === "CHEQUE") {
        payload.chequeNumber = this.receipt.chequeNumber;
        payload.chequeDate = this.receipt.chequeDate;
      }

      try {
        await this.createReceipt(payload);
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Receipt created successfully",
          color: "success",
        });
        this.resetForm();
      } catch (error) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: error.response?.data?.message || "Failed to create receipt",
          color: "error",
        });
      }
    },

    resetForm() {
      this.$refs.form.reset();
      this.receipt = {
        customerId: null,
        totalAmount: null,
        paymentMethod: null,
        bankId: null,
        utrNumber: "",
        upiId: "",
        chequeNumber: "",
        chequeDate: "",
        voucherDate: new Date().toISOString().split("T")[0],
        narration: "",
        allocations: [],
      };
    },
  },
  async mounted() {
    try {
      await Promise.all([this.fetchCustomers(), this.fetchBanks()]);

      // If customer ID is passed via query parameter, set it
      if (this.$route.query.customerId) {
        this.receipt.customerId = this.$route.query.customerId;
        await this.onCustomerChange();
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  },
};
</script>

<style scoped>
.receipt-container {
  padding: 20px;
}

.gap-2 {
  gap: 8px;
}

.text-error {
  color: #d32f2f !important;
}

.text-warning {
  color: #f57f17 !important;
}
</style>
