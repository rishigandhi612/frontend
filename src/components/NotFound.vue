<template>
    <div class="not-found">
      <h1 class="status-code">404</h1>
      <h2 class="message">Page Not Found</h2>
      <p class="description">
        Oops! The page you are looking for does not exist or has been moved.
      </p>
      <router-link to="/" class="home-link">
        Go Back to Home
      </router-link>
    </div>
  </template>
  
  <script>
  export default {
    name: "NotFound",
  };
  </script>
  
  <style scoped>
  .not-found {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
    background-color: #f4f4f4;
    color: #333;
  }
  
  .status-code {
    font-size: 6rem;
    font-weight: bold;
    color: #ff6b6b;
    margin-bottom: 0.5rem;
  }
  
  .message {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  .description {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: #555;
  }
  
  .home-link {
    text-decoration: none;
    background-color: #ff6b6b;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 5px;
    font-size: 1rem;
    font-weight: bold;
    transition: background-color 0.3s;
  }
  
  .home-link:hover {
    background-color: #e55a5a;
  }
  </style>
  