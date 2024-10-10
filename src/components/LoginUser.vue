<template>
  <div class="login-container">
    <!-- Show form only if user is not authenticated -->
    <form v-if="!isAuthenticated" @submit.prevent="login" class="login-form">
      <h2>Hello, Welcome!</h2>
      <div class="form-group">
        <input
          id="email"
          v-model="emailid"
          type="email"
          placeholder="Enter your email"
          required
          class="input-field"
        />
      </div>

      <div class="form-group">
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Enter your password"
          required
          class="input-field"
        />
      </div>

      <button type="submit" class="submit-btn">Login</button>
      
      <!-- Display error message if login fails -->
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>

    <!-- Optional message for authenticated users or future customization -->
    <div v-else class="auth-message">
      <p>You are already logged in.</p>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      emailid: '',
      password: '',
      errorMessage: '', // New property for error messages
    };
  },
  computed: {
    ...mapGetters(['isAuthenticated']), // Get authentication state from Vuex
  },
  methods: {
    ...mapActions(['loginUser']),
    login() {
      const credentials = {
        emailid: this.emailid,
        password: this.password,
      };

      this.loginUser(credentials)
        .then(() => {
          // Reset error message on successful login
          this.errorMessage = '';
          // Redirect after successful login
          this.$router.push('/dashboard');
        })
        .catch(error => {
          console.log('Login failed:', error);
          // Set error message based on error response
          this.errorMessage = 'Login failed. Please check your credentials.';
        });
    },
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 18%;
  /* height: 100vh; */
  /* background-color: #f5f5f5; */
}

.login-form {
  width: 25%;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Media query for small screens */
@media (max-width: 768px) {
  .login-form {
    width: 80%; /* Set width to 80% for small screens */
  }

  .login-form {
    margin-top: 50%; /* Set width to 80% for small screens */
  }
}

h2 {
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.5em;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.input-field {
  width: 80%;
  padding: 10px;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #218838;
}

.auth-message {
  text-align: center;
  font-size: 1.2em;
  color: #333;
}

.error-message {
  color: #d9534f; /* Bootstrap danger color */
  text-align: center;
  margin-top: 15px;
}
</style>
