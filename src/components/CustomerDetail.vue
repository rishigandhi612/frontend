<template>
  <v-container>
    <!-- Header Section -->
    <v-row class="d-flex align-center">
      <v-col cols="auto">
        <!-- Back Button aligned left -->
        <v-btn color="grey" @click="goBack">
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col class="text-center">
        <!-- Title centered -->
        <h1>Customer Detail</h1>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" dismissible>
      {{ error }}
    </v-alert>

    <!-- Loader Spinner (Visible when loading) -->
    <v-row v-if="loading" justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate color="primary" size="64" width="6"></v-progress-circular>
      </v-col>
    </v-row>

    <!-- Customer Details Card (Visible after data is loaded) -->
    <v-card v-if="!loading && customer" class="mx-auto" max-width="600">
      <v-card-title>
        <v-avatar v-if="customer.profile_picture" size="64" class="mr-3">
          <img :src="customer.profile_picture" alt="Profile Picture">
        </v-avatar>
        <span class="headline">{{ formattedCustomerName }}</span>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <p><strong>Email:</strong>
              <v-badge color="blue" content="Verified">{{ customer.email_id }}</v-badge>
            </p>
            <p><strong>Phone:</strong> {{ customer.phone_no }}</p>
          </v-col>
          <v-col cols="12" md="6">
            <p><strong>GSTIN:</strong> {{ customer.gstin }}</p>
            <p><strong>Created At:</strong> {{ customer.createdAt }}</p>
            <p><strong>Updated At:</strong> {{ customer.updatedAt }}</p>
          </v-col>
        </v-row>

        <p><strong>Address:</strong></p>
        <v-list>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title><strong>Line 1:</strong> {{ customer.address.line1 }}</v-list-item-title>
              <v-list-item-subtitle>
                <strong>City:</strong> {{ formattedCity }}<br>
                <strong>State:</strong> {{ customer.address.state }}<br>
                <strong>Pincode:</strong> {{ customer.address.pincode }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-btn color="primary" @click="updateCustomer">Update</v-btn>
        <v-btn color="red" @click="openDeleteConfirmation">Delete</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="grey" @click="goBack">
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- If no customer is found -->
    <v-card v-if="!loading && !customer" class="mx-auto" max-width="600">
      <v-card-text>
        <p class="text-center">No customer found</p>
      </v-card-text>
    </v-card>

    <!-- Confirmation Dialog for Deleting -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete this customer? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green" text @click="deleteCustomer">Yes, Delete</v-btn>
          <v-btn color="red" text @click="deleteDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  data() {
    return {
      customerId: this.$route.params.id,
      error: null, // Error state
      deleteDialog: false, // State for delete confirmation dialog
      loading: true, // Loading flag to control spinner visibility
      updatedCustomerData: {
        email_id: '',
        phone_no: '',
        gstin: '',
        address: {
          line1: '',
          city: '',
          state: '',
          pincode: ''
        }
      }
    };
  },
  computed: {
    ...mapState('customers', ['customerDetail']),
    customer() {
      return this.customerDetail;
    },
    formattedCustomerName() {
      return this.customer ? this.customer.name.toUpperCase() : '';
    },
    formattedCity() {
      return this.customer ? this.customer.address.city.toUpperCase() : '';
    },
  },
  methods: {
    ...mapActions('customers', ['fetchCustomerDetail', 'updateCustomerInStore', 'deleteCustomerFromStore']),
    
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
        await this.updateCustomerInStore({ id: this.customerId, data: this.updatedCustomerData });
        this.$router.push('/customer'); // Redirect after update
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
        this.$router.push('/customer'); // Redirect after delete
      } catch (err) {
        this.error = "Error deleting customer.";
      } finally {
        this.deleteDialog = false; // Close the dialog after delete attempt
      }
    },

    goBack() {
      this.$router.push('/customer');
    }
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
