<template>
  <v-app>
    <v-container fluid>
      <v-alert v-if="!Transporter" type="error" dismissible>
        Failed to load Transporter details. Please try again later.
      </v-alert>

      <!-- Loader Spinner -->
      <v-row v-if="loading">
        <v-col class="d-flex justify-center align-center">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </v-col>
      </v-row>

      <v-row v-if="!loading">
        <v-col class="d-flex justify-center align-center">
          <!-- Header Section with Title and Back Button -->
          <v-row>
            <v-col cols="12" md="2">
              <v-btn @click="goBack" class="ml-2" block>
                <v-icon left>mdi-arrow-left</v-icon> Back
              </v-btn>
            </v-col>

            <v-col cols="12" md="8">
              <v-row>
                <v-col cols="12" md="12">
                  <h1 align="center">Transporter Details</h1>
                </v-col>
                <v-col cols="12" md="12">
                  <v-card v-if="Transporter">
                    <v-card-title>
                      <span class="headline">
                        {{ Transporter.name || "No Name available." }}
                        <v-chip
                          :color="Transporter.isActive ? 'success' : 'error'"
                          text-color="white"
                          class="ml-2"
                        >
                          {{ Transporter.isActive ? 'Active' : 'Inactive' }}
                        </v-chip>
                      </span>
                    </v-card-title>

                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-row>
                            <v-col>
                              <strong>Contact Person:</strong>
                              {{ Transporter.contactPerson || "Not specified" }}
                            </v-col>
                          </v-row>
                          <v-row>
                            <v-col>
                              <strong>Phone:</strong>
                              {{ Transporter.phone || "Not specified" }}
                            </v-col>
                          </v-row>
                          <v-row>
                            <v-col>
                              <strong>Email:</strong>
                              {{ Transporter.email || "Not specified" }}
                            </v-col>
                          </v-row>
                          <v-row>
                            <v-col>
                              <strong>GST Number:</strong>
                              {{ Transporter.gstNumber || "Not specified" }}
                            </v-col>
                          </v-row>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-row>
                            <v-col>
                              <strong>Country:</strong>
                              {{ Transporter.address?.country || "Not specified" }}
                            </v-col>
                          </v-row>
                          <v-row>
                            <v-col>
                              <strong>Vehicle Types:</strong>
                              <v-chip-group v-if="Transporter.vehicleTypes && Transporter.vehicleTypes.length">
                                <v-chip
                                  v-for="vehicle in Transporter.vehicleTypes"
                                  :key="vehicle"
                                  small
                                  color="primary"
                                  text-color="white"
                                >
                                  {{ vehicle }}
                                </v-chip>
                              </v-chip-group>
                              <span v-else>Not specified</span>
                            </v-col>
                          </v-row>
                        </v-col>
                      </v-row>

                      <!-- Sending Locations Section -->
                      <v-divider class="my-4"></v-divider>
                      <v-row>
                        <v-col cols="12">
                          <h3>Sending Locations</h3>
                          <v-card
                            v-if="Transporter.sendingLocations && Transporter.sendingLocations.length"
                            class="mt-3"
                            outlined
                          >
                            <v-list>
                              <v-list-item
                                v-for="(location, index) in Transporter.sendingLocations"
                                :key="index"
                                class="border-bottom"
                              >
                                <v-list-item-content>
                                  <v-list-item-title>
                                    <strong>{{ location.name }}</strong>
                                  </v-list-item-title>
                                  <v-list-item-subtitle>
                                    {{ location.city }}, {{ location.state }} - {{ location.pincode }}
                                  </v-list-item-subtitle>
                                </v-list-item-content>
                                <v-list-item-icon>
                                  <v-icon>mdi-map-marker</v-icon>
                                </v-list-item-icon>
                              </v-list-item>
                            </v-list>
                          </v-card>
                          <p v-else>No sending locations specified.</p>
                        </v-col>
                      </v-row>

                      <!-- Timestamps -->
                      <v-divider class="my-4"></v-divider>
                      <v-row>
                        <v-col cols="12" md="6">
                          <strong>Created At:</strong>
                          {{ formatDate(Transporter.createdAt) }}
                        </v-col>
                        <v-col cols="12" md="6">
                          <strong>Last Updated:</strong>
                          {{ formatDate(Transporter.updatedAt) }}
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- If no Transporter is found -->
                  <v-card
                    v-if="!Transporter"
                    class="mx-auto elevation-4"
                    max-width="800"
                  >
                    <v-card-text>
                      <p class="text-center">No Transporter found.</p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>

            <v-col cols="12" md="2">
              <v-row>
                <v-col>
                  <v-btn
                    color="primary"
                    @click="updateTransporter"
                    class="w-100 text-uppercase"
                  >
                    <v-icon left>mdi-pencil</v-icon> Update
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    :color="Transporter?.isActive ? 'orange' : 'success'"
                    @click="toggleStatus"
                    class="w-100 text-uppercase"
                  >
                    <v-icon left>{{ Transporter?.isActive ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                    {{ Transporter?.isActive ? 'Deactivate' : 'Activate' }}
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    color="error"
                    @click="openDeleteConfirmation"
                    class="w-100 text-uppercase"
                  >
                    <v-icon left>mdi-delete</v-icon> Delete
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <!-- Error Alert -->
          <v-alert v-if="error" type="error" dismissible class="mb-4">
            {{ error }}
          </v-alert>
        </v-col>

        <!-- Confirmation Dialog for Deleting -->
        <v-dialog v-model="deleteDialog" max-width="400">
          <v-card>
            <v-card-title class="headline">Confirm Deletion</v-card-title>
            <v-card-text>
              Are you sure you want to delete this Transporter? This action cannot be
              undone.
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green" text @click="deleteTransporter">Yes, Delete</v-btn>
              <v-btn color="red" text @click="deleteDialog = false"
                >Cancel</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Confirmation Dialog for Status Toggle -->
        <v-dialog v-model="statusDialog" max-width="400">
          <v-card>
            <v-card-title class="headline">Confirm Status Change</v-card-title>
            <v-card-text>
              Are you sure you want to {{ Transporter?.isActive ? 'deactivate' : 'activate' }} this transporter?
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green" text @click="confirmToggleStatus">Yes, {{ Transporter?.isActive ? 'Deactivate' : 'Activate' }}</v-btn>
              <v-btn color="red" text @click="statusDialog = false"
                >Cancel</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import { mapActions } from "vuex";

export default {
  data() {
    return {
      TransporterId: this.$route.params.id, // Get the transporterId from the route params
      error: null, // Error state
      deleteDialog: false, // State for delete confirmation dialog
      statusDialog: false, // State for status toggle confirmation dialog
    };
  },
  computed: {
    // Get transporter data from Vuex store
    Transporter() {
      return this.$store.state.transporter.transporterDetail; // Get transporter detail from store
    },
    // Loading state
    loading() {
      return this.$store.state.transporter.loading; // Access loading state from Vuex
    },
  },
  methods: {
    // Vuex actions mapping
    ...mapActions("transporter", ["fetchTransporterDetail", "updateTransporter", "deleteTransporter", "toggleTransporterStatus"]),

    // Load the transporter details
    async loadTransporterDetail() {
      try {
        this.$store.commit("transporter/SET_LOADING", true); // Start loading spinner
        await this.fetchTransporterDetail(this.TransporterId); // Fetch transporter data by ID
      } catch (err) {
        this.error = "Error fetching Transporter details.";
      } finally {
        this.$store.commit("transporter/SET_LOADING", false); // Stop loading spinner
      }
    },

    // Update transporter
    updateTransporter() {
      this.$router.push(`/addtransporter/${this.TransporterId}`); // Redirect to update page
    },

    // Open delete confirmation dialog
    openDeleteConfirmation() {
      this.deleteDialog = true; // Open the confirmation dialog
    },

    // Toggle status confirmation
    toggleStatus() {
      this.statusDialog = true; // Open the status confirmation dialog
    },

    // Confirm toggle status
    async confirmToggleStatus() {
      try {
        await this.toggleTransporterStatus({
          id: this.TransporterId,
          isActive: !this.Transporter.isActive
        });
        const statusText = !this.Transporter.isActive ? 'activated' : 'deactivated';
        alert(`Transporter ${statusText} successfully.`);
      } catch (err) {
        this.error = "Error updating transporter status.";
        console.error("Error toggling transporter status:", err);
      } finally {
        this.statusDialog = false; // Close the confirmation dialog
      }
    },

    // Delete transporter
    async deleteTransporter() {
      try {
        // Call the Vuex action
        await this.$store.dispatch("transporter/deleteTransporter", this.TransporterId);
        await this.$router.push("/transporter"); // Navigate to the transporter list
      } catch (err) {
        this.error = "Error deleting Transporter."; // Handle error
        console.error("Error deleting transporter:", err);
      } finally {
        this.deleteDialog = false; // Close the confirmation dialog
      }
    },

    // Format date for display
    formatDate(dateString) {
      if (!dateString) return 'Not available';
      return new Date(dateString).toLocaleString();
    },

    // Go back to the previous page
    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
  },
  created() {
    this.loadTransporterDetail(); // Load transporter details when the component is created
  },
};
</script>

<style scoped>
.v-card {
  margin-bottom: 20px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.text-center {
  text-align: center;
}

.v-row {
  margin-bottom: 20px;
}

.v-btn {
  text-transform: none;
}

.v-card-title {
  font-size: 1.5rem;
  font-weight: bold;
}

.v-alert {
  margin-bottom: 20px;
}

.elevation-12 {
  box-shadow: 0 12px 16px rgba(0, 0, 0, 0.2);
}

.elevation-4 {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.text-uppercase {
  text-transform: uppercase;
}

.border-bottom:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}
</style>