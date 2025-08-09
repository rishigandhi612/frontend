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
          {{ isEditMode ? "Edit Transporter" : "Add Transporter" }}
        </h1>

        <v-form ref="transporterForm" v-model="isFormValid">
          <!-- Basic Information -->
          <v-row>
            <v-col cols="12">
              <h3 class="mb-3">Basic Information</h3>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                label="Transporter Name"
                v-model="transporter.name"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Contact Person"
                v-model="transporter.contactPerson"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Phone Number"
                v-model="transporter.phone"
                :rules="[rules.required, rules.phone]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Email"
                v-model="transporter.email"
                :rules="[rules.required, rules.email]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="GST Number"
                v-model="transporter.gstNumber"
                :rules="[rules.gst]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-switch
                v-model="transporter.isActive"
                label="Active Status"
                color="primary"
              ></v-switch>
            </v-col>
          </v-row>

          <!-- Vehicle Types -->
          <v-row>
            <v-col cols="12">
              <h3 class="mb-3">Vehicle Types</h3>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="transporter.vehicleTypes"
                :items="availableVehicleTypes"
                label="Select Vehicle Types"
                multiple
                chips
                deletable-chips
              ></v-select>
            </v-col>
          </v-row>

          <!-- Sending Locations -->
          <v-row>
            <v-col cols="12">
              <h3 class="mb-3">Sending Locations</h3>
            </v-col>
            
            <v-col cols="12">
              <v-btn
                color="primary"
                @click="addLocation"
                class="mb-3"
              >
                <v-icon left>mdi-plus</v-icon>
                Add Location
              </v-btn>
            </v-col>

            <v-col cols="12" v-for="(location, index) in transporter.sendingLocations" :key="index">
              <v-card class="mb-3">
                <v-card-title class="d-flex justify-space-between align-center">
                  <span>Location {{ index + 1 }}</span>
                  <v-btn
                    icon
                    color="error"
                    @click="removeLocation(index)"
                    v-if="transporter.sendingLocations.length > 1"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        label="Location Name"
                        v-model="location.name"
                        :rules="[rules.required]"
                        required
                      ></v-text-field>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        label="City"
                        v-model="location.city"
                        :rules="[rules.required]"
                        required
                      ></v-text-field>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        label="State"
                        v-model="location.state"
                        :rules="[rules.required]"
                        required
                      ></v-text-field>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        label="Pincode"
                        v-model="location.pincode"
                        :rules="[rules.required, rules.pincode]"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-btn
                :disabled="!isFormValid || isLoading || !hasChanges"
                color="primary"
                @click="saveTransporter"
                large
              >
                {{ isEditMode ? "Update Transporter" : "Create Transporter" }}
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>

    <!-- Show error message if any -->
    <v-row>
      <v-col cols="12" md="12" sm="12">
        <v-alert v-if="error" type="error" dismissible>
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  data() {
    return {
      isFormValid: false,
      transporter: {
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        gstNumber: "",
        sendingLocations: [
          {
            name: "",
            city: "",
            state: "",
            pincode: ""
          }
        ],
        vehicleTypes: [],
        isActive: true
      },
      initialTransporter: null, // To store the initial transporter data
      transporterId: this.$route.params.id, // transporter ID from route
      isEditMode: !!this.$route.params.id, // True if editing
      availableVehicleTypes: [
        "Truck",
        "Tempo",
        "Mini Truck",
        "Container",
        "Trailer",
        "Pick-up",
        "Van",
        "Auto"
      ],
      rules: {
        required: (value) => !!value || "This field is required",
        email: (value) => {
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return pattern.test(value) || "Please enter a valid email address";
        },
        phone: (value) => {
          const pattern = /^[6-9]\d{9}$/;
          return pattern.test(value) || "Please enter a valid 10-digit phone number";
        },
        gst: (value) => {
          const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
          return pattern.test(value) || "Please enter a valid GST number";
        },
        pincode: (value) => {
          const pattern = /^[1-9][0-9]{5}$/;
          return pattern.test(value) || "Please enter a valid 6-digit pincode";
        }
      },
      error: null, // To store the error message
    };
  },
  computed: {
    ...mapState("transporter", ["loading"]), // Map loading state from Vuex store
    isLoading() {
      return this.loading;
    },
    hasChanges() {
      // Compare the current transporter with the initial transporter
      return JSON.stringify(this.transporter) !== JSON.stringify(this.initialTransporter);
    },
  },
  created() {
    console.log('transporterId from route params:', this.transporterId);  // Debug log
    if (this.isEditMode) {
      this.fetchTransporterDetail(); // Fetch transporter details for edit mode
    } else {
      // Store initial state for new transporter
      this.initialTransporter = JSON.parse(JSON.stringify(this.transporter));
    }
  },
  methods: {
    ...mapActions("transporter", ["createTransporter", "updateTransporter", "fetchTransporterDetail"]),

    // Fetch transporter details if in edit mode
    async fetchTransporterDetail() {
      try {
        await this.$store.dispatch("transporter/fetchTransporterDetail", this.transporterId);
        // Populate form with transporter details after fetching
        this.transporter = { ...this.$store.state.transporter.transporterDetail };
        this.initialTransporter = JSON.parse(JSON.stringify(this.transporter)); // Store the initial transporter data
      } catch (error) {
        console.error("Error fetching transporter details:", error);
        this.error = "Error fetching transporter details.";
      }
    },

    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },

    // Add a new location
    addLocation() {
      this.transporter.sendingLocations.push({
        name: "",
        city: "",
        state: "",
        pincode: ""
      });
    },

    // Remove a location
    removeLocation(index) {
      if (this.transporter.sendingLocations.length > 1) {
        this.transporter.sendingLocations.splice(index, 1);
      }
    },

    // Save transporter (create or update)
    async saveTransporter() {
      try {
        if (this.isEditMode) {
          console.log('Updating transporter with ID:', this.transporterId);  // Debug log
          await this.$store.dispatch("transporter/updateTransporter", {
            transporterId: this.transporterId,
            transporterData: this.transporter,
          });
        } else {
          await this.$store.dispatch("transporter/createTransporter", this.transporter);
        }
        this.$router.push("/transporter"); // Redirect to transporter list after save
      } catch (err) {
        console.log(err);
        // Check for duplicate key error or other API errors
        if (err.response && err.response.data) {
          const errorMessage = err.response.data.message;
          this.error = errorMessage; // Show the exact error message
        } else {
          this.error = "Error saving transporter."; // Generic error message
        }
      }
    },
  },
};
</script>

<style scoped>
.v-card {
  border: 1px solid #e0e0e0;
}

.v-card-title {
  background-color: #f5f5f5;
  font-weight: 500;
}

h3 {
  color: #1976d2;
  border-bottom: 2px solid #e3f2fd;
  padding-bottom: 8px;
}
</style>