import Vue from 'vue';
import Router from 'vue-router';// Make sure the path is correct
import Login from '../components/LoginUser.vue';
import UserDashboard from '../components/UserDashboard.vue';

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
      meta: { requiresAuth: true } // Protect the route
    }
  ]
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/');
    } else {
      next(); // allow navigation to dashboard
    }
  } else if (to.path === '/' && token) {
    next('/dashboard'); // redirect to dashboard if already logged in
  } else {
    next(); // for all other cases, allow navigation
  }
});

export default router;
