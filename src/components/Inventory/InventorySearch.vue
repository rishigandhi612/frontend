<template>
  <div v-if="isVisible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <!-- Dialog Header -->
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button
          @click="closeDialog"
          class="close-button"
          aria-label="Close dialog"
        >
          <span>&times;</span>
        </button>
      </div>

      <!-- Dialog Content -->
      <div class="dialog-content">
        <div class="inventory-search-container">
          <!-- Advanced Search Form -->
          <div class="search-form">
            <div class="search-row">
              <!-- General Search -->
              <div class="search-field">
                <label>General Search:</label>
                <input
                  v-model="searchParams.search"
                  @input="debouncedSearch"
                  placeholder="Search rollId, productId, status, or numeric values..."
                  class="search-input"
                />
                <small class="search-hint">
                  Try: "M1234", "available", "100-200", ">50",
                </small>
              </div>

              <!-- Quick Filters -->
              <div class="search-field">
                <label>Status:</label>
                <select
                  v-model="searchParams.status"
                  @change="handleFilterChange"
                >
                  <option value="">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="damaged">Damaged</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <div class="search-field">
                <label>Type:</label>
                <select
                  v-model="searchParams.type"
                  @change="handleFilterChange"
                >
                  <option value="">All Types</option>
                  <option value="film">Film</option>
                  <option value="non-film">Non-Film</option>
                </select>
              </div>
            </div>

            <div class="search-row">
              <!-- Specific Field Searches -->
              <div class="search-field">
                <label>Roll ID:</label>
                <input
                  v-model="searchParams.rollId"
                  @input="debouncedSearch"
                  placeholder="e.g., M1234"
                />
              </div>

              <div class="search-field">
                <label>Product ID:</label>
                <input
                  v-model="searchParams.productId"
                  @input="debouncedSearch"
                  placeholder="Product ID"
                />
              </div>
            </div>

            <div class="search-row">
              <!-- Range Filters -->
              <div class="search-field">
                <label>Weight Range:</label>
                <div class="range-inputs">
                  <input
                    v-model="searchParams.minWeight"
                    @input="debouncedSearch"
                    type="number"
                    placeholder="Min"
                    step="0.01"
                  />
                  <span>to</span>
                  <input
                    v-model="searchParams.maxWeight"
                    @input="debouncedSearch"
                    type="number"
                    placeholder="Max"
                    step="0.01"
                  />
                </div>
              </div>

              <div class="search-field">
                <label>Width Range:</label>
                <div class="range-inputs">
                  <input
                    v-model="searchParams.minWidth"
                    @input="debouncedSearch"
                    type="number"
                    placeholder="Min"
                    step="0.01"
                  />
                  <span>to</span>
                  <input
                    v-model="searchParams.maxWidth"
                    @input="debouncedSearch"
                    type="number"
                    placeholder="Max"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="search-actions">
              <button
                @click="handleSearch"
                :disabled="isLoading"
                class="search-btn"
              >
                {{ isLoading ? "Searching..." : "Search" }}
              </button>
              <button @click="clearAllFilters" class="clear-btn">
                Clear All
              </button>
            </div>
          </div>

          <!-- Search Results Info -->
          <div class="search-info" v-if="displayedItems.length > 0 || searchExecuted">
            <p>
              Found {{ displayedItems.length }} items
              <span v-if="searchParams.search"
                >(searching for "{{ searchParams.search }}")</span
              >
            </p>
          </div>

          <!-- Error Display -->
          <div v-if="getError" class="error-message">
            {{ getError }}
          </div>

          <!-- Results Table (Compact view for dialog) -->
          <div class="results-table" v-if="showResults && (displayedItems.length > 0 || searchExecuted)">
            <div class="table-container">
              <table class="inventory-table" v-if="displayedItems.length > 0">
                <thead>
                  <tr>
                    <th @click="handleSort('rollId')">Roll ID</th>
                    <th @click="handleSort('productId')">Product ID</th>
                    <th @click="handleSort('status')">Status</th>
                    <th @click="handleSort('weight')">Weight</th>
                    <th @click="handleSort('width')">Width</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in paginatedItems"
                    :key="item.id"
                    class="table-row"
                  >
                    <td>{{ item.rollId }}</td>
                    <td>{{ item.productId }}</td>
                    <td>
                      <span :class="'status-badge status-' + item.status">
                        {{ item.status }}
                      </span>
                    </td>
                    <td>{{ item.netWeight || item.weight }}</td>
                    <td>{{ item.width }}</td>
                    <td>
                      <button @click="selectItem(item)" class="select-btn">
                        Select
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!-- No Results Message -->
              <div v-else-if="searchExecuted" class="no-results">
                <p>No items found matching your search criteria.</p>
                <button @click="clearAllFilters" class="clear-btn">
                  Clear Filters
                </button>
              </div>
            </div>

            <!-- Pagination (simplified for dialog) -->
            <div class="dialog-pagination" v-if="totalPages > 1">
              <button
                @click="handlePageChange(currentPage - 1)"
                :disabled="currentPage <= 1"
                class="pagination-btn"
              >
                Previous
              </button>
              <span class="page-info">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button
                @click="handlePageChange(currentPage + 1)"
                :disabled="currentPage >= totalPages"
                class="pagination-btn"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dialog Footer -->
      <div class="dialog-footer">
        <button @click="closeDialog" class="cancel-btn">
          {{ cancelText }}
        </button>
        <button
          v-if="confirmText"
          @click="confirmAction"
          :disabled="isLoading"
          class="confirm-btn"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { debounce } from "lodash";

