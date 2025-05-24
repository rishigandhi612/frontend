<template>
  <v-container fluid>
    <v-row>
      <v-col md="2" cols="12">
        <v-btn @click="goBack" block>
          <v-icon left>mdi-arrow-left</v-icon> Back
        </v-btn>
      </v-col>
      <v-col md="8" cols="12">
        <v-row>
          <v-col>
            <h1 class="text-center">Inventory List</h1>
          </v-col>
        </v-row>
        
        <!-- Debug info -->
        <v-alert v-if="debugMode" type="info" dense>
          Items: {{ allInventory.length }}
          <pre>{{ JSON.stringify(allInventory[0], null, 2) }}</pre>
        </v-alert>
        
        <v-data-table
          :headers="headers"
          :items="allInventory"
          :options.sync="options"
          :loading="isLoading"
          :items-per-page="options.itemsPerPage"
          class="elevation-1"
          @update:options="handleTableOptions"
        >
          <template v-slot:item="{ item }">
            <tr @click="handleRowClick(item.id)">
              <td>{{ item.rollId }}</td>
              <td>{{ item.width }}</td>
              <td>{{ item.micron }}</td>
              <td>{{ item.netWeight}}</td>
              <td>{{ item.type }}</td>
              <td>{{ item.status }}</td>
              <td>{{ formatDate(item.updatedAt) }}</td>
            </tr>
          </template>
          
          <template v-slot:no-data>
            <v-alert type="info" dense>
              No inventory data available
            </v-alert>
          </template>
        </v-data-table>
      </v-col>
      <v-col md="2" cols="12">
        <v-row>
          <v-col cols="12" md="12">
            <v-btn @click="refreshInventory" color="primary" block>
              <v-icon>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
          <v-col cols="12" md="12">
            <v-btn
              @click="goToAddInventory"
              color="success" 
              block
            >
              <v-icon>mdi-plus</v-icon> Add Inventory
            </v-btn>
          </v-col>
          <v-col cols="12" md="12">
            <v-switch v-model="debugMode" label="Debug Mode"></v-switch>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "InventoryList",
  data() {
    return {
      debugMode: false,
      options: {
        page: 1,
        itemsPerPage: 10,
        sortBy: ["rollId"],
        sortDesc: [false]
      },
      headers: [
        { text: "Roll ID", value: "rollId", sortable: true },
        { text: "Width", value: "width", sortable: true },
        { text: "Micron", value: "micron", sortable: true },
        { text: "Net Weight", value: "netWeight", sortable: true },
        { text: "Type", value: "type", sortable: true },
        { text: "Status", value: "status", sortable: true },
        { text: "Last Updated", value: "updatedAt", sortable: true },
      ]
    };
  },
  computed: {
    ...mapGetters("inventory", ["allInventory", "isLoading", "getTotalCount"]),
    totalItems() {
      return this.getTotalCount || 0;
    }
  },
  created() {
    this.loadItems();
    console.log("Component created");
  },
  mounted() {
    console.log("Component mounted, inventory:", this.allInventory);
  },
  methods: {
    async loadItems() {
      console.log("Loading inventory items");
      try {
        // Create a query object based on current options
        const params = {
          page: this.options.page,
          limit: this.options.itemsPerPage,
          sortBy: this.options.sortBy[0] || 'rollId',
          sortOrder: this.options.sortDesc[0] ? 'desc' : 'asc'
        };
        
        console.log("Fetching with params:", params);
        
        // Dispatch action to fetch inventory with pagination/sorting
        await this.$store.dispatch("inventory/fetchInventory", params);
        
        console.log("Inventory fetched:", this.allInventory);
      } catch (error) {
        console.error("Error loading inventory items:", error);
      }
    },
    handleTableOptions(options) {
      console.log("Table options updated:", options);
      this.options = options;
      this.loadItems();
    },
    refreshInventory() {
      console.log("Refreshing inventory");
      // Reset pagination to first page when refreshing
      this.options.page = 1;
      this.loadItems();
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const options = { year: "numeric", month: "2-digit", day: "2-digit" };
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, options);
    },
    handleRowClick(inventoryId) {
      console.log("Row clicked:", inventoryId);
      this.$router.push({ name: "inventoryDetail", params: { id: inventoryId } });
    },
    goToAddInventory() {
      this.$router.push({ name: "addInventory" }); 
    },
    goBack() {
      this.$router.go(-1);
    }
  },
};
</script>

<style scoped>
tr {
  cursor: pointer;
}
tr:hover {
  background-color: #f5f5f5;
}
</style>