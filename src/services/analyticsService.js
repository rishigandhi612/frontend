// src/services/analytics.js
import apiClient from "@/store/apiClient";

class AnalyticsService {
  /**
   * Build query string from filters object
   */
  buildQueryString(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== null &&
        filters[key] !== undefined &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });
    return params.toString() ? `?${params.toString()}` : "";
  }

  /**
   * Get quantity sold by width
   */
  async getQuantityByWidth(filters = {}) {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get(
      `/analytics/quantity-by-width${queryString}`
    );
    return response.data;
  }

  /**
   * Get product sales analytics
   */
  async getProductSales(filters = {}) {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get(
      `/analytics/product-sales${queryString}`
    );
    return response.data;
  }

  /**
   * Get average sale cost
   */
  async getAverageSaleCost(filters = {}) {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get(
      `/analytics/average-sale-cost${queryString}`
    );
    return response.data;
  }

  /**
   * Get monthly sales dashboard
   */
  async getMonthlySalesDashboard(filters = {}) {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get(
      `/analytics/monthly-dashboard${queryString}`
    );
    return response.data;
  }

  /**
   * Get top performing products
   */
  async getTopProducts(filters = {}) {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get(
      `/analytics/top-products${queryString}`
    );
    return response.data;
  }

  /**
   * Get customer purchase patterns
   */
  async getCustomerPatterns(filters = {}) {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get(
      `/analytics/customer-patterns${queryString}`
    );
    return response.data;
  }

  /**
   * Get width distribution
   */
  async getWidthDistribution(filters = {}) {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get(
      `/analytics/width-distribution${queryString}`
    );
    return response.data;
  }

  /**
   * Get sales trends
   */
  async getSalesTrends(filters = {}) {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get(
      `/analytics/sales-trends${queryString}`
    );
    return response.data;
  }

  /**
   * Get comprehensive analytics dashboard
   */
  async getAnalyticsDashboard(filters = {}) {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get(`/analytics/dashboard${queryString}`);
    return response.data;
  }
}

export default new AnalyticsService();
