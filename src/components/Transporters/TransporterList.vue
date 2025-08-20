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

        <!-- Search and Filter Section -->
        <!-- <v-card class="mb-4">
          <v-card-text> -->
        <!-- <v-row>
              <v-col cols="12" md="4">
               
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="searchFilters.name"
                  label="Name"
                  clearable
                  dense
                  outlined
                  @input="debouncedSearch"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="searchFilters.city"
                  label="City"
                  clearable
                  dense
                  outlined
                  @input="debouncedSearch"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="searchFilters.state"
                  label="State"
                  clearable
                  dense
                  outlined
                  @input="debouncedSearch"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-btn @click="clearFilters" color="warning" block small>
                  <v-icon left>mdi-filter-remove</v-icon>
                  Clear
                </v-btn>
              </v-col>
            </v-row> -->

        <!-- Sort Options -->
        <!-- <v-row>
              <v-col cols="6" md="2">
                <v-select
                  v-model="searchFilters.sortBy"
                  :items="sortOptions"
                  label="Sort By"
                  dense
                  outlined
                  @change="performSearch"
                />
              </v-col>
              <v-col cols="6" md="2">
                <v-select
                  v-model="searchFilters.sortOrder"
                  :items="sortOrderOptions"
                  label="Order"
                  dense
                  outlined
                  @change="performSearch"
                />
              </v-col>
              <v-col cols="12" md="8" class="d-flex align-center">
                <v-chip v-if="pagination.totalCount > 0" color="info" small>
                  {{ pagination.totalCount }} transporters found
                </v-chip>
              </v-col>
            </v-row> -->
        <!-- </v-card-text>
        </v-card> -->
        <v-row>
          <v-col>
            <v-text-field
              v-model="searchFilters.search"
              label="Search Transporters"
              placeholder="Search by name, city, state, contact..."
              prepend-inner-icon="mdi-magnify"
              clearable
              dense
              outlined
              @input="debouncedSearch"
            />
          </v-col>
        </v-row>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="searchResults"
          :loading="isSearchLoading"
          item-key="_id"
          class="elevation-1"
          v-if="searchResults.length > 0 || isSearchLoading"
        >
          <template v-slot:item="{ item }">
            <tr
              @click="viewTransporterDetail(item._id)"
              style="cursor: pointer"
            >
              <td>{{ item.name }}</td>
              <td>{{ item.contactPerson }}</td>
              <td>{{ item.phone }}</td>
              <td>{{ item.email }}</td>
              <td>
                <span
                  v-if="
                    item.sendingLocations && item.sendingLocations.length > 0
                  "
                >
                  {{ item.sendingLocations[0].city }},
                  {{ item.sendingLocations[0].state }}
                  <v-chip
                    v-if="item.sendingLocations.length > 1"
                    x-small
                    color="primary"
                  >
                    +{{ item.sendingLocations.length - 1 }} more
                  </v-chip>
                </span>
                <span v-else>-</span>
              </td>
              <td>
                <v-chip
                  :color="item.isActive ? 'success' : 'error'"
                  text-color="white"
                  small
                >
                  {{ item.isActive ? "Active" : "Inactive" }}
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
                <!-- <v-btn
                  small
                  icon
                  @click.stop="toggleStatus(item)"
                  :color="item.isActive ? 'orange' : 'success'"
                  :loading="isToggleLoading"
                >
                  <v-icon>{{
                    item.isActive ? "mdi-pause" : "mdi-play"
                  }}</v-icon>
                </v-btn> -->
              </td>
            </tr>
          </template>
        </v-data-table>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="text-center mt-4">
          <v-pagination
            v-model="currentPage"
            :length="pagination.totalPages"
            :total-visible="7"
            @input="changePage"
            circle
          />

          <!-- Items per page selector -->
          <div class="mt-2">
            <v-select
              v-model="itemsPerPage"
              :items="itemsPerPageOptions"
              label="Items per page"
              dense
              outlined
              style="max-width: 120px; margin: 0 auto"
              @change="changeItemsPerPage"
            />
          </div>

          <!-- Pagination info -->
          <div class="caption mt-2 text-center">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} -
            {{ Math.min(currentPage * itemsPerPage, pagination.totalCount) }} of
            {{ pagination.totalCount }} items
          </div>
        </div>
      </v-col>

      <v-col md="2" cols="12">
        <v-row>
          <v-col md="12" cols="12">
            <v-btn
              @click="refreshData"
              color="primary"
              block
              :loading="isSearchLoading"
            >
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

    <!-- Loading State -->
    <v-row v-if="isSearchLoading" class="d-flex justify-center align-center">
      <v-progress-circular
        indeterminate
        color="primary"
        size="50"
      ></v-progress-circular>
    </v-row>

    <!-- No Results Message -->
    <v-row
      v-else-if="searchResults.length === 0 && !isSearchLoading"
      class="text-center"
    >
      <v-col>
        <v-icon size="64" color="grey lighten-1">mdi-truck-outline</v-icon>
        <p class="headline grey--text">No transporters found</p>
        <p class="body-1 grey--text">
          {{
            hasActiveFilters
              ? "Try adjusting your search filters"
              : "Get started by adding a new transporter"
          }}
        </p>
        <v-btn
          v-if="hasActiveFilters"
          @click="clearFilters"
          color="primary"
          outlined
        >
          Clear Filters
        </v-btn>
      </v-col>
    </v-row>

    <!-- Success/Error Messages -->
    <v-snackbar v-model="showSuccessMessage" color="success" timeout="3000">
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar v-model="showErrorMessage" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title class="headline">{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="confirmDialog.show = false">
            Cancel
          </v-btn>
          <v-btn
            :color="confirmDialog.color"
            text
            @click="confirmDialog.action"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { debounce } from "lodash";

export default {
  name: "TransporterList",
  data() {
    return {
      headers: [
        { text: "Name", value: "name" },
        { text: "Contact Person", value: "contactPerson" },
        { text: "Phone", value: "phone" },
        { text: "Email", value: "email" },
        { text: "Location", value: "location" },
        { text: "Status", value: "isActive", sortable: false },
        { text: "Actions", value: "actions", sortable: false },
      ],

      // Search and pagination state
      searchFilters: {
        search: "",
        name: "",
        city: "",
        state: "",
        sortBy: "name",
        sortOrder: "asc",
      },

      currentPage: 1,
      itemsPerPage: 10,

      // Options
      sortOptions: [
        { text: "Name", value: "name" },
        { text: "Created Date", value: "createdAt" },
        { text: "Updated Date", value: "updatedAt" },
      ],

      sortOrderOptions: [
        { text: "Ascending", value: "asc" },
        { text: "Descending", value: "desc" },
      ],

      itemsPerPageOptions: [5, 10, 25, 50, 100],

      // Confirmation dialog
      confirmDialog: {
        show: false,
        title: "",
        message: "",
        color: "primary",
        action: null,
      },
    };
  },

  computed: {
    ...mapGetters("transporter", [
      "searchResults",
      "pagination",
      "isLoading",
      "successMessage",
      "errorMessage",
    ]),

    isSearchLoading() {
      return this.isLoading("search");
    },

    isToggleLoading() {
      return this.isLoading("toggleStatus");
    },

    hasActiveFilters() {
      return !!(
        this.searchFilters.search ||
        this.searchFilters.name ||
        this.searchFilters.city ||
        this.searchFilters.state
      );
    },

    showSuccessMessage: {
      get() {
        return !!this.successMessage;
      },
      set() {
        this.clearMessages();
      },
    },

    showErrorMessage: {
      get() {
        return !!this.errorMessage;
      },
      set() {
        this.clearMessages();
      },
    },

    debouncedSearch() {
      return debounce(this.performSearch, 500);
    },
  },

  methods: {
    ...mapActions("transporter", [
      "searchTransporters",
      "toggleTransporterStatus",
      "deleteTransporter",
      "clearMessages",
    ]),

    async performSearch() {
      try {
        const searchParams = {
          page: this.currentPage,
          limit: this.itemsPerPage,
          sortBy: this.searchFilters.sortBy,
          sortOrder: this.searchFilters.sortOrder,
        };

        // Add search filters if they exist
        if (this.searchFilters.search)
          searchParams.search = this.searchFilters.search;
        if (this.searchFilters.name)
          searchParams.name = this.searchFilters.name;
        if (this.searchFilters.city)
          searchParams.city = this.searchFilters.city;
        if (this.searchFilters.state)
          searchParams.state = this.searchFilters.state;

        await this.searchTransporters(searchParams);
      } catch (error) {
        console.error("Error searching transporters:", error);
        // Error message will be handled by the store
      }
    },

    async refreshData() {
      await this.performSearch();
    },

    changePage(page) {
      this.currentPage = page;
      this.performSearch();
    },

    changeItemsPerPage() {
      this.currentPage = 1; // Reset to first page
      this.performSearch();
    },

    clearFilters() {
      this.searchFilters = {
        search: "",
        name: "",
        city: "",
        state: "",
        sortBy: "name",
        sortOrder: "asc",
      };
      this.currentPage = 1;
      this.performSearch();
    },

    // Navigation methods
    viewTransporterDetail(transporterId) {
      this.$router.push(`/transporter/${transporterId}`);
    },

    editTransporterDetail(transporterId) {
      this.$router.push(`/addtransporter/${transporterId}`);
    },

    navigateToAddTransporter() {
      this.$router.push("/addtransporter");
    },

    goBack() {
      this.$router.go(-1);
    },

    // Status toggle with confirmation
    toggleStatus(transporter) {
      const isActivating = !transporter.isActive;

      this.confirmDialog = {
        show: true,
        title: `${isActivating ? "Activate" : "Deactivate"} Transporter`,
        message: `Are you sure you want to ${
          isActivating ? "activate" : "deactivate"
        } ${transporter.name}?`,
        color: isActivating ? "success" : "warning",
        action: () => this.confirmToggleStatus(transporter),
      };
    },

    async confirmToggleStatus(transporter) {
      this.confirmDialog.show = false;

      try {
        await this.toggleTransporterStatus({
          id: transporter._id,
          isActive: !transporter.isActive,
        });
        // Success message will be handled by the store
      } catch (error) {
        console.error("Error toggling transporter status:", error);
        // Error message will be handled by the store
      }
    },

    // Delete transporter (if needed)
    removeTransporter(transporterId) {
      this.confirmDialog = {
        show: true,
        title: "Delete Transporter",
        message:
          "Are you sure you want to delete this transporter? This action cannot be undone.",
        color: "error",
        action: () => this.confirmDeleteTransporter(transporterId),
      };
    },

    async confirmDeleteTransporter(transporterId) {
      this.confirmDialog.show = false;

      try {
        await this.deleteTransporter(transporterId);
        await this.performSearch(); // Refresh the list
        // Success message will be handled by the store
      } catch (error) {
        console.error("Error deleting transporter:", error);
        // Error message will be handled by the store
      }
    },
  },

  async created() {
    // Initialize the search when component is created
    await this.performSearch();
  },

  // Watch for URL query parameters to maintain state
  watch: {
    "$route.query": {
      handler(newQuery) {
        if (newQuery.search) this.searchFilters.search = newQuery.search;
        if (newQuery.page) this.currentPage = parseInt(newQuery.page);
        if (newQuery.limit) this.itemsPerPage = parseInt(newQuery.limit);
      },
      immediate: true,
    },
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

.v-data-table >>> tbody tr {
  transition: background-color 0.2s;
}

.v-data-table >>> tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
