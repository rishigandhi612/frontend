<template>
  <v-container fluid class="transaction-form-page">
    <!-- Loading -->
    <v-row
      v-if="isLoading"
      justify="center"
      align="center"
      style="min-height: 60vh"
    >
      <v-progress-circular indeterminate size="56" />
    </v-row>

    <v-row v-else>
      <!-- Back -->
      <v-col cols="12" md="2">
        <v-btn text @click="goBack">
          <v-icon left>mdi-arrow-left</v-icon>
          Back
        </v-btn>
      </v-col>

      <!-- Form -->
      <v-col cols="12" md="8">
        <div class="mb-6 text-center">
          <div class="text-h6 font-weight-medium">
            {{ isEditMode ? "Edit Transaction" : "Add Transaction" }}
          </div>
          <div class="text-caption grey--text">Record bank payment details</div>
        </div>

        <v-form
          ref="transactionForm"
          v-model="isFormValid"
          @keydown.enter.prevent="saveTransaction"
        >
          <v-card outlined class="mb-6">
            <v-card-title class="subtitle-1 font-weight-bold">
              Transaction Details
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-row>
                <!-- Bank -->
                <v-col cols="12" md="6">
                  <v-select
                    ref="bankId"
                    label="Bank"
                    :items="banks"
                    item-text="bankName"
                    item-value="id"
                    v-model="transaction.bankId"
                    :rules="[rules.required]"
                    outlined
                    dense
                    required
                  />
                </v-col>

                <!-- Invoice -->
                <v-col cols="12" md="6">
                  <v-text-field
                    ref="invoiceNumber"
                    label="Invoice Number"
                    v-model="transaction.invoiceNumber"
                    :rules="[rules.required]"
                    outlined
                    dense
                    required
                  />
                </v-col>

                <!-- Amount -->
                <v-col cols="12" md="4">
                  <v-text-field
                    ref="amount"
                    label="Amount"
                    v-model.number="transaction.amount"
                    type="number"
                    :rules="[rules.required]"
                    outlined
                    dense
                    required
                  />
                </v-col>

                <!-- Date -->
                <v-col cols="12" md="4">
                  <v-menu
                    v-model="dateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        label="Transaction Date"
                        v-model="formattedDate"
                        readonly
                        outlined
                        dense
                        v-bind="attrs"
                        v-on="on"
                        :rules="[rules.required]"
                      />
                    </template>
                    <v-date-picker
                      v-model="transaction.transactionDate"
                      @input="dateMenu = false"
                    />
                  </v-menu>
                </v-col>

                <!-- Payment Method -->
                <v-col cols="12" md="4">
                  <v-select
                    label="Payment Method"
                    :items="paymentMethods"
                    v-model="transaction.paymentMethod"
                    :rules="[rules.required]"
                    outlined
                    dense
                    required
                  />
                </v-col>

                <!-- Status -->
                <v-col cols="12" md="4">
                  <v-select
                    label="Payment Status"
                    :items="paymentStatuses"
                    v-model="transaction.paymentStatus"
                    :rules="[rules.required]"
                    outlined
                    dense
                    required
                  />
                </v-col>

                <!-- Reference -->
                <v-col cols="12" md="4">
                  <v-text-field
                    label="Reference / UTR"
                    v-model="transaction.reference"
                    outlined
                    dense
                  />
                </v-col>

                <!-- Remarks -->
                <v-col cols="12">
                  <v-textarea
                    label="Remarks"
                    v-model="transaction.remarks"
                    outlined
                    dense
                    rows="3"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-form>
      </v-col>

      <!-- Actions -->
      <v-col cols="12" md="2">
        <v-card outlined class="pa-3 sticky-actions">
          <v-btn
            block
            color="primary"
            :disabled="!isFormValid || isLoading || !isDirty"
            @click="saveTransaction"
          >
            {{ isEditMode ? "Update" : "Save" }}
          </v-btn>

          <v-btn block text class="mt-3" @click="goBack"> Cancel </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      bottom
      right
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  data() {
    return {
      isFormValid: false,
      isEditMode: false,
      dateMenu: false,
      originalTransaction: null,

      transaction: {
        bankId: "",
        invoiceNumber: "",
        amount: null,
        transactionDate: "",
        paymentMethod: "",
        paymentStatus: "",
        reference: "",
        remarks: "",
        createdBy: "user123",
      },

      paymentMethods: ["neft", "rtgs", "imps", "cash", "cheque"],
      paymentStatuses: ["completed", "pending", "failed"],

      snackbar: {
        show: false,
        text: "",
        color: "success",
      },

      rules: {
        required: (v) => !!v || "Required",
      },
    };
  },

  computed: {
    ...mapGetters("transactions", ["isLoading", "transactionDetail"]),
    ...mapGetters("banks", ["allBanks"]),

    banks() {
      return this.allBanks.map((b) => ({
        id: b.id || b._id,
        bankName: b.name || "",
      }));
    },

    formattedDate() {
      return this.transaction.transactionDate
        ? new Date(this.transaction.transactionDate).toLocaleDateString("en-GB")
        : "";
    },

    isDirty() {
      return (
        !this.isEditMode ||
        JSON.stringify(this.transaction) !== this.originalTransaction
      );
    },
  },

  methods: {
    ...mapActions("banks", ["fetchBanks"]),

    goBack() {
      this.$router.go(-1);
    },

    showSnackbar(text, color = "success") {
      this.snackbar.text = text;
      this.snackbar.color = color;
      this.snackbar.show = true;
    },

    focusFirstError() {
      this.$nextTick(() => {
        const el = this.$el.querySelector(
          ".v-input--has-state.error--text input, .v-input--has-state.error--text .v-select"
        );
        if (el) el.focus();
      });
    },

    async saveTransaction() {
      if (!this.$refs.transactionForm.validate()) {
        this.focusFirstError();
        return;
      }

      const payload = {
        ...this.transaction,
        transactionDate: new Date(
          this.transaction.transactionDate
        ).toISOString(),
      };

      try {
        if (this.isEditMode) {
          await this.$store.dispatch("transactions/updatetransaction", {
            transactionId: this.$route.params.id,
            transactionData: payload,
          });
          this.showSnackbar("Transaction updated successfully");
        } else {
          await this.$store.dispatch("transactions/createtransaction", payload);
          this.showSnackbar("Transaction created successfully");
        }

        this.$router.push("/transaction");
      } catch (e) {
        this.showSnackbar("Something went wrong", "error");
      }
    },

    async loadTransaction() {
      await this.$store.dispatch(
        "transactions/fetchtransactionDetail",
        this.$route.params.id
      );

      if (this.transactionDetail) {
        this.transaction = {
          bankId: this.transactionDetail.bankId,
          invoiceNumber: this.transactionDetail.invoiceNumber,
          amount: this.transactionDetail.amount,
          transactionDate: this.transactionDetail.transactionDate,
          paymentMethod: this.transactionDetail.paymentMethod,
          paymentStatus: this.transactionDetail.paymentStatus,
          reference: this.transactionDetail.reference,
          remarks: this.transactionDetail.remarks,
          createdBy: this.transactionDetail.createdBy,
        };

        this.originalTransaction = JSON.stringify(this.transaction);
      }
    },
  },

  async mounted() {
    await this.fetchBanks();

    if (this.$route.params.id) {
      this.isEditMode = true;
      await this.loadTransaction();
    }
  },
};
</script>

<style scoped>
.transaction-form-page {
  background: #fafafa;
}

.sticky-actions {
  position: sticky;
  top: 24px;
}
</style>
