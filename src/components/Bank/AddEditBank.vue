<template>
  <v-container fluid>
    <v-row v-if="isLoading">
      <v-col class="d-flex justify-center align-center">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-if="!isLoading">
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>

      <v-col cols="12" md="8">
        <h1 class="text-center">
          {{ isEditMode ? "Edit Bank" : "Add Bank" }}
        </h1>

        <v-form ref="bankForm" v-model="isFormValid">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                label="Bank Name"
                v-model="bank.name"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Account Number"
                v-model="bank.account_no"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Branch Name"
                v-model="bank.branch.name"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="IFSC Code"
                v-model="bank.ifsc"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Phone No"
                v-model="bank.phone_no"
                :rules="[rules.required, rules.phone]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Email"
                v-model="bank.email_id"
                :rules="[rules.required, rules.email]"
                required
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" class="d-flex justify-end">
              <v-btn
                :disabled="!isFormValid || isLoading"
                color="primary"
                @click="saveBank"
                large
              >
                {{ isEditMode ? "Update Bank" : "Create Bank" }}
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>

    <!-- Success Snackbar -->
    <v-snackbar v-model="successSnackbar" color="success" :timeout="3000">
      {{ successMessage }}
    </v-snackbar>

    <!-- Error Snackbar -->
    <v-snackbar v-model="errorSnackbar" color="error" :timeout="3000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      bank: {
        name: "",
        account_no: "",
        branch: {
          name: "",
        },
        ifsc: "",
        phone_no: "",
        email_id: "",
      },
      isFormValid: false,
      isEditMode: false,
      successSnackbar: false,
      errorSnackbar: false,
      successMessage: "",
      errorMessage: "",
      rules: {
        required: (value) => !!value || "This field is required.",
        email: (value) => {
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return pattern.test(value) || "Invalid email address.";
        },
        phone: (value) => {
          const pattern = /^[0-9]{10}$/;
          return pattern.test(value) || "Phone number must be 10 digits.";
        },
      },
    };
  },
  computed: {
    ...mapGetters("banks", ["isLoading", "bankDetail"]),
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },

    // Save bank (either create or update)
    async saveBank() {
      // Validate form before proceeding
      if (this.$refs.bankForm.validate()) {
        if (this.isEditMode) {
          await this.updateBank();
        } else {
          await this.createBank();
        }
      }
    },

    // Create bank method
    async createBank() {
      try {
        await this.$store.dispatch("banks/createBank", this.bank);
        this.successMessage = "Bank created successfully!";
        this.successSnackbar = true;

        // Redirect after a short delay to show the success message
        setTimeout(() => {
          this.$router.push("/bank");
        }, 1500);
      } catch (error) {
        console.error("Error creating bank:", error);
        this.errorMessage = "Failed to create bank. Please try again.";
        this.errorSnackbar = true;
      }
    },

    // Update bank method
    async updateBank() {
      try {
        await this.$store.dispatch("banks/updateBank", {
          bankId: this.$route.params.id,
          bankData: this.bank,
        });
        this.successMessage = "Bank updated successfully!";
        this.successSnackbar = true;

        // Redirect after a short delay to show the success message
        setTimeout(() => {
          this.$router.push(`/bank/${this.$route.params.id}`);
        }, 1500);
      } catch (error) {
        console.error("Error updating bank:", error);
        this.errorMessage = "Failed to update bank. Please try again.";
        this.errorSnackbar = true;
      }
    },

    // Load bank details for edit
    async loadBankDetail() {
      try {
        await this.$store.dispatch(
          "banks/fetchBankDetail",
          this.$route.params.id
        );

        // Deep clone to avoid mutation issues
        if (this.bankDetail) {
          this.bank = {
            name: this.bankDetail.name || "",
            account_no: this.bankDetail.account_no || "",
            branch: {
              name: this.bankDetail.branch?.name || "",
            },
            ifsc: this.bankDetail.ifsc || "",
            phone_no: this.bankDetail.phone_no || "",
            email_id: this.bankDetail.email_id || "",
          };
        }
      } catch (error) {
        console.error("Error fetching bank details:", error);
        this.errorMessage = "Failed to load bank details.";
        this.errorSnackbar = true;
      }
    },
  },
  created() {
    if (this.$route.params.id) {
      this.isEditMode = true;
      this.loadBankDetail();
    } else {
      this.isEditMode = false;
    }
  },
};
</script>

<style scoped>
.text-center {
  text-align: center;
}
</style>
