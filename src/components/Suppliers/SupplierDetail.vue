<template>
  <v-container fluid>
    <!-- Loading -->
    <v-row v-if="loading" justify="center" class="py-12">
      <v-col cols="12" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="56"
          width="5"
        />
      </v-col>
    </v-row>

    <template v-else>
      <!-- Error -->
      <v-alert v-if="error" type="error" dismissible class="mb-4">
        {{ error }}
      </v-alert>

      <v-row align="start">
        <!-- LEFT: 3 COLUMNS -->
        <v-col cols="12" md="3">
          <v-btn outlined color="primary" block class="mb-4" @click="goBack">
            <v-icon left>mdi-arrow-left</v-icon>
            Back to Suppliers
          </v-btn>

          <v-card outlined v-if="supplier">
            <v-card-text class="text-center pa-5">
              <v-avatar color="primary lighten-5" size="80" class="mb-3">
                <v-icon size="40" color="primary"> mdi-domain </v-icon>
              </v-avatar>

              <div class="overline grey--text">SUPPLIER PROFILE</div>

              <h3 class="text-h6 font-weight-bold text--primary">
                {{ formattedSupplierName }}
              </h3>

              <div class="body-2 grey--text text--darken-1 mt-2">
                {{ supplier.email || "No email available" }}
              </div>

              <v-divider class="my-4" />

              <v-list dense>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="primary">mdi-phone-outline</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-subtitle>Phone</v-list-item-subtitle>
                    <v-list-item-title>
                      {{ supplier.phone || "Not provided" }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="primary">
                      mdi-card-account-details-outline
                    </v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-subtitle>GSTIN</v-list-item-subtitle>
                    <v-list-item-title>
                      {{ supplier.gstin || "Not provided" }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="primary"> mdi-map-marker-outline </v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-subtitle>City</v-list-item-subtitle>
                    <v-list-item-title>
                      {{ formattedCity || "Not provided" }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-icon>
                    <v-icon color="primary">mdi-map</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-subtitle>State</v-list-item-subtitle>
                    <v-list-item-title>
                      {{ formattedState || "Not provided" }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <v-card v-else outlined>
            <v-card-text class="text-center py-8">
              <v-icon size="48" color="grey">
                mdi-account-question-outline
              </v-icon>
              <div class="mt-3">No supplier found</div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- CENTER: 6 COLUMNS -->
        <v-col cols="12" md="7">
          <div class="mb-5">
            <div class="overline primary--text">SUPPLIER MANAGEMENT</div>
            <h1 class="text-h4 font-weight-bold">About Supplier</h1>
            <div class="body-2 grey--text mt-2">
              View supplier contact details, registered address, and record
              information.
            </div>
          </div>

          <template v-if="supplier">
            <!-- Contact Information -->
            <v-card outlined class="mb-5">
              <v-card-title class="subtitle-1 font-weight-bold">
                <v-icon color="primary" left>
                  mdi-card-account-details-outline
                </v-icon>
                Contact Information
              </v-card-title>

              <v-divider />

              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" sm="6">
                    <div class="caption grey--text">SUPPLIER NAME</div>
                    <div class="body-1 font-weight-medium">
                      {{ supplier.name || "Not provided" }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="caption grey--text">PHONE NUMBER</div>
                    <div class="body-1 font-weight-medium">
                      {{ supplier.phone || "Not provided" }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="caption grey--text">EMAIL ADDRESS</div>
                    <div class="body-1 font-weight-medium text-break">
                      {{ supplier.email || "Not provided" }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="caption grey--text">GSTIN</div>
                    <div class="body-1 font-weight-medium">
                      {{ supplier.gstin || "Not provided" }}
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Registered Address -->
            <v-card outlined class="mb-5">
              <v-card-title class="subtitle-1 font-weight-bold">
                <v-icon color="primary" left> mdi-map-marker-outline </v-icon>
                Registered Address
              </v-card-title>

              <v-divider />

              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12">
                    <div class="caption grey--text">ADDRESS LINE 1</div>
                    <div class="body-1">
                      {{ supplier.addressLine1 || "Not provided" }}
                    </div>
                  </v-col>

                  <v-col cols="12">
                    <div class="caption grey--text">ADDRESS LINE 2</div>
                    <div class="body-1">
                      {{ supplier.addressLine2 || "Not provided" }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="caption grey--text">CITY</div>
                    <div class="body-1 font-weight-medium">
                      {{ formattedCity || "Not provided" }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="caption grey--text">STATE</div>
                    <div class="body-1 font-weight-medium">
                      {{ formattedState || "Not provided" }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="caption grey--text">PINCODE</div>
                    <div class="body-1 font-weight-medium">
                      {{ supplier.pincode || "Not provided" }}
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Record Information -->
            <v-card outlined>
              <v-card-title class="subtitle-1 font-weight-bold">
                <v-icon color="primary" left> mdi-clock-outline </v-icon>
                Record Information
              </v-card-title>

              <v-divider />

              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" sm="6">
                    <div class="caption grey--text">CREATED AT</div>
                    <div class="body-2">
                      {{ supplier.createdAt || "Not available" }}
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="caption grey--text">LAST UPDATED</div>
                    <div class="body-2">
                      {{ supplier.updatedAt || "Not available" }}
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </template>

          <v-card v-else outlined>
            <v-card-text class="text-center py-10">
              <v-icon size="48" color="grey">
                mdi-database-search-outline
              </v-icon>
              <div class="text-h6 mt-3">Supplier not found</div>
              <div class="body-2 grey--text">
                The requested supplier could not be loaded.
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- RIGHT: 3 COLUMNS -->
        <v-col cols="12" md="2">
          <v-card outlined>
            <v-card-title class="subtitle-1 font-weight-bold">
              Quick Actions
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
              <div class="body-2 grey--text mb-4">
                Manage this supplier's information.
              </div>

              <v-btn
                v-if="supplier"
                color="primary"
                block
                depressed
                class="mb-3"
                @click="updateSupplier"
              >
                <v-icon left>mdi-pencil-outline</v-icon>
                Update Supplier
              </v-btn>

              <v-btn
                v-if="supplier"
                color="error"
                block
                outlined
                @click="openDeleteConfirmation"
              >
                <v-icon left>mdi-delete-outline</v-icon>
                Delete Supplier
              </v-btn>

              <v-divider class="my-5" />

              <div class="d-flex align-start">
                <v-icon small color="grey" class="mr-2 mt-1">
                  mdi-shield-check-outline
                </v-icon>
                <div class="caption grey--text">
                  Verify supplier information before making changes.
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="deleteDialog" max-width="420">
        <v-card>
          <v-card-title class="subtitle-1 font-weight-bold">
            <v-icon color="error" left> mdi-alert-circle-outline </v-icon>
            Confirm Deletion
          </v-card-title>

          <v-card-text>
            Are you sure you want to delete
            <strong> {{ supplier ? supplier.name : "this supplier" }} </strong>?
            This action cannot be undone.
          </v-card-text>

          <v-card-actions>
            <v-spacer />

            <v-btn text @click="deleteDialog = false"> Cancel </v-btn>

            <v-btn color="error" depressed @click="deleteSupplier">
              <v-icon left>mdi-delete</v-icon>
              Yes, Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </v-container>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  data() {
    return {
      supplierId: this.$route.params.id,
      error: null, // Error state
      deleteDialog: false, // State for delete confirmation dialog
      loading: true, // Loading flag to control spinner visibility
      updatedSupplierData: {
        email: "",
        phone: "",
        gstin: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        // address: {

        // },
      },
    };
  },
  computed: {
    ...mapState("suppliers", ["supplierDetail"]),
    supplier() {
      return this.supplierDetail;
    },
    formattedSupplierName() {
      return this.supplier ? this.supplier.name.toUpperCase() : "";
    },
    formattedCity() {
      return this.supplier ? this.supplier.city.toUpperCase() : "";
    },
    formattedState() {
      return this.supplier ? this.supplier.state.toUpperCase() : "";
    },
  },
  methods: {
    ...mapActions("suppliers", [
      "fetchSupplierDetail",
      "updateSupplierInStore",
      "deleteSupplierFromStore",
    ]),

    async loadSupplierDetail() {
      try {
        this.loading = true; // Start loading spinner
        await this.fetchSupplierDetail(this.supplierId);
        if (this.supplier) {
          this.updatedSupplierData = { ...this.supplier }; // Populate supplier data for editing
        }
      } catch (err) {
        this.error = "Error fetching supplier details.";
      } finally {
        this.loading = false; // Hide the spinner after data is fetched
      }
    },

    async updateSupplier() {
      try {
        await this.updateSupplierInStore({
          id: this.supplierId,
          data: this.updatedSupplierData,
        });
        this.$router.push(`/addsupplier/${this.supplierId}`); // Redirect after update
      } catch (err) {
        this.error = "Error updating supplier.";
      }
    },

    openDeleteConfirmation() {
      this.deleteDialog = true; // Open the confirmation dialog
    },

    async deleteSupplier() {
      try {
        await this.deleteSupplierFromStore(this.supplierId);
        this.$router.push("/supplier"); // Redirect after delete
      } catch (err) {
        this.error = "Error deleting supplier.";
      } finally {
        this.deleteDialog = false; // Close the dialog after delete attempt
      }
    },

    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },

    // recordReceipt() {
    //   // Navigate to receipt recording page with customer ID
    //   this.$router.push({
    //     name: "addReceipt",
    //     query: { customerId: this.customerId },
    //   });
    // },
  },
  created() {
    this.loadSupplierDetail();
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
