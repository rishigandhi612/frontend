<template>
  <div class="receipt-container">
    <!-- Unsaved Changes Dialog -->
    <v-dialog v-model="showUnsavedDialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="text-h6">Discard unsaved changes?</v-card-title>
        <v-card-text>
          You have unsaved changes to this receipt. If you leave now, your
          changes will be lost.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="cancelNavigation">Stay on page</v-btn>
          <v-btn color="error" text @click="confirmNavigation">
            Discard &amp; leave
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card :loading="isLoadingDetail">
      <v-card-title>
        {{ isEditMode ? "Edit Receipt" : "Record Receipt" }}
        <v-chip
          v-if="isEditMode && receipt.voucherId"
          class="ml-3"
          small
          outlined
          color="primary"
        >
          {{ receipt.voucherId }}
        </v-chip>
        <v-chip
          v-if="isDirty"
          class="ml-2"
          small
          color="orange"
          text-color="white"
        >
          Unsaved changes
        </v-chip>
      </v-card-title>
      <v-card-subtitle>
        {{
          isEditMode
            ? "Update payment details and bill allocations"
            : "Enter payment details and optionally allocate against bills"
        }}
      </v-card-subtitle>

      <v-card-text>
        <v-alert v-if="loadDetailError" type="error" outlined class="mb-4">
          {{ loadDetailError }}
        </v-alert>

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
                :disabled="isEditMode"
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
                v-if="receipt.paymentMethod !== 'CASH'"
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
                :rules="[
                  (v) =>
                    receipt.paymentMethod === 'CASH' ||
                    !!v ||
                    'Bank is required for non-cash payments',
                ]"
              >
                <template v-slot:item="{ item }">
                  <div>
                    <strong>{{ item.name }}</strong
                    ><br />
                    <small>{{ item.accountNumber }}</small>
                  </div>
                </template>
              </v-autocomplete>
              <v-alert
                v-else
                type="info"
                dense
                outlined
                class="mt-1"
                style="font-size: 13px"
              >
                No bank required for cash payments.
              </v-alert>
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
                v-model="receipt.upiRef"
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

          <!-- Row 4: Voucher Date, Reference, and Narration -->
          <v-row>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="receipt.voucherDate"
                label="Voucher Date *"
                type="date"
                outlined
                dense
                :rules="[(v) => !!v || 'Voucher Date is required']"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="receipt.reference"
                label="Reference"
                outlined
                dense
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="receipt.narration"
                label="Narration / Description"
                outlined
                dense
              />
            </v-col>
          </v-row>

          <!-- Bill Allocation Section -->
          <v-divider class="my-4" />
          <h3 class="mb-3">Bill Allocations (Optional)</h3>

          <v-row v-if="!receipt.customerId" class="mb-3">
            <v-col cols="12">
              <v-alert type="info" outlined>
                Please select a customer to view their bills
              </v-alert>
            </v-col>
          </v-row>

          <v-row v-else>
            <v-col cols="12">
              <v-alert type="info" dense outlined class="mb-3">
                Any amount not allocated to bills will be saved as on-account
                for this customer.
              </v-alert>
              <bill-allocation-table
                :bills="customerBills"
                :loading="isLoadingBills"
                :total-amount="receipt.totalAmount"
                :allocations="receipt.allocations"
                :original-allocations="originalAllocations"
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
                        :type="getUnallocatedAmount() < 0 ? 'error' : 'info'"
                        dense
                        outlined
                        class="mb-2"
                      >
                        {{
                          getUnallocatedAmount() < 0
                            ? "Allocated amount exceeds total receipt amount."
                            : getTotalAllocated() === 0
                            ? "Entire receipt will be recorded as on-account."
                            : "Remaining amount will be recorded as on-account."
                        }}
                      </v-alert>
                    </v-col>
                    <v-col cols="6">
                      <strong>Total Amount:</strong> ₹{{
                        formatCurrency(receipt.totalAmount)
                      }}
                    </v-col>
                    <v-col cols="6">
                      <strong>Allocated to Bills:</strong> ₹{{
                        formatCurrency(getTotalAllocated())
                      }}
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col cols="6">
                      <strong>On-account Amount:</strong>
                      <span :class="getUnallocatedClass()">
                        ₹{{ formatCurrency(getOnAccountAmount()) }}
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
                {{ isEditMode ? "Update Receipt" : "Save Receipt" }}
              </v-btn>
              <v-btn text @click="handleClear">
                {{ isEditMode ? "Reset Changes" : "Clear" }}
              </v-btn>
              <v-btn
                v-if="isEditMode"
                text
                color="grey"
                @click="$router.back()"
              >
                Cancel
              </v-btn>
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

