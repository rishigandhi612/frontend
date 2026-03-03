<template>
  <v-card>
    <v-card-title>Add Opening Balances</v-card-title>
    <v-card-text>
      <div>
        <v-btn color="primary" small @click="addRow">Add Row</v-btn>
        <v-btn color="success" small :loading="submitting" @click="submitAll"
          >Submit All</v-btn
        >
      </div>

      <v-divider class="my-3" />

      <div v-for="(row, idx) in rows" :key="idx" class="mb-3">
        <v-row align="center">
          <v-col cols="4">
            <v-autocomplete
              :items="customerOptions"
              item-text="text"
              item-value="value"
              label="Customer"
              v-model="row.customerId"
              :loading="customersLoading"
              dense
            />
          </v-col>

          <v-col cols="2">
            <v-text-field
              label="Amount"
              type="number"
              v-model.number="row.amount"
              dense
            />
          </v-col>

          <v-col cols="3">
            <v-text-field
              label="As of Date"
              type="date"
              v-model="row.asOfDate"
              dense
            />
          </v-col>

          <v-col cols="2">
            <v-text-field label="Narration" v-model="row.narration" dense />
          </v-col>

          <v-col cols="1">
            <v-btn icon small color="red" @click="removeRow(idx)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-divider />
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "AddOpeningBalances",
  data() {
    return {
      rows: [this.emptyRow()],
      submitting: false,
      customersLoading: false,
    };
  },
  computed: {
    customers() {
      return this.$store.getters["customers/allCustomers"] || [];
    },
    customerOptions() {
      return this.customers.map((c) => ({
        text:
          c.name ||
          c.customerName ||
          `${c.firstName || ""} ${c.lastName || ""}`.trim(),
        value: c.id || c._id || null,
      }));
    },
  },
  methods: {
    emptyRow() {
      const today = new Date().toISOString().substr(0, 10);
      return { customerId: null, amount: null, asOfDate: today, narration: "" };
    },
    addRow() {
      this.rows.push(this.emptyRow());
    },
    removeRow(idx) {
      if (this.rows.length === 1) {
        this.rows = [this.emptyRow()];
        return;
      }
      this.rows.splice(idx, 1);
    },
    async submitAll() {
      // Basic validation
      const payload = [];
      for (const r of this.rows) {
        if (!r.customerId || !r.amount) {
          this.$emit("show-snackbar", {
            message: "Please fill customer and amount for all rows",
            color: "error",
          });
          return;
        }
        console.log("r", r);

        const selectedId =
          typeof r.customerId === "object"
            ? r.customerId.id || r.customerId._id || r.customerId.value || null
            : r.customerId;

        payload.push({
          customerId: selectedId,
          amount: Number(r.amount),
          asOfDate: r.asOfDate,
          narration: r.narration,
        });
      }

      try {
        this.submitting = true;
        await this.$store.dispatch("accounting/addOpeningBalances", payload);
        this.$emit("show-snackbar", {
          message: "Opening balances added",
          color: "success",
        });
        this.rows = [this.emptyRow()];
      } catch (err) {
        console.error(err);
        this.$emit("show-snackbar", {
          message: "Failed to add opening balances",
          color: "error",
        });
      } finally {
        this.submitting = false;
      }
    },
  },
  async mounted() {
    if (!this.customers || this.customers.length === 0) {
      try {
        this.customersLoading = true;
        await this.$store.dispatch("customers/fetchCustomers");
      } finally {
        this.customersLoading = false;
      }
    }
  },
};
</script>

<style scoped>
.mb-3 {
  margin-bottom: 12px;
}
</style>
