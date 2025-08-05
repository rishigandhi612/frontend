// Vuex store module for Send Purchase Order
import apiClient from './apiClient';

const state = {
  // PO Form Data
  formData: {
    email: '',
    supplierName: '',
    poNumber: '',
    totalAmount: '',
    orderDate: new Date().toISOString().substr(0, 10),
    expectedDeliveryDate: '',
    deliveryAddress: '',
    contactPerson: '',
    phoneNumber: '',
    paymentTerms: '',
    items: [
      {
        name: '',
        quantity: 1,
        price: 0,
        productId: null // Reference to product from invoice store
      }
    ]
  },
  
  // Loading states
  loadingState: {
    sendEmail: false,
    fetchProducts: false,
    fetchCustomers: false,
    fetchSuppliers: false
  },
  
  // Data from other stores/APIs
  availableProducts: [],
  availableCustomers: [],
  availableSuppliers: [],
  
  // Messages
  successMessage: '',
  errorMessage: '',
  
//   // Configuration
//   apiBaseUrl: 'http://localhost:3001'
};

const getters = {
  formData: (state) => state.formData,
  loadingState: (state) => state.loadingState,
  availableProducts: (state) => state.availableProducts,
  availableCustomers: (state) => state.availableCustomers,
  availableSuppliers: (state) => state.availableCustomers,
  successMessage: (state) => state.successMessage,
  errorMessage: (state) => state.errorMessage,
  
  // Computed values
  calculatedTotal: (state) => {
    return state.formData.items.reduce((sum, item) => {
      return sum + ((item.quantity || 0) * (item.price || 0));
    }, 0);
  },
  
  canSend: (state) => {
    return state.formData.email && 
           state.formData.supplierName && 
           state.formData.poNumber && 
           state.formData.items.length > 0 &&
           state.formData.items.some(item => item.name && item.quantity > 0 && item.price > 0);
  },
  
  // Get products formatted for dropdown
  productOptions: (state) => {
    return state.availableProducts.map(product => ({
      text: product.name || product.productName,
      value: product._id,
      price: product.price || product.sellingPrice || 0,
      details: product
    }));
  },
  
  // Get customers formatted for dropdown
  customerOptions: (state) => {
    return state.availableCustomers.map(customer => ({
      text: customer.name || customer.customerName,
      value: customer._id,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      details: customer
    }));
  }
};