// Helper: base64url-encode a receipt number for safe URL usage
const encodeReceiptPathId = (receiptNumber) =>
  btoa(receiptNumber)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// Blank receipt state factory
const blankReceipt = () => ({
  customerId: null,
  voucherId: null,
  totalAmount: null,
  paymentMethod: null,
  bankId: null,
  utrNumber: "",
  upiRef: "",
  chequeNumber: "",
  chequeDate: "",
  voucherDate: new Date().toISOString().split("T")[0],
  reference: "",
  narration: "",
  allocations: [],
});

export default {
  name: "AddEditReceipt",

  components: { BillAllocationTable },

  // Navigation guard: warn about unsaved changes when leaving the route
  beforeRouteLeave(to, from, next) {
    if (this.isDirty && !this.forcedLeave) {
      this.pendingNavNext = next;
      this.showUnsavedDialog = true;
    } else {
      next();
    }
  },

  data() {
    return {
      receipt: blankReceipt(),
      // Snapshot of the last saved/loaded state for dirty-checking
      savedSnapshot: null,
      paymentMethods: ["NEFT_RTGS", "CASH", "UPI", "CHEQUE"],
      isLoadingDetail: false,
      loadDetailError: null,
      originalAllocations: [],
      // Unsaved-changes dialog
      showUnsavedDialog: false,
      pendingNavNext: null,
      forcedLeave: false,
    };
  },

  computed: {
    ...mapGetters("customers", ["allCustomers"]),
    ...mapGetters("banks", ["allBanks"]),
    ...mapGetters("accounting", [
      "customerBills",
      "isLoadingBills",
      "getLoadingState",
    ]),

    isEditMode() {
      return !!this.$route.params.id;
    },

    isLoadingCustomers() {
      return this.$store.state.customers.loading;
    },
    isLoadingBanks() {
      return this.$store.state.banks.loading;
    },
    isCreatingReceipt() {
      return this.getLoadingState.createReceipt;
    },

    isDirty() {
      if (!this.savedSnapshot) return false;
      return JSON.stringify(this.receipt) !== this.savedSnapshot;
    },

    canSubmit() {
      return this.stepOneValid && this.getUnallocatedAmount() >= 0;
    },

    stepOneValid() {
      if (!this.receipt.customerId || !this.receipt.totalAmount) return false;
      if (!this.receipt.paymentMethod) return false;
      if (this.receipt.paymentMethod !== "CASH" && !this.receipt.bankId)
        return false;
      if (this.receipt.paymentMethod === "NEFT_RTGS" && !this.receipt.utrNumber)
        return false;
      if (this.receipt.paymentMethod === "UPI" && !this.receipt.upiRef)
        return false;
      if (
        this.receipt.paymentMethod === "CHEQUE" &&
        (!this.receipt.chequeNumber || !this.receipt.chequeDate)
      )
        return false;
      if (!this.receipt.voucherDate) return false;
      return true;
    },
  },

  methods: {
    ...mapActions("customers", ["fetchCustomers"]),
    ...mapActions("banks", ["fetchBanks"]),
    ...mapActions("accounting", [
      "fetchCustomerBills",
      "fetchReceiptDetail",
      "createReceipt",
      "updateReceipt",
    ]),

    // ── Load & map ──────────────────────────────────────────────────────────

    async loadReceiptForEdit(receiptId) {
      this.isLoadingDetail = true;
      this.loadDetailError = null;
      console.log("473");
      try {
        const pathId = receiptId.includes("/")
          ? encodeReceiptPathId(receiptId)
          : receiptId;
        console.log("477");
        const data = await this.fetchReceiptDetail(pathId); // ✅ use return value directly
        console.log("479", data);
        this.mapApiDataToForm(data);
        await this.fetchCustomerBills(data.customerId);
        this.takeSnapshot();
      } catch (err) {
        this.loadDetailError =
          err?.response?.data?.message ||
          "Failed to load receipt. Please try again.";
      } finally {
        this.isLoadingDetail = false;
      }
    },

    mapApiDataToForm(data) {
      this.receipt = {
        customerId: data.customerId,
        voucherId: data.voucherId,
        totalAmount: parseFloat(data.totalAmount),
        paymentMethod: data.paymentMethod,
        bankId: data.bankId || null,
        utrNumber: data.utrNumber || "",
        upiRef: data.upiRef || "",
        chequeNumber: data.chequeNumber || "",
        // API returns ISO date; strip to YYYY-MM-DD for <input type="date">
        chequeDate: data.chequeDate ? data.chequeDate.split("T")[0] : "",
        voucherDate: data.voucherDate
          ? data.voucherDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        reference: data.reference || "",
        narration: data.narration || "",
        // Only keep bill allocations (billId !== null); on-account is derived
        allocations: (data.allocations || [])
          .filter((a) => a.billId !== null)
          .map((a) => ({
            billId: a.billId,
            allocatedAmount: parseFloat(a.allocatedAmount),
            narration: a.narration || null,
          })),
      };
      this.originalAllocations = (data.allocations || [])
        .filter((a) => a.billId !== null)
        .map((a) => ({
          billId: a.billId,
          allocatedAmount: parseFloat(a.allocatedAmount),
        }));
    },

    takeSnapshot() {
      this.savedSnapshot = JSON.stringify(this.receipt);
    },

    // ── Customer change ──────────────────────────────────────────────────────

    async onCustomerChange() {
      if (this.receipt.customerId) {
        try {
          await this.fetchCustomerBills(this.receipt.customerId);
          if (!this.isEditMode) this.receipt.allocations = [];
        } catch {
          this.$store.commit("snackbar/SHOW_SNACKBAR", {
            message: "Failed to fetch customer bills",
            color: "error",
          });
        }
      }
    },

    // ── Allocation helpers ───────────────────────────────────────────────────

    updateAllocation(allocation) {
      const index = this.receipt.allocations.findIndex(
        (a) => a.billId === allocation.billId,
      );
      if (index !== -1) {
        this.$set(this.receipt.allocations, index, allocation);
      }
    },

    addBillAllocation(billId) {
      const alreadyAllocated = this.receipt.allocations.some(
        (a) => a.billId === billId,
      );
      if (!alreadyAllocated) {
        this.receipt.allocations.push({ billId, allocatedAmount: 0 });
      }
    },

    removeBillAllocation(billId) {
      this.receipt.allocations = this.receipt.allocations.filter(
        (a) => a.billId !== billId,
      );
    },

    getTotalAllocated() {
      return this.receipt.allocations.reduce(
        (sum, a) => sum + (Number(a.allocatedAmount) || 0),
        0,
      );
    },

    getUnallocatedAmount() {
      return (this.receipt.totalAmount || 0) - this.getTotalAllocated();
    },

    getOnAccountAmount() {
      return Math.max(this.getUnallocatedAmount(), 0);
    },

    getAllocationStatus() {
      const unallocated = this.getUnallocatedAmount();
      if (unallocated < 0) return "Over Allocated";
      if (this.getTotalAllocated() === 0 && this.receipt.totalAmount)
        return "On-account Only";
      if (unallocated === 0) return "Fully Allocated";
      return "Partially Allocated";
    },

    getStatusColor() {
      const u = this.getUnallocatedAmount();
      if (u < 0) return "red";
      if (this.getTotalAllocated() === 0 && this.receipt.totalAmount)
        return "blue";
      if (u === 0) return "green";
      return "orange";
    },

    getUnallocatedClass() {
      const u = this.getUnallocatedAmount();
      if (u < 0) return "text-error";
      if (u === 0) return "text-success";
      return "text-info";
    },

    formatCurrency(value) {
      if (!value && value !== 0) return "0.00";
      return Number(value).toFixed(2);
    },

    resetPaymentFields() {
      this.receipt.utrNumber = "";
      this.receipt.upiRef = "";
      this.receipt.chequeNumber = "";
      this.receipt.chequeDate = "";
      if (this.receipt.paymentMethod === "CASH") {
        this.receipt.bankId = null;
      }
    },

    // ── Submit ───────────────────────────────────────────────────────────────

    async submitReceipt() {
      if (!this.$refs.form.validate()) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Please fill all required fields correctly",
          color: "error",
        });
        return;
      }

      if (this.getUnallocatedAmount() < 0) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: "Allocated amount cannot exceed the receipt total",
          color: "error",
        });
        return;
      }

      const allocations = this.receipt.allocations
        .filter((a) => a.billId && Number(a.allocatedAmount) > 0)
        .map((a) => ({
          billId: a.billId,
          allocatedAmount: Number(a.allocatedAmount),
          ...(a.narration ? { narration: a.narration } : {}),
        }));

      const payload = {
        customerId: this.receipt.customerId,
        totalAmount: this.receipt.totalAmount,
        paymentMethod: this.receipt.paymentMethod,
        bankId:
          this.receipt.paymentMethod === "CASH" ? null : this.receipt.bankId,
        voucherDate: this.receipt.voucherDate,
        reference: this.receipt.reference || null,
        narration: this.receipt.narration || null,
        allocations,
      };

      if (this.receipt.paymentMethod === "NEFT_RTGS") {
        payload.utrNumber = this.receipt.utrNumber;
      } else if (this.receipt.paymentMethod === "UPI") {
        payload.upiRef = this.receipt.upiRef;
      } else if (this.receipt.paymentMethod === "CHEQUE") {
        payload.chequeNumber = this.receipt.chequeNumber;
        payload.chequeDate = this.receipt.chequeDate;
      }

      try {
        if (this.isEditMode) {
          // Build path id from voucherId if present, else use route param
          const rawId = this.receipt.voucherId || this.$route.params.receiptId;
          const pathId = rawId.includes("/")
            ? encodeReceiptPathId(rawId)
            : rawId;

          await this.updateReceipt({ pathId, payload });
          this.$store.commit("snackbar/SHOW_SNACKBAR", {
            message: "Receipt updated successfully",
            color: "success",
          });
          // Re-snapshot so isDirty resets after save
          this.takeSnapshot();
        } else {
          await this.createReceipt(payload);
          this.$store.commit("snackbar/SHOW_SNACKBAR", {
            message: "Receipt created successfully",
            color: "success",
          });
          this.forcedLeave = true;
          this.resetForm();
        }
      } catch (error) {
        this.$store.commit("snackbar/SHOW_SNACKBAR", {
          message: error.response?.data?.message || "Failed to save receipt",
          color: "error",
        });
      }
    },

    // ── Reset / clear ────────────────────────────────────────────────────────

    handleClear() {
      if (this.isEditMode) {
        // Re-load from last snapshot to reset unsaved changes
        const snap = JSON.parse(this.savedSnapshot);
        this.receipt = snap;
      } else {
        this.resetForm();
      }
    },

    resetForm() {
      this.$refs.form && this.$refs.form.reset();
      this.receipt = blankReceipt();
      this.savedSnapshot = JSON.stringify(this.receipt);
    },

    // ── Unsaved changes dialog ────────────────────────────────────────────────

    cancelNavigation() {
      this.showUnsavedDialog = false;
      this.pendingNavNext = null;
    },

    confirmNavigation() {
      this.showUnsavedDialog = false;
      if (this.pendingNavNext) {
        this.pendingNavNext();
        this.pendingNavNext = null;
      }
    },
  },

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async mounted() {
    try {
      await Promise.all([this.fetchCustomers(), this.fetchBanks()]);
    } catch (err) {
      console.error("Error loading reference data:", err);
    }

    if (this.isEditMode) {
      await this.loadReceiptForEdit(this.$route.params.id);
    } else {
      // Create mode — take snapshot of blank form
      this.takeSnapshot();

      // Check if coming from pending invoices settlement
      const pendingInvoicesData = sessionStorage.getItem(
        "pendingInvoicesToSettle",
      );
      if (pendingInvoicesData) {
        try {
          const data = JSON.parse(pendingInvoicesData);
          // Prefill customer
          this.receipt.customerId = data.customerId;
          // Prefill total amount
          this.receipt.totalAmount = data.totalPending;
          // Fetch bills for this customer first (this will reset allocations)
          await this.fetchCustomerBills(data.customerId);
          // Now set allocations after bills are loaded
          this.receipt.allocations = data.selectedInvoices.map((inv) => ({
            billId: inv.invoiceId,
            allocatedAmount: inv.pendingAmount,
            narration: null,
          }));
          this.takeSnapshot();
          // Clear sessionStorage after consuming
          sessionStorage.removeItem("pendingInvoicesToSettle");
        } catch (err) {
          console.error("Error reading pending invoices data:", err);
        }
      } else if (this.$route.query.customerId) {
        this.receipt.customerId = this.$route.query.customerId;
        await this.onCustomerChange();
        this.takeSnapshot();
      }
      if (this.$route.query.bankId) {
        this.receipt.bankId = this.$route.query.bankId;
        await this.onCustomerChange();
        this.takeSnapshot();
      }
    }
  },

  beforeDestroy() {
    // Clear sessionStorage on unmount to avoid stale data
    sessionStorage.removeItem("pendingInvoicesToSettle");
  },
};
</script>

<!-- Add to your Vuex accounting store: -->
<!--
  async updateReceipt({ commit }, { pathId, payload }) {
    commit("SET_LOADING_STATE", { type: "createReceipt", value: true });
    try {
      const response = await apiClient.put(
        `/accounting/receipts/${pathId}`,
        payload,
      );
      if (response.data.success) {
        commit("SET_RECEIPT_DETAIL", response.data.data);
        return response.data.data;
      } else {
        throw new Error("Failed to update receipt");
      }
    } catch (error) {
      console.error("Error updating receipt:", error);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "createReceipt", value: false });
    }
  },
-->

<style scoped>
.receipt-container {
  padding: 20px;
}

.gap-2 {
  gap: 8px;
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

.text-success {
  color: #388e3c !important;
}

.text-info {
  color: #1976d2 !important;
}
</style>
