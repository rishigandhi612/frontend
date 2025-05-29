<template>
  <v-app>
    <v-container fluid>
      <v-alert v-if="!User" type="error" dismissible>
        Failed to load User details. Please try again later.
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
                  <h1 align="center">About User</h1>
                </v-col>
                <v-col cols="12" md="12">
                  <v-card v-if="User">
                    <v-card-title>
                      <span class="headline">{{
                        User.emailid || "No Email available."
                      }}</span>
                    </v-card-title>

                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="6" justify="end">
                          <v-row>
                            <v-col>
                              <strong>Name:</strong>
                              {{ User.name || "No Name available." }}
                            </v-col>
                          </v-row>
                        </v-col>
                        <v-col>
                          <strong>Description:</strong>
                          {{ User.desc || "No description available." }}
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <!-- If no User is found -->
                  <v-card
                    v-if="!User"
                    class="mx-auto elevation-4"
                    max-width="800"
                  >
                    <v-card-text>
                      <p class="text-center">No User found.</p>
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
                    @click="updateUser"
                    class="w-100 text-uppercase"
                  >
                    <v-icon left>mdi-pencil</v-icon> Update User
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    color="error"
                    @click="openDeleteConfirmation"
                    class="w-100 text-uppercase"
                  >
                    <v-icon left>mdi-delete</v-icon> Delete User
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
              Are you sure you want to delete this User? This action cannot be
              undone.
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green" text @click="deleteUser">Yes, Delete</v-btn>
              <v-btn color="red" text @click="deleteDialog = false"
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
      UserId: this.$route.params.id, // Get the userId from the route params
      error: null, // Error state
      deleteDialog: false, // State for delete confirmation dialog
    };
  },
  computed: {
    // Get user data from Vuex store
    User() {
      return this.$store.state.users.userDetail; // Get user detail from store
    },
    // Loading state
    loading() {
      return this.$store.state.loading; // Access loading state from Vuex
    },
  },
  methods: {
    // Vuex actions mapping
    ...mapActions("users", ["fetchUserDetail", "updateUser", "deleteUser"]),

    // Load the user details
    async loadUserDetail() {
      try {
        this.$store.commit("users/SET_LOADING", true); // Start loading spinner
        await this.fetchUserDetail(this.UserId); // Fetch user data by ID
      } catch (err) {
        this.error = "Error fetching User details.";
      } finally {
        this.$store.commit("users/SET_LOADING", false); // Stop loading spinner
      }
    },

    // Update user
    updateUser() {
      this.$router.push(`/addUser/${this.UserId}`); // Redirect to update page
    },

    // Open delete confirmation dialog
    openDeleteConfirmation() {
      this.deleteDialog = true; // Open the confirmation dialog
    },

    // Delete user
    async deleteUser() {
      try {
        // Call the Vuex action
        await this.$store.dispatch("users/deleteUser", this.UserId);
        await this.$router.push("/user"); // Navigate to the user list
      } catch (err) {
        this.error = "Error deleting User."; // Handle error
        console.error("Error deleting user:", err);
      } finally {
        this.deleteDialog = false; // Close the confirmation dialog
      }
    },

    // Go back to the previous page
    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
  },
  created() {
    this.loadUserDetail(); // Load user details when the component is created
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
</style>
