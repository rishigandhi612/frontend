<template>
  <v-container fluid>
    <v-row>
      <v-col md="2" cols="12">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12">
        <h1 class="text-center">Transporters List</h1>
        <v-data-table
          :headers="headers"
          :items="transporters"
          :loading="isLoading"
          item-key="_id"
          class="elevation-1"
          :items-per-page="10"
          v-if="transporters.length > 0 && !isLoading"
        >
          <template v-slot:item="{ item }">
            <tr @click="viewTransporterDetail(item._id)" style="cursor: pointer">
              <td>{{ item.name }}</td>
              <td>{{ item.contactPerson }}</td>
              <td>{{ item.phone }}</td>
              <td>{{ item.email }}</td>
              <td>
                <v-chip
                  :color="item.isActive ? 'success' : 'error'"
                  text-color="white"
                  small
                >
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </v-chip>
              </td>
              <td>
                <v-btn 
                  small 
                  icon 
                  @click.stop="editTransporterDetail(item._id)"
                  color="primary"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn 
                  small 
                  icon 
                  @click.stop="toggleStatus(item)"
                  :color="item.isActive ? 'orange' : 'success'"
                >
                  <v-icon>{{ item.isActive ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                </v-btn>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
      <v-col md="2" cols="12">
        <v-row>
          <v-col md="12" cols="12">
            <v-btn @click="fetchTransporters" color="primary" block>
              <v-icon>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
          <v-col md="12" cols="12">
            <!-- Add Transporter Button -->
            <v-btn @click="navigateToAddTransporter" color="success" block>
              <v-icon>mdi-plus</v-icon> Add Transporter
            </v-btn>
          </v-col>
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
    <!-- Display message if no transporters found -->
    <p v-else-if="transporters.length === 0">No transporters found.</p>
    <!-- Display error message -->
    <v-row v-if="error" class="error-message">
      <p>{{ error }}</p>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "TransporterList",
  data() {
    return {
      error: null, // To store any error messages
      headers: [
        { text: "Name", value: "name" },
        { text: "Contact Person", value: "contactPerson" },
        { text: "Phone", value: "phone" },
        { text: "Email", value: "email" },
        { text: "Status", value: "isActive", sortable: false },
        { text: "Actions", value: "actions", sortable: false },
      ],
    };
  },
  computed: {
    ...mapGetters("transporter", ["allTransporters", "isLoading"]), // Correctly reference the namespaced module
    transporters() {
      return this.allTransporters; // Get all transporters from Vuex store
    },
  },
  methods: {
    ...mapActions("transporter", ["fetchTransporters", "deleteTransporter", "toggleTransporterStatus"]), // Correctly reference the namespaced module

    // Method to navigate to the transporter's detail page
    async viewTransporterDetail(transporterId) {
      this.$router.push(`/transporter/${transporterId}`);
    },
    
    // Method to edit the transporter's detail page
    async editTransporterDetail(transporterId) {
      this.$router.push(`/addtransporter/${transporterId}`);
    },

    // Method to toggle transporter status
    async toggleStatus(transporter) {
      try {
        const confirmMessage = transporter.isActive 
          ? "Are you sure you want to deactivate this transporter?" 
          : "Are you sure you want to activate this transporter?";
        
        if (confirm(confirmMessage)) {
          await this.toggleTransporterStatus({ 
            id: transporter._id, 
            isActive: !transporter.isActive 
          });
          const statusText = !transporter.isActive ? 'activated' : 'deactivated';
          alert(`Transporter ${statusText} successfully.`);
        }
      } catch (error) {
        console.error("Error toggling transporter status:", error);
        alert("Failed to update transporter status.");
      }
    },

    // Method to delete a transporter
    async removeTransporter(transporterId) {
      try {
        if (confirm("Are you sure you want to delete this transporter?")) {
          await this.deleteTransporter(transporterId); // Call delete action
          alert("Transporter deleted successfully.");
        }
      } catch (error) {
        console.error("Error deleting transporter:", error);
        alert("Failed to delete transporter.");
      }
    },

    navigateToAddTransporter() {
      // Navigate to the add transporter page
      this.$router.push("/addtransporter");
    },

    goBack() {
      this.$router.go(-1); // Go back to the previous page
    },
  },
  async created() {
    try {
      console.log("Fetching transporters...");
      await this.fetchTransporters(); // Fetch transporters when the component is created
      console.log("Transporters fetched:", this.transporters);
    } catch (error) {
      console.error("Error fetching transporters:", error);
      this.error = "Failed to load transporters. Please try again later.";
    }
  },
};
</script>

<style scoped>
.transporter-list {
  margin: 20px;
}

.loading-spinner,
.error-message {
  text-align: center;
  margin: 20px;
}
</style>