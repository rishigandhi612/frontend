<template>
    <v-container>
      <h1 class="text-center">Create Product</h1>
      
      <v-alert v-if="error" type="error" dismissible>
        {{ error }}
      </v-alert>
      
      <v-form ref="productForm" v-model="isFormValid">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              label="Product Name"
              v-model="product.name"
              :rules="[rules.required]"
              required
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              label="HSN Code"
              v-model="product.hsn_code"
              :rules="[rules.required]"
              required
            ></v-text-field>
          </v-col>
  
          <v-col cols="12" md="6">
            <v-text-field
              label="Quantity"
              v-model="product.quantity"
              :rules="[rules.required]"
              required
            ></v-text-field>
          </v-col>
  
          <v-col cols="12" md="6">
            <v-text-field
              label="Price"
              v-model="product.price"
              :rules="[rules.required]"
              required
            ></v-text-field>
          </v-col>
  
          <v-col cols="12">
            <v-textarea
              label="Description"
              v-model="product.desc"
              :rules="[rules.required]"
              required
            ></v-textarea>
          </v-col>
        </v-row>
  
        <v-btn
          :disabled="!isFormValid"
          color="primary"
          @click="createProduct"
        >
          Create Product
        </v-btn>
      </v-form>
    </v-container>
  </template>
  
  <script>
  import { mapActions } from 'vuex';
  
  export default {
    data() {
      return {
        isFormValid: false,
        product: {
          name: '',
          hsn_code: '',
          quantity: '',
          desc: '',
          price: ''
        },
        error: null,
        rules: {
          required: value => !!value || 'This field is required',
        }
      };
    },
    methods: {
      ...mapActions('products', ['createProductInStore']),
      
      async createProduct() {
        if (this.$refs.productForm.validate()) {
          try {
            await this.createProductInStore(this.product);
            this.$router.push('/product');  // Redirect to the product list page after successful creation
          } catch (err) {
            this.error = 'Error creating product. Please try again.';
          }
        }
      }
    }
  };
  </script>
  
  <style scoped>
  /* Add any styles specific to this component */
  </style>
  