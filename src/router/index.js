import Vue from 'vue';
import Router from 'vue-router';

// Import components
import Login from '../components/LoginUser.vue';
import UserDashboard from '../components/UserDashboard.vue';
import CustomerList from '../components/CustomerList.vue';
import CustomerDetail from '@/components/CustomerDetail.vue';
import ProductList from '@/components/ProductList.vue';
import ProductDetail from '@/components/ProductDetail.vue';
import AddProduct from '@/components/AddProduct.vue';
import InvoiceList from '@/components/InvoiceList.vue';
import InvoiceDetail from '@/components/InvoiceDetail.vue';
import AddInvoice from '@/components/AddInvoice.vue';
import UserList from '@/components/UserList.vue';
import UserDetail from '@/components/UserDetail.vue';
import AddUser from '@/components/AddUser.vue'
import NotFound from '@/components/NotFound.vue';

Vue.use(Router);

// Define routes
const routes = [
  {
    path: '/',
    component: Login,
    name: 'login',
  },
  {
    path: '/dashboard',
    component: UserDashboard,
    name: 'userDashboard',
    meta: { requiresAuth: true }, // Route requires authentication
  },
  {
    path: '/customer',
    component: CustomerList,
    name: 'customerList',
    meta: { requiresAuth: true },
  },
  {
    path: '/customer/:id',
    component: CustomerDetail,
    name: 'customerDetail',
    meta: { requiresAuth: true },
  },
  {
    path: '/product',
    component: ProductList,
    name: 'productList',
    meta: { requiresAuth: true },
  },
  {
    path: '/product/:id',
    component: ProductDetail,
    name: 'productDetail',
    meta: { requiresAuth: true },
  },
  {
    path: '/addproduct',
    component: AddProduct,
    name: 'addProduct',
    meta: { requiresAuth: true },
  },
  {
    path: '/addproduct/:id?',
    component: AddProduct,
    name: 'editProduct',
    meta: { requiresAuth: true },
  },
  {
    path: '/invoice',
    component: InvoiceList,
    name: 'invoiceList',
    meta: { requiresAuth: true },
  },
  {
    path: '/invoice/:id',
    component: InvoiceDetail,
    name: 'invoiceDetail',
    meta: { requiresAuth: true },
  },
  {
    path: '/addinvoice/:id?',
    component: AddInvoice,
    name: 'addInvoice',
    meta: { requiresAuth: true },
  },
  {
    path: '/user',
    component: UserList,
    name: 'UserList',
    meta: { requiresAuth: true },
  },
  {
    path: '/user/:id',
    component: UserDetail,
    name: 'UserDetail',
    meta: { requiresAuth: true },
  },
  {
    path: '/adduser',
    component: AddUser,
    name: 'addUser',
    meta: { requiresAuth: true },
  },
  {
    path: '/adduser/:id?',
    component: AddUser,
    name: 'EditUser',
    meta: { requiresAuth: true },
  },
  {
    path: '*',
    component: NotFound,
    name: 'notFound',
  },
];

// Create router instance
const router = new Router({
  mode: 'history', // Use history mode to avoid hash in URLs
  routes,
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token'); // Check for authentication token

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    // Route requires authentication
    if (!token) {
      console.warn('Access denied: No token found. Redirecting to login.');
      next({ name: 'login' }); // Redirect to login if not authenticated
    } else {
      console.info('Authenticated user. Proceeding to route:', to.name);
      next(); // User authenticated, proceed to the route
    }
  } else if (to.name === 'login' && token) {
    // User is already logged in, redirect to dashboard
    console.info('User is logged in. Redirecting to dashboard.');
    next({ name: 'userDashboard' });
  } else {
    // No authentication required, proceed
    console.info('Accessing public route:', to.name);
    next();
  }
});

export default router;
