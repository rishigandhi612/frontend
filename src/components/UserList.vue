<template>
    <div class="user-list">
      <h1>All Users</h1>
  
      <!-- Display loading spinner -->
      <div v-if="isLoading" class="loading-spinner">
        <p>Loading users...</p>
      </div>
  
      <!-- Display error message -->
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>
  
      <!-- Display user list -->
      <div v-else>
        <table v-if="users.length > 0" class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user._id">
              <td>{{ user._id }}</td>
              <td>{{ user.emailid }}</td>
              <td>
                <button @click="viewUserDetail(user._id)">View</button>
                <button @click="deleteUser(user._id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
  
        <p v-else>No users found.</p>
      </div>
    </div>
  </template>
  
  <script>
  import { mapGetters, mapActions } from 'vuex';
  
  export default {
    name: 'UserList',
    data() {
      return {
        error: null, // To store any error messages
      };
    },
    computed: {
      ...mapGetters('users', ['allUsers', 'isLoading']), // Correctly reference the namespaced module
  
      users() {
        return this.allUsers; // Get all users from Vuex store
      },
    },
    methods: {
      ...mapActions('users', ['fetchUsers', 'deleteUser']), // Correctly reference the namespaced module
  
      async viewUserDetail(userId) {
        // Navigate to the user detail page
        this.$router.push(`/user/${userId}`);
      },
  
      async deleteUser(userId) {
        try {
          if (confirm('Are you sure you want to delete this user?')) {
            await this.deleteUser(userId); // Call delete action
            alert('User deleted successfully.');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          alert('Failed to delete user.');
        }
      },
    },
    async created() {
      try {
        console.log('Fetching users...');
        await this.fetchUsers();
        console.log('Users fetched:', this.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        this.error = 'Failed to load users. Please try again later.';
      }
    },
  };
  </script>
  
  <style scoped>
  .user-list {
    margin: 20px;
  }
  
  .user-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  .user-table th,
  .user-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  .user-table th {
    background-color: #f4f4f4;
  }
  
  .loading-spinner,
  .error-message {
    text-align: center;
    margin: 20px;
  }
  </style>
  