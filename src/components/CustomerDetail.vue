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
        <v-container class="">
          <v-row>
            <v-col cols="12">
              <!-- Title centered -->
              <h1 align="center">Customer Detail</h1>
              <!-- Customer Details Card (Visible after data is loaded) -->
              <v-card
                v-if="!loading && customer"
                class="mx-auto"
                max-width="600"
              >
                <v-card-title>
                  <span class="headline">{{ formattedCustomerName }}</span>
                </v-card-title>

                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <p>
                        <strong>Email:</strong>
                        {{ customer.email_id }}
                      </p>
                      <p><strong>Phone:</strong> {{ customer.phone_no }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p><strong>GSTIN:</strong> {{ customer.gstin }}</p>
                      <p>
                        <strong>Created At:</strong> {{ customer.createdAt }}
                      </p>
                      <p>
                        <strong>Updated At:</strong> {{ customer.updatedAt }}
                      </p>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col>
                      <p><strong>Address:</strong></p>
                      <p>
                        <strong>Line 1:</strong>
                        {{ customer.address.line1 }}
                      </p>
                      <p><strong>City:</strong> {{ formattedCity }}</p>
                      <p><strong>State:</strong> {{ formattedState }}</p>
                      <p>
                        <strong>Pincode:</strong>
                        {{ customer.address.pincode }}
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
                    Are you sure you want to delete this customer? This action
                    cannot be undone.
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="green" text @click="deleteCustomer"
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
        </v-container>

        <!-- If no customer is found -->
        <v-card v-if="!loading && !customer" class="mx-auto" max-width="600">
          <v-card-text>
            <p class="text-center">No customer found</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="2" sm="12" class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-btn color="primary" @click="updateCustomer" block>
              <v-icon left>mdi-pencil</v-icon>
              Update
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn dark color="error" @click="openDeleteConfirmation" block>
              <v-icon left>mdi-delete</v-icon>
              Delete
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" dismissible>
      {{ error }}
    </v-alert>

    <!-- Loader Spinner (Visible when loading) -->
  </v-container>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  data() {
    return {
      customerId: this.$route.params.id,
      error: null, // Error state
      deleteDialog: false, // State for delete confirmation dialog
      loading: true, // Loading flag to control spinner visibility
      updatedCustomerData: {
        email_id: "",
        phone_no: "",
        gstin: "",
        address: {
          line1: "",
          city: "",
          state: "",
          pincode: "",
        },
      },
    };
  },
  computed: {
    ...mapState("customers", ["customerDetail"]),
    customer() {
      return this.customerDetail;
    },
    formattedCustomerName() {
      return this.customer ? this.customer.name.toUpperCase() : "";
    },
    formattedCity() {
      return this.customer ? this.customer.address.city.toUpperCase() : "";
    },
    formattedState() {
      return this.customer ? this.customer.address.state.toUpperCase() : "";
    },
  },
  methods: {
    ...mapActions("customers", [
      "fetchCustomerDetail",
      "updateCustomerInStore",
      "deleteCustomerFromStore",
    ]),

    async loadCustomerDetail() {
      try {
        this.loading = true; // Start loading spinner
        await this.fetchCustomerDetail(this.customerId);
        if (this.customer) {
          this.updatedCustomerData = { ...this.customer }; // Populate customer data for editing
        }
      } catch (err) {
        this.error = "Error fetching customer details.";
      } finally {
        this.loading = false; // Hide the spinner after data is fetched
      }
    },

    async updateCustomer() {
      try {
        await this.updateCustomerInStore({
          id: this.customerId,
          data: this.updatedCustomerData,
        });
        this.$router.push("/customer"); // Redirect after update
      } catch (err) {
        this.error = "Error updating customer.";
      }
    },

    openDeleteConfirmation() {
      this.deleteDialog = true; // Open the confirmation dialog
    },

    async deleteCustomer() {
      try {
        await this.deleteCustomerFromStore(this.customerId);
        this.$router.push("/customer"); // Redirect after delete
      } catch (err) {
        this.error = "Error deleting customer.";
      } finally {
        this.deleteDialog = false; // Close the dialog after delete attempt
      }
    },

    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
  },
  created() {
    this.loadCustomerDetail();
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
