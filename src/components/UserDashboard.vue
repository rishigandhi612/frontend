<template>
  <div>
    <div class="dashboard-header mt-4">
  <div class="row">
    <div class="col-9 text-left pl-5">
      <h1>Welcome to your Dashboard</h1>
    </div>
    <div class="col-3 text-right pr-5">
      <button @click="logout()" class="logout-btn">Logout</button>
    </div>
  </div>
</div>
    <div class="dashboard-container">
    <p>This is a protected page only visible to authenticated users.</p>
  </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'UserDashboard',
  methods: {
    ...mapActions(['logoutUser']),
    logout() {
      this.logoutUser()
        .then(() => {
          // Redirect to the home page after logout
          this.$router.push('/');
        })
        .catch(error => {
          console.log("Logout failed:", error);
        });
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  text-align: center;
  min-height: 100vh;
}

h1 {
  color: #333;
}

p {
  font-size: 1.2em;
  color: #666;
}

.logout-btn {
  padding: 10px 20px;
  background-color: #dc3545;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  border-radius: 50px;
}

.logout-btn:hover {
  background-color: #c82333;
}
</style>
