import Vue from 'vue';
import Router from 'vue-router';// Make sure the path is correct
import Login from '../components/LoginUser.vue';
import UserDashboard from '../components/UserDashboard.vue';
import CustomerList from '../components/CustomerList.vue'
import CustomerDetail from '@/components/CustomerDetail.vue';
import ProductList from '@/components/ProductList.vue';
import ProductDetail from '@/components/ProductDetail.vue';
import AddProduct from '@/components/AddProduct.vue';
import InvoiceList from '@/components/InvoiceList.vue';

Vue.use(Router);

const router = new Router({
  mode: 'history', // use history mode to avoid hash in URLs
  routes: [
    {
      path: '/',
      component: Login
    },
    {
      path: '/dashboard',
      component: UserDashboard,
      name: 'UserDashboard',
      meta: { requiresAuth: true } // Protect the route
    },
    { 
      path: '/customer', 
      component: CustomerList, 
      name: 'customerList', 
      meta: { requiresAuth: true } 
    },
    { 
      path: '/customer/:id', 
      component: CustomerDetail, 
      name: 'customerDetail', 
      meta: { requiresAuth: true } 
    },
    { 
      path: '/product', 
      component: ProductList, 
      name: 'productList', 
      meta: { requiresAuth: true } 
    },
    { 
      path: '/product/:id', 
      component: ProductDetail, 
      name: 'productDetail', 
      meta: { requiresAuth: true } 
    },
    { 
      path: '/addproduct', 
      component: AddProduct, 
      name: 'addProduct', 
      meta: { requiresAuth: true } 
    },
    { 
      path: '/invoice', 
      component: InvoiceList, 
      name: 'invoiceList', 
      meta: { requiresAuth: true } 
    },
  ]
});
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  console.log('Navigating to:', to.path);
  console.log('Token:', token);

  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      console.log('No token, redirecting to login');
      next('/'); // Redirect to login if no token
    } else {
      console.log('Token exists, proceeding to route');
      next(); // Proceed to the route
    }
  } else if (to.path === '/' && token) {
    console.log('User is logged in, redirecting to dashboard');
    next('/dashboard'); // Redirect to dashboard if trying to access login
  } else {
    console.log('No auth required, proceeding');
    next(); // No authentication required, proceed
  }
});



export default router;
