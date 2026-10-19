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
          {{ isEditMode ? "Edit Supplier" : "Add Supplier" }}
        </h1>

        <v-form ref="supplierForm" v-model="isFormValid">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                label="Supplier Name"
                v-model="supplier.name"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="GSTIN"
                v-model="supplier.gstin"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Address Line 1"
                v-model="supplier.addressLine1"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Address Line 2"
                v-model="supplier.addressLine2"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Address City"
                v-model="supplier.city"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Address State"
                v-model="supplier.state"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Address Pincode"
                v-model="supplier.pincode"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Phone No"
                v-model="supplier.phone"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Email"
                v-model="supplier.email"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>

    <v-btn
      :disabled="!isFormValid || isLoading"
      color="primary"
      @click="saveSupplier"
    >
      {{ isEditMode ? "Update Supplier" : "Create Supplier" }}
    </v-btn>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      supplier: {
        name: "",
        gstin: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        stateCode: "",
        email: "",
        phone: "",
      },
      isFormValid: false,
      isEditMode: false,
      rules: {
        required: (value) => !!value || "This field is required.",
      },
    };
  },
  computed: {
    ...mapGetters("suppliers", ["isLoading", "supplierDetail"]),
  },
  methods: {
    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },

    // Save supplier (either create or update)
    async saveSupplier() {
      this.isFormValid = this.$refs.supplierForm.validate();

      if (this.isFormValid) {
        if (this.isEditMode) {
          await this.updateSupplier();
        } else {
          await this.createSupplier();
        }
      }
    },

    // Create supplier method
    async createSupplier() {
      try {
        await this.$store.dispatch("suppliers/createSupplier", this.supplier);
        this.$router.push("/supplier"); // Redirect after success
      } catch (error) {
        console.error("Error creating supplier:", error);
      }
    },

    // Update supplier method
    async updateSupplier() {
      try {
        await this.$store.dispatch("suppliers/updateSupplier", {
          supplierId: this.$route.params.id,
          supplierData: this.supplier,
        });
        this.$router.push(`/supplier/${this.$route.params.id}`); // Redirect to supplier detail
      } catch (error) {
        console.error("Error updating supplier:", error);
      }
    },

    // Load supplier details for edit
    async loadSupplierDetail() {
      try {
        await this.$store.dispatch(
          "suppliers/fetchSupplierDetail",
          this.$route.params.id,
        );
        this.supplier = { ...this.supplierDetail }; // Load supplier details
      } catch (error) {
        console.error("Error fetching supplier details:", error);
      }
    },
  },
  created() {
    if (this.$route.params.id) {
      this.isEditMode = true;
      this.loadSupplierDetail();
    } else {
      this.isEditMode = false;
    }
  },
};
</script>