const actions = {
  // Initialize store and fetch necessary data
  async initializeStore({ dispatch }) {
    try {
      await Promise.all([
        dispatch('fetchProductsFromInvoice'),
        dispatch('fetchCustomersFromInvoice')
      ]);
    } catch (error) {
      console.error('Error initializing SendPO store:', error);
    }
  },
  
  // Fetch products from invoice store or API
  async fetchProductsFromInvoice({ commit, rootGetters }) {
    commit('SET_LOADING_STATE', { type: 'fetchProducts', value: true });
    try {
      // Try to get products from invoice store first
      const invoicesData = rootGetters['invoices/allInvoices'] || [];
      let products = [];
      
      // Extract unique products from invoices
      const productMap = new Map();
      invoicesData.forEach(invoice => {
        if (invoice.products && Array.isArray(invoice.products)) {
          invoice.products.forEach(product => {
            if (product._id && !productMap.has(product._id)) {
              productMap.set(product._id, {
                _id: product._id,
                name: product.name || product.productName,
                price: product.price || product.sellingPrice || 0,
                description: product.description,
                category: product.category,
                ...product
              });
            }
          });
        }
      });
      
      products = Array.from(productMap.values());
      
      // If no products from invoices, try to fetch from API
      if (products.length === 0) {
        try {
          const response = await apiClient.get('/product');
          if (response.data.success) {
            products = response.data.data || [];
          }
        } catch (apiError) {
          console.warn('Could not fetch products from API:', apiError);
        }
      }
      
      commit('SET_AVAILABLE_PRODUCTS', products);
    } catch (error) {
      console.error('Error fetching products:', error);
      commit('SET_ERROR_MESSAGE', 'Failed to load products');
    } finally {
      commit('SET_LOADING_STATE', { type: 'fetchProducts', value: false });
    }
  },
  
  // Fetch customers from invoice store or API
  async fetchCustomersFromInvoice({ commit, rootGetters }) {
    commit('SET_LOADING_STATE', { type: 'fetchCustomers', value: true });
    try {
      // Try to get customers from invoice store first
      const invoicesData = rootGetters['invoices/allInvoices'] || [];
      let customers = [];
      
      // Extract unique customers from invoices
      const customerMap = new Map();
      invoicesData.forEach(invoice => {
        if (invoice.customer && invoice.customer._id) {
          if (!customerMap.has(invoice.customer._id)) {
            customerMap.set(invoice.customer._id, {
              _id: invoice.customer._id,
              name: invoice.customer.name || invoice.customer.customerName,
              email: invoice.customer.email,
              phone: invoice.customer.phone,
              address: invoice.customer.address,
              ...invoice.customer
            });
          }
        }
      });
      
      customers = Array.from(customerMap.values());
      
      // If no customers from invoices, try to fetch from API
      if (customers.length === 0) {
        try {
          const response = await apiClient.get('/customer');
          if (response.data.success) {
            customers = response.data.data || [];
          }
        } catch (apiError) {
          console.warn('Could not fetch customers from API:', apiError);
        }
      }
      
      commit('SET_AVAILABLE_CUSTOMERS', customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      commit('SET_ERROR_MESSAGE', 'Failed to load customers');
    } finally {
      commit('SET_LOADING_STATE', { type: 'fetchCustomers', value: false });
    }
  },
  
  // Form actions
  updateFormData({ commit }, { field, value }) {
    commit('UPDATE_FORM_DATA', { field, value });
  },
  
  addItem({ commit }) {
    const newItem = {
      name: '',
      quantity: 1,
      price: 0,
      productId: null
    };
    commit('ADD_ITEM', newItem);
  },
  
  removeItem({ commit }, index) {
    commit('REMOVE_ITEM', index);
  },
  
  updateItem({ commit }, { index, field, value }) {
    commit('UPDATE_ITEM', { index, field, value });
  },
  
  // Select product for an item
  selectProduct({ commit }, { itemIndex, product }) {
    commit('UPDATE_ITEM', { 
      index: itemIndex, 
      field: 'name', 
      value: product.name || product.productName 
    });
    commit('UPDATE_ITEM', { 
      index: itemIndex, 
      field: 'price', 
      value: product.price || product.sellingPrice || 0 
    });
    commit('UPDATE_ITEM', { 
      index: itemIndex, 
      field: 'productId', 
      value: product._id 
    });
  },
  
  // Load sample data
  loadSampleData({ commit }) {
    const sampleData = {
      email: 'rishigandhi021@gmail.com',
      supplierName: 'Steel Corporation Ltd',
      poNumber: 'PO-HT-2025-007',
      totalAmount: '45000.00',
      orderDate: '2024-08-04',
      expectedDeliveryDate: '2024-08-15',
      deliveryAddress: 'Hemant Traders Warehouse, Plot 45, Industrial Area, Pune - 411019',
      contactPerson: 'Rishi Sharma',
      phoneNumber: '+91-9876543210',
      paymentTerms: 'Net 30 days from delivery date',
      items: [
        {
          name: 'Steel Rods 12mm x 12ft',
          quantity: 100,
          price: 250.00,
          productId: null
        },
        {
          name: 'Steel Plates 6mm',
          quantity: 20,
          price: 1000.00,
          productId: null
        },
        {
          name: 'Angle Iron 40x40mm',
          quantity: 50,
          price: 300.00,
          productId: null
        }
      ]
    };
    commit('SET_FORM_DATA', sampleData);
  },
  
  // Reset form
  resetForm({ commit }) {
    const initialFormData = {
      email: '',
      supplierName: '',
      poNumber: '',
      totalAmount: '',
      orderDate: new Date().toISOString().substr(0, 10),
      expectedDeliveryDate: '',
      deliveryAddress: '',
      contactPerson: '',
      phoneNumber: '',
      paymentTerms: '',
      items: [
        {
          name: '',
          quantity: 1,
          price: 0,
          productId: null
        }
      ]
    };
    commit('SET_FORM_DATA', initialFormData);
    commit('CLEAR_MESSAGES');
  },
  
  // Send email
  async sendPurchaseOrder({ commit, state, getters }) {
    commit('SET_LOADING_STATE', { type: 'sendEmail', value: true });
    commit('CLEAR_MESSAGES');
    
    try {
      // Prepare payload
      const payload = {
        ...state.formData,
        totalAmount: getters.calculatedTotal.toFixed(2)
      };
      
      // Remove undefined fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });
      
      // Validate required fields
      if (!payload.email || !payload.supplierName || !payload.poNumber || 
          !payload.items || payload.items.length === 0) {
        throw new Error('Please fill in all required fields: email, supplier name, PO number, and items.');
      }
      
      console.log('Sending PO payload:', payload);
      
      const response = await apiClient.post('/email/email', payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      commit('SET_SUCCESS_MESSAGE', response.data.message || 'Purchase order sent successfully!');
      
    } catch (error) {
      console.error('Error sending purchase order:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to send purchase order. Please try again.';
      commit('SET_ERROR_MESSAGE', errorMessage);
      throw error;
    } finally {
      commit('SET_LOADING_STATE', { type: 'sendEmail', value: false });
    }
  },
  
  // Message actions
  clearMessages({ commit }) {
    commit('CLEAR_MESSAGES');
  },
  
  setSuccessMessage({ commit }, message) {
    commit('SET_SUCCESS_MESSAGE', message);
  },
  
  setErrorMessage({ commit }, message) {
    commit('SET_ERROR_MESSAGE', message);
  }
};

const mutations = {
  SET_FORM_DATA(state, formData) {
    state.formData = { ...state.formData, ...formData };
  },
  
  UPDATE_FORM_DATA(state, { field, value }) {
    state.formData[field] = value;
  },
  
  ADD_ITEM(state, item) {
    state.formData.items.push(item);
  },
  
  REMOVE_ITEM(state, index) {
    if (state.formData.items.length > 1) {
      state.formData.items.splice(index, 1);
    }
  },
  
  UPDATE_ITEM(state, { index, field, value }) {
    if (state.formData.items[index]) {
      state.formData.items[index][field] = value;
    }
  },
  
  SET_AVAILABLE_PRODUCTS(state, products) {
    state.availableProducts = products;
  },
  
  SET_AVAILABLE_CUSTOMERS(state, customers) {
    state.availableCustomers = customers;
  },
  
  SET_AVAILABLE_SUPPLIERS(state, suppliers) {
    state.availableCustomers = suppliers;
  },
  
  SET_LOADING_STATE(state, { type, value }) {
    state.loadingState[type] = value;
  },
  
  SET_SUCCESS_MESSAGE(state, message) {
    state.successMessage = message;
    state.errorMessage = '';
  },
  
  SET_ERROR_MESSAGE(state, message) {
    state.errorMessage = message;
    state.successMessage = '';
  },
  
  CLEAR_MESSAGES(state) {
    state.successMessage = '';
    state.errorMessage = '';
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};