//  Updated Vuex store module for invoices with loading states and POD management
import apiClient from "./apiClient";
const state = {
  invoices: [],
  invoiceDetail: null,
  loading: false,
  loadingState: {
    fetchInvoices: false,
    deleteInvoice: false,
    createUpdateInvoice: false,
    fetchInvoiceDetail: false,
    sendEmail: false,
    uploadPod: false, // Added POD upload loading state
    fetchPod: false, // Added POD fetch loading state
  },
  pagination: {
    page: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  },
  sortBy: "createdAt",
  sortDesc: true,
  search: "",
  podData: null, // Store POD data
};

const getters = {
  allInvoices: (state) => state.invoices,
  invoiceDetail: (state) => state.invoiceDetail,
  isLoading: (state) => state.loading,
  pagination: (state) => state.pagination,
  sortBy: (state) => state.sortBy,
  sortDesc: (state) => state.sortDesc,
  search: (state) => state.search,
  isEmailSending: (state) => state.loadingState.sendEmail,
  isPodUploading: (state) => state.loadingState.uploadPod,
  isPodFetching: (state) => state.loadingState.fetchPod,
  podData: (state) => state.podData,
};

const actions = {
  // ... (keeping all existing actions)

  // Modified to accept a skipFetch parameter to prevent automatic data fetching
  setPage({ commit }, page) {
    commit("SET_PAGE", page);
  },

  setItemsPerPage({ commit }, itemsPerPage) {
    commit("SET_ITEMS_PER_PAGE", itemsPerPage);
    commit("SET_PAGE", 1); // Reset to first page when changing items per page
  },

  setSorting({ commit }, { sortBy, sortDesc }) {
    commit("SET_SORTING", { sortBy, sortDesc });
  },

  setSearch({ commit }, search) {
    commit("SET_SEARCH", search);
    commit("SET_PAGE", 1); // Reset to first page when searching
  },

  async fetchInvoices({ commit, state }) {
    commit("SET_LOADING_STATE", { type: "fetchInvoices", value: true });
    try {
      // Build query parameters for pagination and sorting
      const params = {
        page: state.pagination.page,
        itemsPerPage: state.pagination.itemsPerPage,
        sortBy: state.sortBy,
        sortDesc: state.sortDesc,
      };

      // Only add search parameter if it's not empty
      if (state.search && state.search.trim() !== "") {
        params.search = state.search.trim();
      }

      // Convert params object to query string
      const queryString = Object.keys(params)
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join("&");

      // console.log("Fetching with query:", queryString);

      const response = await apiClient.get(`/custprod?${queryString}`);

      if (response.data.success) {
        commit("SET_INVOICES", response.data.data);
        commit("SET_PAGINATION", response.data.pagination);
      } else {
        console.error("Failed to fetch invoices.");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    } finally {
      commit("SET_LOADING_STATE", { type: "fetchInvoices", value: false });
    }
  },

  async fetchInvoiceDetail({ commit, dispatch }, id) {
    commit("SET_LOADING_STATE", { type: "fetchInvoiceDetail", value: true });
    try {
      const response = await dispatch("fetchInvoiceById", id);

      if (response.success) {
        const invoice = response.data;
        commit("SET_INVOICE_DETAIL", invoice);
        commit(
          "SET_CUSTOMER_ID",
          invoice.customer ? invoice.customer._id : null
        );
        invoice.products.forEach((product) => {
          commit("SET_PRODUCT_ID", product._id);
        });
      } else {
        throw new Error("Failed to load invoice details.");
      }
    } catch (err) {
      console.error("Error fetching invoice details:", err);
      throw new Error("Failed to fetch invoice details.");
    } finally {
      commit("SET_LOADING_STATE", { type: "fetchInvoiceDetail", value: false });
    }
  },

  async fetchInvoiceById(_, id) {
    try {
      const response = await apiClient.get(`/custprod/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching invoice:", error);
      throw new Error("Failed to load invoice details.");
    }
  },

  async createInvoiceInStore({ commit }, invoiceData) {
    commit("SET_LOADING_STATE", { type: "createUpdateInvoice", value: true });
    try {
      const response = await apiClient.post("/custprod", invoiceData);
      if (response.data.success) {
        commit("ADD_INVOICE", response.data.data);
      } else {
        // If the API returns success: false, throw an error with the message
        throw new Error(response.data.message || "Invoice creation failed");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);

      // If it's an HTTP error response, extract the message
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        throw new Error(error.response.data.message);
      }

      // Otherwise, throw the original error
      throw error;
    } finally {
      commit("SET_LOADING_STATE", {
        type: "createUpdateInvoice",
        value: false,
      });
    }
  },

  async updateInvoiceInStore({ commit }, { id, data }) {
    commit("SET_LOADING_STATE", { type: "createUpdateInvoice", value: true });
    try {
      const response = await apiClient.put(`/custprod/${id}`, data);
      if (response.data.success) {
        commit("UPDATE_INVOICE", response.data.data);
      } else {
        // If the API returns success: false, throw an error with the message
        throw new Error(response.data.message || "Invoice update failed");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);

      // If it's an HTTP error response, extract the message
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        throw new Error(error.response.data.message);
      }

      // Otherwise, throw the original error
      throw error;
    } finally {
      commit("SET_LOADING_STATE", {
        type: "createUpdateInvoice",
        value: false,
      });
    }
  },

  async deleteInvoiceDetail({ commit }, invoiceId) {
    console.log("deleteInvoiceDetail action called with ID:", invoiceId);
    commit("SET_LOADING_STATE", { type: "deleteInvoice", value: true });
    try {
      const response = await apiClient.delete(`/custprod/${invoiceId}`);
      if (response.data.success) {
        commit("REMOVE_INVOICE", invoiceId);
      } else {
        throw new Error("Failed to delete the invoice on the server.");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete the invoice."
      );
    } finally {
      commit("SET_LOADING_STATE", { type: "deleteInvoice", value: false });
    }
  },

  // Updated sendInvoiceEmail action in your Vuex store
  async sendInvoiceEmail(
    { commit },
    { emailData, pdfBlob, challanPdfData = null, additionalFiles = [] }
  ) {
    commit("SET_LOADING_STATE", { type: "sendEmail", value: true });
    try {
      const formData = new FormData();

      // Add invoice PDF
      formData.append(
        "invoice",
        pdfBlob,
        `invoice-${emailData.invoiceNumber}.pdf`
      );

      // Add delivery challan PDF if provided
      if (challanPdfData) {
        formData.append(
          "challan",
          challanPdfData.blob,
          challanPdfData.filename
        );
      }

      // Add additional files if provided
      if (additionalFiles && additionalFiles.length > 0) {
        additionalFiles.forEach((file, index) => {
          formData.append(`attachment_${index}`, file, file.name);
        });

        // Also send the count of additional files to help backend processing
        formData.append(
          "additionalFilesCount",
          additionalFiles.length.toString()
        );
      }

      // Add email data
      formData.append("email", emailData.email);
      formData.append("invoiceNumber", emailData.invoiceNumber);
      formData.append("customerName", emailData.customerName);
      formData.append("subject", emailData.subject);
      formData.append("message", emailData.message);

      const response = await apiClient.post("/email/invoice", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // Increased timeout to 60 seconds for multiple file upload
      });

      // Check if the response indicates success
      if (response.status === 200 || (response.data && response.data.success)) {
        return {
          success: true,
          message: response.data.message || "Invoice sent successfully!",
        };
      } else {
        // If response doesn't have success: true, treat as error
        throw new Error(response.data?.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending invoice email:", error);

      // Enhanced error handling
      let errorMessage = "Failed to send email. Please try again.";

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data;

        switch (status) {
          case 401:
            errorMessage = "Authentication failed. Please login again.";
            break;
          case 413:
            errorMessage =
              "Files too large. Please reduce file sizes and try again.";
            break;
          case 422:
            errorMessage = `Validation error: ${message}`;
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = `Failed to send email: ${message}`;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message) {
        // This catches our custom thrown errors from the success check above
        errorMessage = error.message;
      }

      // Re-throw the error with the appropriate message
      throw new Error(errorMessage);
    } finally {
      commit("SET_LOADING_STATE", { type: "sendEmail", value: false });
    }
  },

  // New POD Actions
  async uploadPod(
    { commit },
    { invoiceId, podFile, deliveryNotes, uploadedBy }
  ) {
    commit("SET_LOADING_STATE", { type: "uploadPod", value: true });
    try {
      const formData = new FormData();
      formData.append("podFile", podFile);
      formData.append("deliveryNotes", deliveryNotes);
      formData.append("uploadedBy", uploadedBy);

      const response = await apiClient.post(
        `/custprod/${invoiceId}/pod`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000, // 60 second timeout for file upload
        }
      );

      if (response.status === 200 || (response.data && response.data.success)) {
        commit("SET_POD_DATA", response.data.data || response.data);
        return {
          success: true,
          message: response.data.message || "POD uploaded successfully!",
          data: response.data.data || response.data,
        };
      } else {
        throw new Error(response.data?.message || "Failed to upload POD");
      }
    } catch (error) {
      console.error("Error uploading POD:", error);

      let errorMessage = "Failed to upload POD. Please try again.";

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data;

        switch (status) {
          case 401:
            errorMessage = "Authentication failed. Please login again.";
            break;
          case 413:
            errorMessage =
              "File too large. Please reduce file size and try again.";
            break;
          case 422:
            errorMessage = `Validation error: ${message}`;
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = `Failed to upload POD: ${message}`;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    } finally {
      commit("SET_LOADING_STATE", { type: "uploadPod", value: false });
    }
  },

  async fetchPod({ commit }, invoiceId) {
    commit("SET_LOADING_STATE", { type: "fetchPod", value: true });
    try {
      const response = await apiClient.get(`/custprod/${invoiceId}/pod`);

      if (response.status === 200) {
        commit("SET_POD_DATA", response.data.data || response.data);
        return {
          success: true,
          data: response.data.data || response.data,
        };
      } else {
        throw new Error("Failed to fetch POD");
      }
    } catch (error) {
      console.error("Error fetching POD:", error);

      let errorMessage = "Failed to fetch POD.";

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data;

        switch (status) {
          case 401:
            errorMessage = "Authentication failed. Please login again.";
            break;
          case 404:
            errorMessage = "POD not found for this invoice.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = `Failed to fetch POD: ${message}`;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }

      throw new Error(errorMessage);
    } finally {
      commit("SET_LOADING_STATE", { type: "fetchPod", value: false });
    }
  },

  async downloadPodFile({ commit }, { invoiceId, filename }) {
    console.log("commit", commit);

    try {
      const response = await apiClient.get(`/custprod/${invoiceId}/pod`, {
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename || "pod-document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: "POD downloaded successfully!",
      };
    } catch (error) {
      console.error("Error downloading POD:", error);
      throw new Error("Failed to download POD. Please try again.");
    }
  },
};

const mutations = {
  SET_INVOICES(state, invoices) {
    state.invoices = invoices;
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = pagination;
  },
  SET_PAGE(state, page) {
    state.pagination.page = page;
  },
  SET_ITEMS_PER_PAGE(state, itemsPerPage) {
    state.pagination.itemsPerPage = itemsPerPage;
  },
  SET_SORTING(state, { sortBy, sortDesc }) {
    state.sortBy = sortBy;
    state.sortDesc = sortDesc;
  },
  SET_SEARCH(state, search) {
    state.search = search;
  },
  ADD_INVOICE(state, invoice) {
    state.invoices.push(invoice);
  },
  SET_INVOICE_DETAIL(state, invoice) {
    state.invoiceDetail = { ...invoice };
  },
  UPDATE_INVOICE(state, updatedInvoice) {
    const index = state.invoices.findIndex(
      (invoice) => invoice._id === updatedInvoice._id
    );
    if (index !== -1) {
      state.invoices.splice(index, 1, updatedInvoice);
    }
    if (state.invoiceDetail && state.invoiceDetail._id === updatedInvoice._id) {
      state.invoiceDetail = updatedInvoice;
    }
  },
  REMOVE_INVOICE(state, invoiceId) {
    state.invoices = state.invoices.filter(
      (invoice) => invoice._id !== invoiceId
    );

    if (state.invoiceDetail && state.invoiceDetail._id === invoiceId) {
      state.invoiceDetail = null;
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_LOADING_STATE(state, { type, value }) {
    state.loadingState[type] = value;
  },
  SET_CUSTOMER_ID(state, customerId) {
    if (state.invoiceDetail) {
      state.invoiceDetail.customerId = customerId;
    }
  },
  SET_PRODUCT_ID(state, productId) {
    if (state.invoiceDetail) {
      if (!state.invoiceDetail.productIds) {
        state.invoiceDetail.productIds = [];
      }
      state.invoiceDetail.productIds.push(productId);
    }
  },
  // New POD Mutations
  SET_POD_DATA(state, podData) {
    state.podData = podData;
  },
  CLEAR_POD_DATA(state) {
    state.podData = null;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
