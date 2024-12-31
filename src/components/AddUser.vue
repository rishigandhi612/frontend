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
          {{ isEditMode ? "Edit User" : "Add User" }}
        </h1>

        <v-form ref="userForm" v-model="isFormValid">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                label="Email Id"
                v-model="user.emailid"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                label="Password"
                v-model="user.password"
                :rules="[rules.required]"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-btn
                :disabled="!isFormValid || isLoading || !hasChanges"
                color="primary"
                @click="saveUser"
              >
                {{ isEditMode ? "Update User" : "Create User" }}
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
      user: {
        emailid: "",
        password: "",
      },
      initialUser: null, // To store the initial user data
      userId: this.$route.params.id, // user ID from route
      isEditMode: !!this.$route.params.id, // True if editing
      rules: {
        required: (value) => !!value || "This field is required",
      },
      error: null, // To store the error message
    };
  },
  computed: {
    ...mapState("users", ["loading"]), // Map loading state from Vuex store
    isLoading() {
      return this.loading;
    },
    hasChanges() {
      // Compare the current user with the initial user
      return JSON.stringify(this.user) !== JSON.stringify(this.initialUser);
    },
  },
  created() {
    console.log('userId from route params:', this.userId);  // Debug log
    if (this.isEditMode) {
      this.fetchUserDetail(); // Fetch user details for edit mode
    }
  },
  methods: {
    ...mapActions("users", ["saveUserInStore", "fetchUserDetail"]),

    // Fetch user details if in edit mode
    async fetchUserDetail() {
      try {
        await this.$store.dispatch("users/fetchUserDetail", this.userId);
        // Populate form with user details after fetching
        this.user = { ...this.$store.state.users.userDetail };
        this.initialUser = { ...this.user }; // Store the initial user data
        this.user.password=""
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    },

    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },

    // Save user (create or update)
    async saveUser() {
      try {
        if (this.isEditMode) {
            console.log('Updating user with ID:', this.userId);  // Debug log
          await this.$store.dispatch("users/updateUser", {
            userId: this.userId,
            userData: this.user,
          });
        } else {
          await this.$store.dispatch("users/createUser", this.user);
        }
        this.$router.push("/user"); // Redirect to user list after save
      } catch (err) {
        // Check for duplicate key error (MongoDB E11000)
        if (err.response && err.response.data) {
          const errorMessage = err.response.data.message;
          this.error = errorMessage || "Error saving user."; // Show the exact error message
        } else {
          this.error = "Error saving user."; // Generic error message
        }
      }
    },
  },
};
</script>
