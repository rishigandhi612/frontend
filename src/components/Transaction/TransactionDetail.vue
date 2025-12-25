<template>
  <v-container fluid class="transaction-page">
    <!-- Loading State -->
    <v-row
      v-if="loading"
      justify="center"
      align="center"
      style="min-height: 60vh"
    >
      <v-progress-circular indeterminate size="60" width="5" />
    </v-row>

    <!-- Content -->
    <v-row v-else>
      <!-- Left: Back -->
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>

      <!-- Center: Details -->
      <v-col cols="12" md="8">
        <!-- Header Summary -->
        <v-card outlined class="mb-6">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="8">
                <div class="text-caption grey--text">Transaction ID</div>
                <div class="text-h6 font-weight-medium">
                  {{ transaction.transactionId }}
                </div>

                <v-chip
                  small
                  class="mt-2"
                  :color="
                    transaction.paymentStatus === 'completed'
                      ? 'green'
                      : 'orange'
                  "
                  text-color="white"
                >
                  {{ transaction.paymentStatus.toUpperCase() }}
                </v-chip>
              </v-col>

              <v-col cols="12" md="4" class="text-right">
                <div class="text-caption grey--text">Amount</div>
                <div class="text-h5 font-weight-bold">
                  ₹
                  {{ Number(transaction.totalAmount).toLocaleString("en-IN") }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Details Card -->
        <v-card outlined>
          <v-card-title class="subtitle-1 font-weight-bold">
            Transaction Details
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-row>
              <!-- Left Column -->
              <v-col cols="12" md="6">
                <div class="field">
                  <span class="label">Bank Name</span>
                  <span class="value">{{ transaction.bankName }}</span>
                </div>

                <div class="field">
                  <span class="label">Payment Method</span>
                  <span class="value text-uppercase">
                    {{ transaction.paymentMethod }}
                  </span>
                </div>

                <div class="field">
                  <span class="label">Reference</span>
                  <span class="value">{{ transaction.reference || "-" }}</span>
                </div>

                <div class="field">
                  <span class="label">Remarks</span>
                  <span class="value">{{ transaction.remarks || "-" }}</span>
                </div>
              </v-col>

              <!-- Right Column -->
              <v-col cols="12" md="6">
                <div class="field">
                  <span class="label">Invoice Number</span>
                  <span class="value">{{ transaction.invoiceNumber }}</span>
                </div>

                <div class="field">
                  <span class="label">Transaction Date</span>
                  <span class="value">
                    {{ formatDate(transaction.transactionDate) }}
                  </span>
                </div>

                <div class="field">
                  <span class="label">Last Updated</span>
                  <span class="value">
                    {{ formatDate(transaction.updatedAt) }}
                  </span>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right: Actions -->
      <v-col cols="12" md="2">
        <v-card outlined class="pa-3 sticky-actions">
          <v-btn block color="primary" @click="navigateToUpdate">
            <v-icon left>mdi-pencil</v-icon>
            Edit
          </v-btn>

          <v-btn
            block
            text
            color="error"
            class="mt-3"
            @click="openDeleteConfirmation"
          >
            <v-icon left>mdi-delete</v-icon>
            Delete
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="headline"> Confirm Deletion </v-card-title>
        <v-card-text>
          This transaction will be permanently deleted. This action cannot be
          undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deletetransaction">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  data() {
    return {
      transactionId: this.$route.params.id,
      error: null,
      deleteDialog: false,
      loading: true,
    };
  },
  computed: {
    ...mapState("transactions", ["transactionDetail"]),
    transaction() {
      return this.transactionDetail;
    },
    formattedtransactionName() {
      return this.transaction ? this.transaction?.transactionId : "";
    },
    formattedBranchName() {
      return this.transaction ? this.transaction?.bankName : "";
    },
    formattedIfsc() {
      return this.transaction ? this.transaction?.invoiceNumber : "";
    },
    formattedState() {
      return this.transaction?.remarks ? this.transaction?.remarks : "";
    },
  },
  methods: {
    ...mapActions("transactions", [
      "fetchtransactionDetail",
      "deletetransactionFromStore",
    ]),

    async loadtransactionDetail() {
      try {
        this.loading = true;
        await this.fetchtransactionDetail(this.transactionId);
      } catch (err) {
        this.error = "Error fetching transaction details.";
        console.error("Error loading transaction:", err);
      } finally {
        this.loading = false;
      }
    },

    navigateToUpdate() {
      // Navigate to the update/edit page
      this.$router.push("/addtransaction" + "/" + this.transactionId);
    },

    openDeleteConfirmation() {
      this.deleteDialog = true;
    },

    async deletetransaction() {
      try {
        await this.deletetransactionFromStore(this.transactionId);
        this.$router.push("/transaction");
      } catch (err) {
        this.error = "Error deleting transaction.";
        console.error("Error deleting transaction:", err);
      } finally {
        this.deleteDialog = false;
      }
    },

    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },

    goBack() {
      this.$router.go(-1);
    },
  },
  created() {
    this.loadtransactionDetail();
  },
};
</script>

<style scoped>
/* .transaction-page {
  background: #fafafa;
} */

.field {
  margin-bottom: 16px;
}

.label {
  display: block;
  font-size: 12px;
  color: #757575;
  margin-bottom: 4px;
}

.value {
  font-size: 14px;
  font-weight: 500;
  color: #212121;
}

.sticky-actions {
  position: sticky;
  top: 24px;
}
</style>
