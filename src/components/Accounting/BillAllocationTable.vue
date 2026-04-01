<template>
  <div class="bill-allocation">
    <!-- Bill Selection and Amount Input -->
    <v-card class="mb-4" outlined>
      <v-card-title>Add Bill Allocation</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="selectedBill"
              :items="unallocatedBills"
              item-text="invoiceNumber"
              item-value="id"
              label="Select Bill *"
              outlined
              dense
              :disabled="unallocatedBills.length === 0"
            >
              <template #item="{ item }">
                <div class="d-flex justify-space-between" style="width: 100%">
                  <span
                    ><strong>{{ item.invoiceno }}</strong></span
                  >
                  <span class="ml-4"
                    >₹{{ formatCurrency(item.openingAmount) }}</span
                  >
                  <span class="ml-4"
                    >₹{{ formatCurrency(item.allocatedAmount) }}</span
                  >
                  <span class="ml-4"
                    >₹{{ formatCurrency(item.pendingAmount) }}</span
                  >
                </div>
              </template>
              <template #selection="{ item }">
                {{ item.invoiceno }} - ₹{{
                  formatCurrency(item.openingAmount)
                }}
                - ₹{{ formatCurrency(item.allocatedAmount) }} - ₹{{
                  formatCurrency(item.pendingAmount)
                }}
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="allocationAmount"
              label="Amount to Allocate *"
              type="number"
              outlined
              dense
              :disabled="!selectedBill"
              min="0"
              :max="getSelectedBillAmount()"
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-end">
            <v-btn
              color="primary"
              block
              @click="addAllocation"
              :disabled="
                !selectedBill || !allocationAmount || allocationAmount <= 0
              "
            >
              <v-icon small>mdi-plus</v-icon>
              Add
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Allocated Bills List -->
    <v-card outlined>
      <v-card-title>
        Allocated Bills
        <v-spacer></v-spacer>
        <v-chip small :color="getTotalAllocatedColor()">
          ₹{{ formatCurrency(getTotalAllocatedAmount()) }} / ₹{{
            formatCurrency(totalAmount)
          }}
        </v-chip>
      </v-card-title>

      <v-list v-if="allocations.length > 0" two-line>
        <v-list-item v-for="(allocation, index) in allocations" :key="index">
          <v-list-item-content>
            <v-list-item-title>
              <strong>{{ getBillInvoiceNumber(allocation.billId) }}</strong>
            </v-list-item-title>
            <v-list-item-subtitle>
              Bill: ₹{{ formatCurrency(getBillAmount(allocation.billId)) }} |
              Allocated: ₹{{ formatCurrency(allocation.allocatedAmount) }} |
              Balance: ₹{{ formatCurrency(getBalance(allocation.billId)) }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn
              icon
              small
              color="error"
              @click="removeAllocation(allocation.billId)"
            >
              <v-icon small>mdi-delete</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <v-card-text v-else class="text-center text-muted">
        No bills allocated yet
      </v-card-text>

      <!-- Summary -->
      <v-divider></v-divider>
      <v-card-text>
        <v-row dense>
          <v-col cols="6">
            <div class="text-caption text-muted">Total Amount</div>
            <div class="text-h6 font-weight-bold">
              ₹{{ formatCurrency(totalAmount) }}
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-muted">Total Allocated</div>
            <div class="text-h6 font-weight-bold text-success">
              ₹{{ formatCurrency(getTotalAllocatedAmount()) }}
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-muted">Remaining</div>
            <div
              :class="['text-h6', 'font-weight-bold', getRemainingStyling()]"
            >
              ₹{{ formatCurrency(getRemainingAmount()) }}
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-muted">Status</div>
            <v-chip small :color="getAllocationStatusColor()">
              {{ getAllocationStatus() }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "BillAllocationTable",
  props: {
    bills: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    allocations: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      selectedBill: null,
      allocationAmount: null,
    };
  },
  computed: {
    unallocatedBills() {
      return this.normalizedBills.filter(
        (bill) =>
          bill.pendingAmount !== 0 &&
          !this.allocations.find((a) => a.billId === bill.id),
      );
    },
    normalizedBills() {
      // Normalize incoming bills to a consistent shape so component
      // works with both old and new (v2) API responses.
      const raw = this.bills || [];

      // If the prop is an object with `data` (v2 response), use that array
      const list = Array.isArray(raw) ? raw : raw.data || [];

      return list.map((b, idx) => {
        // v2 fields: invoiceno, allocatedAmount, pendingAmount, openingAmount
        if (b && (b.invoiceno || b.invoiceNumber)) {
          const invoiceno = b.invoiceno || b.invoiceNumber;
          const openingAmount = Number(b.openingAmount || 0);
          const allocatedAmount = Number(b.allocatedAmount || 0);
          const pendingAmount = Number(b.pendingAmount || 0);

          // billAmount: prefer openingAmount if present, else pending, else allocated
          const billAmount =
            openingAmount || pendingAmount || allocatedAmount || 0;

          return {
            id: b.id || invoiceno || `bill_${idx}`,
            invoiceno,
            invoiceNumber: invoiceno,
            openingAmount,
            allocatedAmount,
            pendingAmount,
            billAmount,
          };
        }

        // Fallback for legacy shape (id, invoiceNumber, billAmount)
        return {
          id: b.id || `bill_${idx}`,
          invoiceno: b.invoiceNumber || b.invoiceno || `INV-${idx}`,
          invoiceNumber: b.invoiceNumber || b.invoiceno || `INV-${idx}`,
          openingAmount: Number(b.openingAmount || 0),
          allocatedAmount: Number(b.allocatedAmount || 0) || 0,
          pendingAmount: Number(b.pendingAmount || 0) || 0,
          billAmount: Number(b.billAmount || b.amount || 0),
        };
      });
    },
  },
  methods: {
    getSelectedBillAmount() {
      if (!this.selectedBill) return 0;
      const bill = this.normalizedBills.find((b) => b.id === this.selectedBill);
      console.log("bill", bill);

      return bill ? bill.billAmount : 0;
    },

    getBillInvoiceNumber(billId) {
      const bill = this.normalizedBills.find((b) => b.id === billId);
      return bill ? bill.invoiceNumber : "Unknown";
    },

    getBillAmount(billId) {
      const bill = this.normalizedBills.find((b) => b.id === billId);
      return bill ? bill.billAmount : 0;
    },

    getBalance(billId) {
      const bill = this.normalizedBills.find((b) => b.id === billId);
      const allocated = this.allocations.find((a) => a.billId === billId);
      if (bill) {
        return bill.billAmount - (allocated ? allocated.allocatedAmount : 0);
      }
      return 0;
    },

    addAllocation() {
      console.log("are we at 252", this.selectedBill, this.allocationAmount);

      if (
        !this.selectedBill ||
        !this.allocationAmount ||
        this.allocationAmount <= 0
      ) {
        return;
      }

      const billAmount = this.getSelectedBillAmount();
      console.log("bill amount", billAmount);

      if (this.allocationAmount > billAmount) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: `Amount cannot exceed bill amount of ₹${billAmount}`,
          color: "error",
        });
        return;
      }

      this.$emit("add-bill", this.selectedBill);
      this.$emit("update-allocation", {
        billId: this.selectedBill,
        allocatedAmount: this.allocationAmount,
      });

      // Reset form
      this.selectedBill = null;
      this.allocationAmount = null;
    },

    removeAllocation(billId) {
      this.$emit("remove-bill", billId);
    },

    getTotalAllocatedAmount() {
      return this.allocations.reduce(
        (sum, alloc) => sum + (alloc.allocatedAmount || 0),
        0,
      );
    },

    getRemainingAmount() {
      return this.totalAmount - this.getTotalAllocatedAmount();
    },

    getAllocationStatus() {
      const remaining = this.getRemainingAmount();
      if (remaining === 0) return "Fully Allocated";
      if (remaining < 0) return "Over Allocated";
      return "Partially Allocated";
    },

    getAllocationStatusColor() {
      const remaining = this.getRemainingAmount();
      if (remaining === 0) return "green";
      if (remaining < 0) return "red";
      return "orange";
    },

    getTotalAllocatedColor() {
      const remaining = this.getRemainingAmount();
      if (remaining === 0) return "green";
      if (remaining < 0) return "red";
      return "blue";
    },

    getRemainingStyling() {
      const remaining = this.getRemainingAmount();
      if (remaining < 0) return "text-error";
      if (remaining === 0) return "text-success";
      return "text-warning";
    },

    formatCurrency(value) {
      if (!value && value !== 0) return "0.00";
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return "0.00";
      return numValue.toFixed(2);
    },
  },
  watch: {
    selectedBill(newVal) {
      if (newVal) {
        const billAmount = this.getSelectedBillAmount();
        const remaining = this.totalAmount - this.getTotalAllocatedAmount();
        // default allocation is remaining amount or bill amount whichever is smaller
        this.allocationAmount = Math.min(billAmount, remaining);
      } else {
        this.allocationAmount = null;
      }
    },
  },
};
</script>

<style scoped>
.bill-allocation {
  width: 100%;
}

.text-muted {
  color: #999;
}

.text-error {
  color: #d32f2f !important;
}

.text-success {
  color: #388e3c !important;
}

.text-warning {
  color: #f57f17 !important;
}

.d-flex {
  display: flex;
}

.justify-space-between {
  justify-content: space-between;
}

.align-end {
  align-items: flex-end;
}

.ml-4 {
  margin-left: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