export default {
  name: "InventorySearchDialog",

  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "Search Inventory",
    },
    confirmText: {
      type: String,
      default: "",
    },
    cancelText: {
      type: String,
      default: "Close",
    },
    showResults: {
      type: Boolean,
      default: true,
    },
    closeOnOverlay: {
      type: Boolean,
      default: true,
    },
    maxHeight: {
      type: String,
      default: "80vh",
    },
  },

  data() {
    return {
      searchParams: {
        search: "",
        status: "",
        type: "",
        rollId: "",
        productId: "",
        minWeight: "",
        maxWeight: "",
        minWidth: "",
        maxWidth: "",
        page: 1,
        limit: 50, // Increased for dialog
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      searchResults: [],
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      searchExecuted: false,
    };
  },

  computed: {
    ...mapGetters("inventory", [
      "allInventory",
      "isLoading",
      "getTotalCount",
      "getError",
    ]),

    // Use search results if available, otherwise fall back to store inventory
    displayedItems() {
      return this.searchResults.length > 0 ? this.searchResults : this.allInventory;
    },

    // Paginate the displayed items for the dialog
    paginatedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.displayedItems.slice(start, end);
    },

    // Calculate total pages based on displayed items
    calculatedTotalPages() {
      return Math.ceil(this.displayedItems.length / this.itemsPerPage);
    },
  },

  methods: {
    ...mapActions("inventory", [
      "fetchInventory",
      "searchInventory",
      "filterInventory",
      "clearFilters",
    ]),

    // Debounced search for real-time search as user types
    debouncedSearch: debounce(function () {
      this.handleSearch();
    }, 500),

    async handleSearch() {
      try {
        this.searchExecuted = true;
        this.currentPage = 1;
        
        // Clean up search params - remove empty values
        const cleanParams = {};
        Object.keys(this.searchParams).forEach(key => {
          const value = this.searchParams[key];
          if (value !== "" && value !== null && value !== undefined) {
            cleanParams[key] = value;
          }
        });

        // If no search parameters, get all inventory
        if (Object.keys(cleanParams).length <= 3) { // Only page, limit, sortBy left
          // const result = await this.fetchInventory({ 
          //   limit: 100 // Get more items for search dialog
          // });
          this.searchResults = this.allInventory;
        } else {
          // Perform search
          const result = await this.searchInventory(cleanParams);
          
          // Store the search results locally
          if (result && result.data) {
            this.searchResults = result.data;
          } else if (result && Array.isArray(result)) {
            this.searchResults = result;
          } else {
            // If search doesn't return expected format, use store data
            this.searchResults = this.allInventory;
          }
        }

        // Update pagination
        this.totalPages = this.calculatedTotalPages;

      } catch (error) {
        console.error("Search failed:", error);
        this.searchResults = [];
      }
    },

    async handleFilterChange() {
      await this.handleSearch();
    },

    async handleSort(field) {
      const newOrder =
        this.searchParams.sortBy === field &&
        this.searchParams.sortOrder === "asc"
          ? "desc"
          : "asc";
      this.searchParams.sortBy = field;
      this.searchParams.sortOrder = newOrder;
      
      // Sort the current results
      this.sortResults(field, newOrder);
    },

    sortResults(field, order) {
      if (this.searchResults.length === 0) return;
      
      this.searchResults.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle different data types
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (order === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    },

    handlePageChange(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
    },

    async clearAllFilters() {
      this.searchParams = {
        search: "",
        status: "",
        type: "",
        rollId: "",
        productId: "",
        minWeight: "",
        maxWeight: "",
        minWidth: "",
        maxWidth: "",
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      this.currentPage = 1;
      this.searchExecuted = false;
      this.searchResults = [];
      
      // Reset to show all inventory
      await this.fetchInventory({ limit: 100 });
    },

    selectItem(item) {
      this.$emit("item-selected", item);
      this.closeDialog();
    },

    closeDialog() {
      this.$emit("close");
    },

    confirmAction() {
      this.$emit("confirm", {
        searchParams: this.searchParams,
        searchResults: this.searchResults,
      });
    },

    handleOverlayClick() {
      if (this.closeOnOverlay) {
        this.closeDialog();
      }
    },
  },

  watch: {
    isVisible(newVal) {
      if (newVal) {
        // Auto-focus first input when dialog opens
        this.$nextTick(() => {
          const firstInput = this.$el.querySelector("input");
          if (firstInput) firstInput.focus();
        });

        // Load initial data if needed
        if (this.searchResults.length === 0 && !this.searchExecuted) {
          this.handleSearch();
        }
      }
    },
  },
};
</script>

<style scoped>
/* Dialog Overlay and Container */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 90vw;
  max-height: 90vh;
  width: 1000px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Dialog Header */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Dialog Content */
.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.inventory-search-container {
  padding: 20px;
}

/* Search Form Styles */
.search-form {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.search-field {
  flex: 1;
  min-width: 200px;
}

.search-field label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 14px;
}

.search-input,
.search-field input,
.search-field select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-hint {
  color: #666;
  font-size: 12px;
  margin-top: 2px;
  display: block;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-inputs input {
  flex: 1;
}

.search-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.search-btn,
.clear-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.search-btn {
  background: #007bff;
  color: white;
}

.search-btn:hover:not(:disabled) {
  background: #0056b3;
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-btn {
  background: #6c757d;
  color: white;
}

.clear-btn:hover {
  background: #545b62;
}

/* Results Styles */
.search-info {
  margin-bottom: 15px;
  font-weight: bold;
  color: #333;
}

.error-message {
  color: #dc3545;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  font-size: 14px;
}

.table-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.inventory-table th {
  background: #f8f9fa;
  padding: 12px 8px;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  cursor: pointer;
  position: sticky;
  top: 0;
  z-index: 10;
}

.inventory-table th:hover {
  background: #e9ecef;
}

.inventory-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #dee2e6;
}

.table-row:hover {
  background: #f8f9fa;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-available {
  background: #d4edda;
  color: #155724;
}

.status-reserved {
  background: #fff3cd;
  color: #856404;
}

.status-damaged {
  background: #f8d7da;
  color: #721c24;
}

.select-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.select-btn:hover {
  background: #1e7e34;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.no-results p {
  margin-bottom: 15px;
  font-size: 16px;
}

/* Dialog Pagination */
.dialog-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
  padding: 15px;
  border-top: 1px solid #eee;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #545b62;
}

.confirm-btn {
  background: #007bff;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #0056b3;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dialog-container {
    width: 95vw;
    max-height: 95vh;
  }

  .search-row {
    flex-direction: column;
  }

  .search-field {
    min-width: unset;
  }

  .range-inputs {
    flex-direction: column;
    align-items: stretch;
  }

  .search-actions {
    flex-direction: column;
  }
}
</style>