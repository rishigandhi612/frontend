<template>
  <v-main fluid class="fill-height">
    <v-container class="login-container">
      <v-form v-if="!isAuthenticated" @submit.prevent="login">
        <v-row>
          <v-col cols="12" md="6" sm="12" xl="12">
            <v-card elevation="10" justify="center" min-width="350">
              <v-card-title>
                <p>Hello, Welcome!</p>
              </v-card-title>
              <v-card-text>
                <!-- Email and password fields -->
                <v-text-field
                  v-model="emailid"
                  label="Enter your email"
                  type="email"
                  required
                  outlined
                  :rules="[emailRequired, emailFormat]"
                />
                <v-text-field
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  label="Enter your password"
                  required
                  outlined
                  :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append="togglePasswordVisibility"
                  :rules="[passwordRequired, passwordFormat]"
                />

                <!-- Submit button -->
                <v-btn
                  type="submit"
                  class="submit-btn"
                  color="orange accent-4"
                  dark
                  block
                  :disabled="loading"
                >
                  <v-icon>mdi-import</v-icon> Login
                </v-btn>

                <!-- Loader: Show when loading is true -->
                <v-progress-circular
                  v-if="loading"
                  indeterminate
                  color="primary"
                  size="30"
                  class="loader-spinner"
                ></v-progress-circular>

                <!-- Error message if login fails -->
                <v-alert
                  v-if="errorMessage"
                  type="error"
                  dismissible
                  class="mt-2"
                >
                  {{ errorMessage }}
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-form>

      <!-- Optional message for authenticated users -->
      <div v-else class="auth-message">
        <p>You are already logged in.</p>
      </div>
    </v-container>
  </v-main>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  data() {
    return {
      emailid: "",
      password: "",
      showPassword: false, // Password visibility toggle
      errorMessage: "",
      loading: false,
    };
  },
  computed: {
    ...mapGetters(["isAuthenticated"]), // Get authentication state from Vuex

    // Validation rules
    emailRequired() {
      return (v) => !!v || "Email is required";
    },
    emailFormat() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return (v) => emailRegex.test(v) || "Enter a valid email address";
    },
    passwordRequired() {
      return (v) => !!v || "Password is required";
    },
    passwordFormat() {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
      return (v) =>
        passwordRegex.test(v) ||
        "Password must be at least 8 characters, include at least one letter and one number";
    },
  },
  methods: {
    ...mapActions(["loginUser"]),
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword; // Toggle password visibility
    },
    login() {
      this.loading = true;
      const credentials = {
        emailid: this.emailid,
        password: this.password,
      };

      this.loginUser(credentials)
        .then(() => {
          this.errorMessage = "";
          this.loading = false;
          this.$router.push("/dashboard");
        })
        .catch((error) => {
          console.log("Login failed:", error);
          if (error.message === "Network Error") {
            this.errorMessage =
              "No internet connection. Please check your network.";
          } else if (error.code === "ECONNABORTED") {
            this.errorMessage = "Request timed out. Please try again.";
          } else if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            this.errorMessage = error.response.data.message;
          } else {
            this.errorMessage = "Login failed. Please check your credentials.";
          }
          this.loading = false;
        });
    },
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.auth-message {
  text-align: center;
  font-size: 1.2em;
  color: #333;
}

.error-message {
  color: #d9534f;
  text-align: center;
  margin-top: 15px;
}

/* Style the loader spinner to be centered */
.loader-spinner {
  display: block;
  margin: 20px auto;
}
</style>
