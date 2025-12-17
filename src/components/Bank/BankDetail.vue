<template>
  <v-container fluid>
    <v-row v-if="loading" justify="center">
      <v-col align="center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          width="6"
        ></v-progress-circular>
      </v-col>
    </v-row>

    <!-- Header Section -->
    <v-row v-if="!loading">
      <v-col cols="12" md="2" class="d-flex justify-start align-start pt-5">
        <v-row class="d-flex justify-space-between align-center">
          <v-col>
            <v-btn @click="goBack" block>
              <v-icon left>mdi-arrow-left</v-icon> Back
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col md="8" cols="12" class="d-flex align-center justify-center">
        <v-row>
          <v-col cols="12">
            <!-- Title centered -->
            <h1 align="center">About Bank</h1>
            <!-- Bank Details Card (Visible after data is loaded) -->
            <v-card v-if="!loading && bank">
              <v-card-title>
                <span class="headline">{{ formattedBankName }}</span>
              </v-card-title>

              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <p>
                      <strong>Email:</strong>
                      {{ bank.email_id }}
                    </p>
                    <p><strong>Phone:</strong> {{ bank.phone_no }}</p>
                  </v-col>
                  <v-col cols="12" md="6">
                    <p><strong>Account No:</strong> {{ bank.account_no }}</p>
                    <p>
                      <strong>Created At:</strong>
                      {{ formatDate(bank.createdAt) }}
                    </p>
                    <p>
                      <strong>Updated At:</strong>
                      {{ formatDate(bank.updatedAt) }}
                    </p>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <p>
                      <strong>Branch Name:</strong>
                      {{ bank.branch.name }}
                    </p>
                    <p>
                      <strong>IFSC:</strong>
                      {{ bank.ifsc }}
                    </p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12">
            <!-- Confirmation Dialog for Deleting -->
            <v-dialog v-model="deleteDialog" max-width="400">
              <v-card>
                <v-card-title class="headline">Confirm Deletion</v-card-title>
                <v-card-text>
                  Are you sure you want to delete this bank? This action cannot
                  be undone.
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="green" text @click="deleteBank"
                    >Yes, Delete</v-btn
                  >
                  <v-btn color="red" text @click="deleteDialog = false"
                    >Cancel</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>

        <!-- If no bank is found -->
        <v-card v-if="!loading && !bank" class="mx-auto" max-width="600">
          <v-card-text>
            <p class="text-center">No bank found</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="2" sm="12" class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-btn color="primary" @click="navigateToUpdate" block>
              <v-icon left>mdi-pencil</v-icon>
              Update Bank
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn dark color="error" @click="openDeleteConfirmation" block>
              <v-icon left>mdi-delete</v-icon>
              Delete Bank
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" dismissible @input="error = null">
      {{ error }}
    </v-alert>
  </v-container>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  data() {
    return {
      bankId: this.$route.params.id,
      error: null,
      deleteDialog: false,
      loading: true,
    };
  },
  computed: {
    ...mapState("banks", ["bankDetail"]),
    bank() {
      return this.bankDetail;
    },
    formattedBankName() {
      return this.bank ? this.bank.name.toUpperCase() : "";
    },
    formattedBranchName() {
      return this.bank ? this.bank.branch.name.toUpperCase() : "";
    },
    formattedIfsc() {
      return this.bank ? this.bank.ifsc.toUpperCase() : "";
    },
    formattedState() {
      return this.bank?.branch?.state
        ? this.bank.branch.state.toUpperCase()
        : "";
    },
  },
  methods: {
    ...mapActions("banks", ["fetchBankDetail", "deleteBankFromStore"]),

    async loadBankDetail() {
      try {
        this.loading = true;
        await this.fetchBankDetail(this.bankId);
      } catch (err) {
        this.error = "Error fetching bank details.";
        console.error("Error loading bank:", err);
      } finally {
        this.loading = false;
      }
    },

    navigateToUpdate() {
      // Navigate to the update/edit page
      this.$router.push(`/addbank/${this.bankId}`);
    },

    openDeleteConfirmation() {
      this.deleteDialog = true;
    },

    async deleteBank() {
      try {
        await this.deleteBankFromStore(this.bankId);
        this.$router.push("/bank");
      } catch (err) {
        this.error = "Error deleting bank.";
        console.error("Error deleting bank:", err);
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
      return `${day}/${month}/${year}`;
    },

    goBack() {
      this.$router.go(-1);
    },
  },
  created() {
    this.loadBankDetail();
  },
};
</script>

<style scoped>
.v-card {
  margin-bottom: 20px;
}

.text-center {
  text-align: center;
}
</style>
