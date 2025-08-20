<template>
  <v-container fluid>
    <v-row v-if="isComponentLoading">
      <v-col class="d-flex justify-center align-center">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-col>
    </v-row>
    <v-row v-if="!isComponentLoading">
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
              <v-btn color="primary" @click="addLocation" class="mb-3">
                <v-icon left>mdi-plus</v-icon>
                Add Location
              </v-btn>
            </v-col>

            <v-col
              cols="12"
              v-for="(location, index) in transporter.sendingLocations"
              :key="index"
            >
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
                :disabled="!isFormValid || isComponentLoading || !hasChanges"
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
import { mapActions, mapGetters } from "vuex";

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
            pincode: "",
          },
        ],
        vehicleTypes: [],
        isActive: true,
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
        "Auto",
      ],
      rules: {
        required: (value) => !!value || "This field is required",
        email: (value) => {
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return pattern.test(value) || "Please enter a valid email address";
        },
        phone: (value) => {
          const pattern = /^[6-9]\d{9}$/;
          return (
            pattern.test(value) || "Please enter a valid 10-digit phone number"
          );
        },
        gst: (value) => {
          if (!value) return true; // GST is optional
          const pattern =
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
          return pattern.test(value) || "Please enter a valid GST number";
        },
        pincode: (value) => {
          const pattern = /^[1-9][0-9]{5}$/;
          return pattern.test(value) || "Please enter a valid 6-digit pincode";
        },
      },
      error: null, // To store the error message
    };
  },
  computed: {
    ...mapGetters("transporter", ["currentTransporter", "isLoading"]),

    isComponentLoading() {
      return (
        this.isLoading("fetchOne") ||
        this.isLoading("create") ||
        this.isLoading("update")
      );
    },

    hasChanges() {
      // Compare the current transporter with the initial transporter
      return (
        JSON.stringify(this.transporter) !==
        JSON.stringify(this.initialTransporter)
      );
    },
  },

  async mounted() {
    console.log("Component mounted - Edit mode:", this.isEditMode);
    console.log("Transporter ID:", this.transporterId);

    if (this.isEditMode) {
      await this.fetchTransporterData(); // Fetch transporter details for edit mode
    } else {
      // Store initial state for new transporter
      this.initialTransporter = JSON.parse(JSON.stringify(this.transporter));
    }
  },

  methods: {
    ...mapActions("transporter", [
      "createTransporter",
      "updateTransporter",
      "fetchTransporterById",
      "clearMessages",
    ]),

    // Fetch transporter details if in edit mode
    async fetchTransporterData() {
      this.error = null;

      try {
        console.log("Fetching transporter with ID:", this.transporterId);
        console.log("ID type:", typeof this.transporterId);

        // Ensure we have a valid string ID
        if (!this.transporterId || typeof this.transporterId !== "string") {
          throw new Error("Invalid transporter ID");
        }

        const transporterData = await this.fetchTransporterById(
          this.transporterId
        );
        console.log("Fetched transporter data:", transporterData);

        if (transporterData) {
          // Populate form with fetched data
          this.transporter = {
            name: transporterData.name || "",
            contactPerson: transporterData.contactPerson || "",
            phone: transporterData.phone || "",
            email: transporterData.email || "",
            gstNumber: transporterData.gstNumber || "",
            vehicleTypes: transporterData.vehicleTypes || [],
            isActive:
              transporterData.isActive !== undefined
                ? transporterData.isActive
                : true,
            sendingLocations:
              transporterData.sendingLocations &&
              transporterData.sendingLocations.length > 0
                ? transporterData.sendingLocations
                : [
                    {
                      name: "",
                      city: "",
                      state: "",
                      pincode: "",
                    },
                  ],
          };

          // Store initial state for change detection
          this.initialTransporter = JSON.parse(
            JSON.stringify(this.transporter)
          );

          console.log("Form populated with:", this.transporter);
        } else {
          this.error = "Transporter not found or could not be loaded.";
        }
      } catch (error) {
        console.error("Error fetching transporter details:", error);
        this.error =
          error.response?.data?.message ||
          error.message ||
          "Error fetching transporter details.";
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
        pincode: "",
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
      this.error = null;

      try {
        // Validate form first
        if (!this.$refs.transporterForm.validate()) {
          this.error = "Please fix the validation errors before submitting.";
          return;
        }

        console.log("Saving transporter:", this.transporter);

        if (this.isEditMode) {
          console.log("Updating transporter with ID:", this.transporterId);
          await this.updateTransporter({
            id: this.transporterId,
            data: this.transporter,
          });
          console.log("Transporter updated successfully");
        } else {
          console.log("Creating new transporter");
          await this.createTransporter(this.transporter);
          console.log("Transporter created successfully");
        }

        // Navigate back to transporter list
        this.$router.push("/transporter");
      } catch (err) {
        console.error("Error saving transporter:", err);

        // Handle different types of errors
        if (err.response?.data?.message) {
          this.error = err.response.data.message;
        } else if (err.message) {
          this.error = err.message;
        } else {
          this.error = `Error ${
            this.isEditMode ? "updating" : "creating"
          } transporter.`;
        }
      }
    },
  },

  // Watch for route changes
  watch: {
    "$route.params.id": {
      async handler(newId) {
        console.log("Route param changed to:", newId);
        this.transporterId = newId;
        this.isEditMode = !!newId;

        if (this.isEditMode) {
          await this.fetchTransporterData();
        } else {
          // Reset form for new transporter
          this.transporter = {
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
                pincode: "",
              },
            ],
            vehicleTypes: [],
            isActive: true,
          };
          this.initialTransporter = JSON.parse(
            JSON.stringify(this.transporter)
          );
        }
      },
      immediate: false,
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
