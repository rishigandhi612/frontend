<template>

    <div class="dashboard-container">
    <p>This is a protected page only visible to authenticated users.</p>
  
  </div>
</template>

<script>

export default {
  name: 'UserDashboard',
  methods: {
  },
};
</script>

<style scoped>
.dashboard-container {
  text-align: center;
  min-height: 100vh;
}

h1 {
  color: #333;
}

p {
  font-size: 1.2em;
  color: #666;
}



</style>
