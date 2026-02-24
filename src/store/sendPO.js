// Vuex store module for Send Purchase Order
import apiClient from "./apiClient";

const state = {
  // PO Form Data
  formData: {
    email: "",
    supplierName: "",
    orderDate: new Date().toISOString().substr(0, 10),
    expectedDeliveryDate: "",
    deliveryType: "NORMAL_DELIVERY", // 'NORMAL_DELIVERY' or 'THIRD_PARTY_DELIVERY'
    thirdPartyCustomerId: "", // Only used when deliveryType is 'THIRD_PARTY_DELIVERY'
    // Add these new fields
    packSize: "",
    nos: 0,
    totalQty: 0,
    remarks: "", // New remarks field
    items: [
      {
        name: "",
        description: "",
        packSize: "",
        nos: 1,
        totalQty: 1,
        productId: null,
      },
    ],
  },

  // Loading states
  loadingState: {
    sendEmail: false,
    fetchProducts: false,
    fetchCustomers: false,
    fetchSuppliers: false,
  },

  // Data from other stores/APIs
  availableProducts: [],
  availableCustomers: [],
  availableSuppliers: [],

  // Messages
  successMessage: "",
  errorMessage: "",

  // Delivery options
  deliveryOptions: [
    { text: "Normal Delivery", value: "NORMAL_DELIVERY" },
    { text: "Third Party Delivery", value: "THIRD_PARTY_DELIVERY" },
  ],
};

const getters = {
  formData: (state) => state.formData,
  loadingState: (state) => state.loadingState,
  availableProducts: (state) => state.availableProducts,
  availableCustomers: (state) => state.availableCustomers,
  availableSuppliers: (state) => state.availableSuppliers,
  deliveryOptions: (state) => state.deliveryOptions,
  successMessage: (state) => state.successMessage,
  errorMessage: (state) => state.errorMessage,

  // Check if form can be sent
  canSend: (state) => {
    const hasBasicInfo =
      state.formData.email &&
      state.formData.supplierName &&
      state.formData.items.length > 0 &&
      state.formData.items.some(
        (item) =>
          item.name && item.packSize && item.nos > 0 && item.totalQty > 0,
      );

    // If third party delivery, also check if customer is selected
    if (state.formData.deliveryType === "THIRD_PARTY_DELIVERY") {
      return hasBasicInfo && state.formData.thirdPartyCustomerId;
    }

    return hasBasicInfo;
  },

  // Get products formatted for dropdown
  productOptions: (state) => {
    return state.availableProducts.map((product) => ({
      text: product.name || product.productName,
      value: product._id,
      details: product,
    }));
  },

  // Get customers formatted for dropdown (suppliers)
  customerOptions: (state) => {
    return state.availableCustomers.map((customer) => ({
      text: customer.name,
      value: customer.name,
      email: customer.email_id,
      phone: customer.phone_no,
      address: customer.address,
      details: customer,
    }));
  },

  // Get customers for third party delivery
  thirdPartyCustomerOptions: (state) => {
    return state.availableCustomers.map((customer) => ({
      text: customer.name,
      value: customer._id,
      email: customer.email_id,
      phone: customer.phone_no,
      address: customer.address,
      details: customer,
    }));
  },
};

