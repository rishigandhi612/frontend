<template>
    <v-container fluid>
      <v-row v-if="isLoading">
        <v-col class="d-flex justify-center align-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-col>
      </v-row>
  
      <v-row v-if="!isLoading">
        <v-col cols="12" md="2">
          <v-btn @click="goBack" block>
            <v-icon left>mdi-arrow-left</v-icon> Back
          </v-btn>
        </v-col>
  
        <v-col cols="12" md="8">
          <h1 class="text-center">{{ isEditMode ? "Edit Customer" : "Add Customer" }}</h1>
  
          <v-form ref="customerForm" v-model="isFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  label="Customer Name"
                  v-model="customer.name"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  label="GSTIN"
                  v-model="customer.gstin"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  label="Address Line 1"
                  v-model="customer.address.line1"
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  label="Address City"
                  v-model="customer.address.city"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  label="Address State"
                  v-model="customer.address.state"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  label="Address Pincode"
                  v-model="customer.address.pincode"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  label="Phone No"
                  v-model="customer.phone_no"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  label="Email"
                  v-model="customer.email_id"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-col>
      </v-row>
  
      <v-btn :disabled="!isFormValid || isLoading" color="primary" @click="saveCustomer">
        {{ isEditMode ? "Update Customer" : "Create Customer" }}
      </v-btn>
    </v-container>
  </template>
  
  <script>
  import { mapGetters } from "vuex";
  
  export default {
    data() {
      return {
        customer: {
          name: "",
          gstin: "",
          address: {
            line1: "",
            city: "",
            state: "",
            pincode: "",
          },
          phone_no: "",
          email_id: "",
        },
        isFormValid: false, // To track the form validity
        isEditMode: false, // To check if we're editing an existing customer
        rules: {
          required: (value) => !!value || "This field is required.",
        },
      };
    },
    computed: {
      ...mapGetters("customers", ["isLoading", "customerDetail"]),
    },
    methods: {
      goBack() {
        this.$router.go(-1); // Go back to the previous page
      },
  
      // Save customer (either create or update)
      async saveCustomer() {
        this.isFormValid = this.$refs.customerForm.validate();
  
        if (this.isFormValid) {
          if (this.isEditMode) {
            await this.updateCustomer();
          } else {
            await this.createCustomer();
          }
        }
      },
  
      // Create customer method
      async createCustomer() {
        try {
          await this.$store.dispatch("customers/createCustomer", this.customer);
          this.$router.push("/customer"); // Redirect after success
        } catch (error) {
          console.error("Error creating customer:", error);
        }
      },
  
      // Update customer method
      async updateCustomer() {
        try {
          await this.$store.dispatch("customers/updateCustomer", {
            customerId: this.$route.params.id,
            customerData: this.customer,
          });
          this.$router.push(`/customer/${this.$route.params.id}`); // Redirect to customer detail
        } catch (error) {
          console.error("Error updating customer:", error);
        }
      },
  
      // Load customer details for edit
      async loadCustomerDetail() {
        try {
          await this.$store.dispatch(
            "customers/fetchCustomerDetail",
            this.$route.params.id
          );
          this.customer = { ...this.customerDetail }; // Load customer details
        } catch (error) {
          console.error("Error fetching customer details:", error);
        }
      },
    },
    created() {
      if (this.$route.params.id) {
        this.isEditMode = true;
        this.loadCustomerDetail();
      } else {
        this.isEditMode = false;
      }
    },
  };
  </script>
  