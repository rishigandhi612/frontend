<template>
  <v-container fluid>
    <v-row>
      <v-col md="2" cols="12">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn></v-col
      >
      <v-col md="8" cols="12">
        <h1 class="text-center">Users List</h1>
        <v-data-table
          :headers="headers"
          :items="users"
          :loading="isLoading"
          item-key="_id"
          class="elevation-1"
          :items-per-page="10"
          v-if="users.length > 0 && !isLoading"
        >
          <template v-slot:item="{ item }">
            <tr @click="viewUserDetail(item._id)" style="cursor: pointer">
              <td>{{ item._id }}</td>
              <td>{{ item.emailid }}</td>
              <td>
                <v-btn small icon @click.stop="editUserDetail(item._id)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
      <v-col md="2" cols="12">
        <v-row>
          <v-col md="12" cols="12">
            <v-btn @click="fetchUsers" color="primary" block>
              <v-icon>mdi-refresh</v-icon>
              Refresh
            </v-btn></v-col
          >
          <v-col md="12" cols="12"
            ><!-- Add User Button -->
            <v-btn @click="navigateToAddUser" color="success" block>
              <v-icon>mdi-plus</v-icon> Add User
            </v-btn></v-col
          >
        </v-row>
      </v-col>
    </v-row>

    <v-row v-if="isLoading" class="d-flex justify-center align-center">
      <v-progress-circular
        indeterminate
        color="primary"
        size="50"
      ></v-progress-circular>
    </v-row>
    <!-- Display message if no users found -->
    <p v-else-if="this.users === 0">No users found.</p>
    <!-- Display error message -->
    <v-row v-if="error" class="error-message">
      <p>{{ error }}</p>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "UserList",
  data() {
    return {
      error: null, // To store any error messages
      headers: [
        { text: "User ID", value: "_id" },
        { text: "Email", value: "emailid" },
        { text: "Actions", value: "actions", sortable: false },
      ],
    };
  },
  computed: {
    ...mapGetters("users", ["allUsers", "isLoading"]), // Correctly reference the namespaced module
    users() {
      return this.allUsers; // Get all users from Vuex store
    },
  },
  methods: {
    ...mapActions("users", ["fetchUsers", "deleteUser"]), // Correctly reference the namespaced module

    // Method to navigate to the user's detail page
    async viewUserDetail(userId) {
      this.$router.push(`/user/${userId}`);
    },
    // Method to edit the user's detail page
    async editUserDetail(userId) {
      this.$router.push(`/adduser/${userId}`);
    },

    // Method to delete a user
    async removeUser(userId) {
      try {
        if (confirm("Are you sure you want to delete this user?")) {
          await this.deleteUser(userId); // Call delete action
          alert("User deleted successfully.");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user.");
      }
    },
    navigateToAddUser() {
      // Navigate to the add user page
      this.$router.push("/adduser");
    },
    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
  },
  async created() {
    try {
      console.log("Fetching users...");
      await this.fetchUsers(); // Fetch users when the component is created
      console.log("Users fetched:", this.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      this.error = "Failed to load users. Please try again later.";
    }
  },
};
</script>

<style scoped>
.user-list {
  margin: 20px;
}

.loading-spinner,
.error-message {
  text-align: center;
  margin: 20px;
}
</style>
