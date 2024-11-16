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
                  :rules="[emailRequired]"
                />
                <v-text-field
                  v-model="password"
                  label="Enter your password"
                  type="password"
                  required
                  outlined
                  :rules="[passwordRequired]"
                />
                
                <!-- Submit button -->
                <v-btn
                  type="submit"
                  class="submit-btn"
                  color="success"
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
                <v-alert v-if="errorMessage" type="error" dismissible>
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
import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      emailid: '',
      password: '',
      errorMessage: '', // Error message state
      loading: false,   // Loading state to show spinner
    };
  },
  computed: {
    ...mapGetters(['isAuthenticated']), // Get authentication state from Vuex
    emailRequired() {
      return v => !!v || 'Email is required';
    },
    passwordRequired() {
      return v => !!v || 'Password is required';
    },
  },
  methods: {
    ...mapActions(['loginUser']),
    login() {
      this.loading = true; // Show spinner while API call is in progress
      const credentials = {
        emailid: this.emailid,
        password: this.password,
      };

      this.loginUser(credentials)
        .then(() => {
          // Reset error message and loading state on successful login
          this.errorMessage = '';
          this.loading = false; // Hide spinner
          // Redirect to dashboard after successful login
          this.$router.push('/dashboard');
        })
        .catch(error => {
          console.log('Login failed:', error);
          // Set error message and hide the spinner on failure
          this.errorMessage = 'Login failed. Please check your credentials.';
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