const actions = {
  // Initialize store and fetch necessary data
  async initializeStore({ dispatch }) {
    try {
      await Promise.all([
        dispatch("fetchProductsFromInvoice"),
        dispatch("fetchCustomersFromAPI"),
      ]);
    } catch (error) {
      console.error("Error initializing SendPO store:", error);
    }
  },

  // Fetch products from invoice store or API
  async fetchProductsFromInvoice({ commit, rootGetters }) {
    commit("SET_LOADING_STATE", { type: "fetchProducts", value: true });
    try {
      // Try to get products from invoice store first
      const invoicesData = rootGetters["invoices/allInvoices"] || [];
      let products = [];

      // Extract unique products from invoices
      const productMap = new Map();
      invoicesData.forEach((invoice) => {
        if (invoice.products && Array.isArray(invoice.products)) {
          invoice.products.forEach((product) => {
            if (product._id && !productMap.has(product._id)) {
              productMap.set(product._id, {
                _id: product._id,
                name: product.name || product.productName,
                description: product.description,
                category: product.category,
                ...product,
              });
            }
          });
        }
      });

      products = Array.from(productMap.values());

      // If no products from invoices, try to fetch from API
      if (products.length === 0) {
        try {
          const response = await apiClient.get("/product");
          if (response.data.success) {
            products = response.data.data || [];
          }
        } catch (apiError) {
          console.warn("Could not fetch products from API:", apiError);
        }
      }

      commit("SET_AVAILABLE_PRODUCTS", products);
    } catch (error) {
      console.error("Error fetching products:", error);
      commit("SET_ERROR_MESSAGE", "Failed to load products");
    } finally {
      commit("SET_LOADING_STATE", { type: "fetchProducts", value: false });
    }
  },

  // Fetch customers directly from API
  async fetchCustomersFromAPI({ commit }) {
    commit("SET_LOADING_STATE", { type: "fetchCustomers", value: true });
    try {
      const response = await apiClient.get("/customer");
      if (response.data.success) {
        const customers = response.data.data || [];
        commit("SET_AVAILABLE_CUSTOMERS", customers);
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (error) {
      console.error("Error fetching customers from API:", error);
      commit("SET_ERROR_MESSAGE", "Failed to load customers");

      // Fallback: try to get customers from invoice store
      try {
        const invoicesData = this.rootGetters["invoices/allInvoices"] || [];
        const customerMap = new Map();

        invoicesData.forEach((invoice) => {
          if (invoice.customer && invoice.customer._id) {
            if (!customerMap.has(invoice.customer._id)) {
              customerMap.set(invoice.customer._id, {
                _id: invoice.customer._id,
                name: invoice.customer.name || invoice.customer.customerName,
                email_id: invoice.customer.email,
                phone_no: invoice.customer.phone,
                address: invoice.customer.address,
                ...invoice.customer,
              });
            }
          }
        });

        const customers = Array.from(customerMap.values());
        commit("SET_AVAILABLE_CUSTOMERS", customers);
      } catch (fallbackError) {
        console.error("Fallback customer fetch also failed:", fallbackError);
      }
    } finally {
      commit("SET_LOADING_STATE", { type: "fetchCustomers", value: false });
    }
  },

  // Form actions
  updateFormData({ commit }, { field, value }) {
    commit("UPDATE_FORM_DATA", { field, value });
  },

  addItem({ commit }) {
    const newItem = {
      name: "",
      description: "",
      packSize: "",
      nos: 1,
      totalQty: 1,
      productId: null,
    };
    commit("ADD_ITEM", newItem);
  },

  removeItem({ commit }, index) {
    commit("REMOVE_ITEM", index);
  },

  updateItem({ commit }, { index, field, value }) {
    commit("UPDATE_ITEM", { index, field, value });
  },

  // Select product for an item
  selectProduct({ commit }, { itemIndex, product }) {
    commit("UPDATE_ITEM_BATCH", {
      index: itemIndex,
      updates: {
        name: product.name || product.productName,
        productId: product._id,
      },
    });
  },

  // Reset form
  resetForm({ commit }) {
    const initialFormData = {
      email: "",
      supplierName: "",
      orderDate: new Date().toISOString().substr(0, 10),
      expectedDeliveryDate: "",
      deliveryType: "NORMAL_DELIVERY",
      thirdPartyCustomerId: "",
      remarks: "",
      items: [
        {
          name: "",
          description: "",
          packSize: "",
          nos: 1,
          totalQty: 1,
          productId: null,
        },
      ],
    };
    commit("SET_FORM_DATA", initialFormData);
    commit("CLEAR_MESSAGES");
  },

  // Send email
  async sendPurchaseOrder({ commit, state }) {
    commit("SET_LOADING_STATE", { type: "sendEmail", value: true });
    commit("CLEAR_MESSAGES");

    try {
      // Prepare payload to match backend expectations
      const payload = {
        email: state.formData.email,
        supplierName: state.formData.supplierName,
        items: state.formData.items,
        orderDate: state.formData.orderDate,
        deliveryType: state.formData.deliveryType,
        expectedDeliveryDate: state.formData.expectedDeliveryDate,
        remarks: state.formData.remarks,
      };

      // Add thirdPartyCustomer object if third party delivery
      if (
        payload.deliveryType === "THIRD_PARTY_DELIVERY" &&
        state.formData.thirdPartyCustomerId
      ) {
        const customer = state.availableCustomers.find(
          (c) => c._id === state.formData.thirdPartyCustomerId,
        );
        if (customer) {
          payload.thirdPartyCustomer = customer;
        }
      }

      console.log("Sending PO payload:", payload);

      const response = await apiClient.post("/email/email", payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      commit(
        "SET_SUCCESS_MESSAGE",
        response.data.message || "Purchase order sent successfully!",
      );
    } catch (error) {
      console.error("Error sending purchase order:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to send purchase order. Please try again.";
      commit("SET_ERROR_MESSAGE", errorMessage);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "sendEmail", value: false });
    }
  },

  // Message actions
  clearMessages({ commit }) {
    commit("CLEAR_MESSAGES");
  },

  setSuccessMessage({ commit }, message) {
    commit("SET_SUCCESS_MESSAGE", message);
  },

  setErrorMessage({ commit }, message) {
    commit("SET_ERROR_MESSAGE", message);
  },
};

const mutations = {
  SET_FORM_DATA(state, formData) {
    state.formData = { ...state.formData, ...formData };
  },

  UPDATE_FORM_DATA(state, { field, value }) {
    state.formData[field] = value;

    // Reset third party customer when switching to normal delivery
    if (field === "deliveryType" && value === "NORMAL_DELIVERY") {
      state.formData.thirdPartyCustomerId = "";
    }
  },

  ADD_ITEM(state, item) {
    state.formData.items.push(item);
  },

  REMOVE_ITEM(state, index) {
    if (state.formData.items.length > 1) {
      state.formData.items.splice(index, 1);
    }
  },

  UPDATE_ITEM_BATCH(state, { index, updates }) {
    if (state.formData.items[index]) {
      // Force reactivity with new object reference
      state.formData.items = state.formData.items.map((item, idx) =>
        idx === index ? { ...item, ...updates } : item,
      );
    }
  },

  UPDATE_ITEM(state, { index, field, value }) {
    if (state.formData.items[index]) {
      // Use same pattern for consistency
      state.formData.items = state.formData.items.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      );
    }
  },

  SET_AVAILABLE_PRODUCTS(state, products) {
    state.availableProducts = products;
  },

  SET_AVAILABLE_CUSTOMERS(state, customers) {
    state.availableCustomers = customers;
  },

  SET_AVAILABLE_SUPPLIERS(state, suppliers) {
    state.availableSuppliers = suppliers;
  },

  SET_LOADING_STATE(state, { type, value }) {
    state.loadingState[type] = value;
  },

  SET_SUCCESS_MESSAGE(state, message) {
    state.successMessage = message;
    state.errorMessage = "";
  },

  SET_ERROR_MESSAGE(state, message) {
    state.errorMessage = message;
    state.successMessage = "";
  },

  CLEAR_MESSAGES(state) {
    state.successMessage = "";
    state.errorMessage = "";
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
