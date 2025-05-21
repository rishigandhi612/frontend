<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="2">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col cols="12" md="8">
        <v-card v-if="inventoryItem" class="pa-4">
          <v-card-title class="text-h4 justify-center">
            {{ capitalizeFirstLetter(inventoryItem.product_name) }} Details
          </v-card-title>
          
          <v-divider class="my-4"></v-divider>
          
          <v-row v-if="loading">
            <v-col cols="12" class="text-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </v-col>
          </v-row>
          
          <template v-else>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Product Name</v-list-item-subtitle>
                      <v-list-item-title class="font-weight-bold">
                        {{ capitalizeFirstLetter(inventoryItem.product_name) }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Quantity</v-list-item-subtitle>
                      <v-list-item-title class="font-weight-bold">
                        {{ inventoryItem.quantity }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Location</v-list-item-subtitle>
                      <v-list-item-title class="font-weight-bold">
                        {{ inventoryItem.location || 'N/A' }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Status</v-list-item-subtitle>
                      <v-list-item-title class="font-weight-bold">
                        {{ inventoryItem.status }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Product ID</v-list-item-subtitle>
                      <v-list-item-title class="font-weight-bold">
                        {{ inventoryItem.product_id || 'N/A' }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-subtitle>Last Updated</v-list-item-subtitle>
                      <v-list-item-title class="font-weight-bold">
                        {{ formatDate(inventoryItem.updatedAt) }}
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-col>
                
                <!-- Add more fields as needed -->
              </v-row>
            </v-card-text>
            
            <v-divider class="my-4"></v-divider>
            
            <v-card-actions class="justify-center">
              <v-btn color="primary" @click="editInventory">
                <v-icon left>mdi-pencil</v-icon> Edit
              </v-btn>
              <v-btn color="error" class="ml-4" @click="confirmDelete = true">
                <v-icon left>mdi-delete</v-icon> Delete
              </v-btn>
            </v-card-actions>
          </template>
        </v-card>
        
        <v-alert v-if="error" type="error" class="mt-4">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="confirmDelete" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this inventory item? 
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="confirmDelete = false">Cancel</v-btn>
          <v-btn color="red darken-1" text @click="deleteInventoryItem">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "InventoryDetail",
  data() {
    return {
      loading: false,
      error: null,
      confirmDelete: false,
      inventoryItem: null
    };
  },
  computed: {
    ...mapGetters("inventory", ["inventoryDetail"]),
    inventoryId() {
      return this.$route.params.id;
    }
  },
  async created() {
    await this.loadInventoryDetail();
  },
  methods: {
    async loadInventoryDetail() {
      this.loading = true;
      this.error = null;
      
      try {
        await this.$store.dispatch("inventory/fetchInventoryDetail", this.inventoryId);
        this.inventoryItem = this.inventoryDetail;
        
        if (!this.inventoryItem) {
          this.error = "Inventory item not found";
        }
      } catch (error) {
        console.error("Error loading inventory detail:", error);
        this.error = "Failed to load inventory details. Please try again.";
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateString) {
      const options = { 
        year: "numeric", 
        month: "long", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      };
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, options);
    },
    
    capitalizeFirstLetter(string) {
      if (!string) return "";
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    editInventory() {
      this.$router.push({ 
        name: "editInventory", 
        params: { id: this.inventoryId }
      });
    },
    
    async deleteInventoryItem() {
      this.loading = true;
      try {
        await this.$store.dispatch("inventory/deleteInventory", this.inventoryId);
        this.$router.push({ name: "inventoryList" });
      } catch (error) {
        console.error("Error deleting inventory item:", error);
        this.error = "Failed to delete inventory item";
      } finally {
        this.loading = false;
        this.confirmDelete = false;
      }
    },
    
    goBack() {
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>