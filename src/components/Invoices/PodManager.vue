<template>
  <div>
    <!-- POD Upload/View Button -->
    <v-btn
      :color="hasPod ? 'success' : 'warning'"
      block
      class="mt-2"
      @click="openPodDialog"
      :loading="isPodFetching"
    >
      <v-icon left>{{ hasPod ? "mdi-file-check" : "mdi-file-upload" }}</v-icon>
      {{ hasPod ? "View POD" : "Upload POD" }}
    </v-btn>

    <!-- POD Management Dialog -->
    <v-dialog v-model="podDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h5">
          <v-icon left color="primary">mdi-truck-check</v-icon>
          Proof of Delivery (POD) Management
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-6">
          <!-- POD exists - View Mode -->
          <div v-if="currentPodData">
            <v-alert type="success" outlined class="mb-4">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <strong>POD Available</strong>
                  <div class="text-caption">
                    Uploaded:
                    {{
                      formatDate(
                        (currentPodData && currentPodData.uploadedAt) ||
                          (invoiceDetail && invoiceDetail.deliveredAt)
                      )
                    }}
                  </div>
                </div>
                <v-chip color="success" small>
                  <v-icon left small>mdi-check</v-icon>
                  Delivered
                </v-chip>
              </div>
            </v-alert>

            <v-row>
              <v-col cols="12" md="6">
                <v-card outlined>
                  <v-card-subtitle class="pb-1">
                    <v-icon left small>mdi-account</v-icon>
                    Upload Details
                  </v-card-subtitle>
                  <v-card-text>
                    <div class="mb-2">
                      <strong>Uploaded by:</strong>
                      {{ podData.uploadedBy || "N/A" }}
                    </div>
                    <div class="mb-2">
                      <strong>Date:</strong>
                      {{ formatDate(podData.uploadedAt) }}
                    </div>
                    <div>
                      <strong>File:</strong>
                      {{ podData.originalName || "POD Document" }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card outlined>
                  <v-card-subtitle class="pb-1">
                    <v-icon left small>mdi-note-text</v-icon>
                    Delivery Notes
                  </v-card-subtitle>
                  <v-card-text>
                    <div class="text-body-2">
                      {{
                        podData.deliveryNotes || "No delivery notes provided."
                      }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- POD Image/Document Preview -->
            <v-card
              outlined
              class="mt-4"
              v-if="
                currentPodData &&
                (currentPodData.fileUrl ||
                  currentPodData.filename ||
                  currentPodData.originalname ||
                  currentPodData.base64Data)
              "
            >
              <v-card-subtitle class="pb-1">
                <v-icon left small>mdi-file</v-icon>
                Document Preview
              </v-card-subtitle>
              <v-card-text class="text-center">
                <!-- If it's an image, show preview -->
                <div
                  v-if="
                    isImage(
                      currentPodData &&
                        (currentPodData.originalname || currentPodData.filename)
                    )
                  "
                >
                  <v-img
                    v-if="currentPodData && currentPodData.fileUrl"
                    :src="currentPodData.fileUrl"
                    max-height="300"
                    contain
                    class="mx-auto"
                  ></v-img>
                  <v-img
                    v-else-if="currentPodData && currentPodData.base64Data"
                    :src="`data:image/jpeg;base64,${currentPodData.base64Data}`"
                    max-height="300"
                    contain
                    class="mx-auto"
                  ></v-img>
                  <div v-else class="pa-4">
                    <v-icon size="48" color="grey">mdi-image</v-icon>
                    <div class="text-caption mt-2">
                      Image preview not available
                    </div>
                  </div>
                </div>
                <!-- If it's not an image, show file icon -->
                <div v-else class="pa-4">
                  <v-icon size="48" color="primary">mdi-file-document</v-icon>
                  <div class="text-subtitle-2 mt-2">
                    {{
                      (currentPodData &&
                        (currentPodData.originalname ||
                          currentPodData.filename)) ||
                      "POD Document"
                    }}
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Action Buttons for existing POD -->
            <div class="text-center mt-4">
              <v-btn
                color="primary"
                @click="downloadPod"
                class="mr-2"
                :disabled="!currentPodData"
              >
                <v-icon left>mdi-download</v-icon>
                Download POD
              </v-btn>
              <v-btn color="warning" @click="switchToUploadMode" outlined>
                <v-icon left>mdi-upload</v-icon>
                Replace POD
              </v-btn>
            </div>
          </div>

          <!-- POD doesn't exist or upload mode - Upload Form -->
          <div v-else-if="!currentPodData || uploadMode">
            <v-alert type="info" outlined class="mb-4">
              <strong>Upload Proof of Delivery</strong>
              <div class="text-caption">
                {{
                  uploadMode
                    ? "Replace existing POD with new document"
                    : "No POD found for this invoice. Please upload delivery proof."
                }}
              </div>
            </v-alert>

            <v-form ref="podForm" v-model="formValid" lazy-validation>
              <!-- File Upload -->
              <v-file-input
                v-model="selectedFile"
                :rules="fileRules"
                accept="image/*,.pdf,.doc,.docx"
                label="Select POD File"
                prepend-icon="mdi-camera"
                outlined
                show-size
                counter
                clearable
                :loading="isPodUploading"
                hint="Supported formats: Images (JPG, PNG), PDF, Word documents. Max size: 10MB"
                persistent-hint
              >
                <template v-slot:selection="{ text }">
                  <v-chip small label color="primary">
                    {{ text }}
                  </v-chip>
                </template>
              </v-file-input>

              <!-- Delivery Notes -->
              <v-textarea
                v-model="deliveryNotes"
                :rules="notesRules"
                label="Delivery Notes"
                outlined
                rows="3"
                counter="500"
                hint="Describe delivery details, location, person who received, etc."
                persistent-hint
                class="mt-4"
              ></v-textarea>

              <!-- Uploaded By -->
              <v-text-field
                v-model="uploadedBy"
                :rules="uploadedByRules"
                label="Uploaded By"
                outlined
                prepend-icon="mdi-account"
                hint="Name of person uploading this POD"
                persistent-hint
                class="mt-4"
              ></v-text-field>
            </v-form>
          </div>

          <!-- Error Message -->
          <v-alert
            v-if="errorMessage"
            type="error"
            class="mt-4"
            dismissible
            @input="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>

          <!-- Success Message -->
          <v-alert
            v-if="successMessage"
            type="success"
            class="mt-4"
            dismissible
            @input="successMessage = ''"
          >
            {{ successMessage }}
          </v-alert>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>

          <!-- Cancel Button -->
          <v-btn
            color="grey darken-1"
            text
            @click="closePodDialog"
            :disabled="isPodUploading"
          >
            {{ currentPodData && !uploadMode ? "Close" : "Cancel" }}
          </v-btn>

          <!-- Upload Button (only show in upload mode) -->
          <v-btn
            v-if="!currentPodData || uploadMode"
            color="primary"
            @click="uploadPod"
            :disabled="!formValid || isPodUploading"
            :loading="isPodUploading"
          >
            <v-icon left>mdi-upload</v-icon>
            {{ uploadMode ? "Replace POD" : "Upload POD" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";

export default {
  name: "PodManager",
  props: {
    invoiceId: {
      type: String,
      required: true,
    },
    invoiceDetail: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      podDialog: false,
      uploadMode: false,
      formValid: false,
      selectedFile: null,
      deliveryNotes: "",
      uploadedBy: "",
      errorMessage: "",
      successMessage: "",

      // Validation rules
      fileRules: [
        (v) => !!v || "Please select a file",
        (v) => !v || v.size <= 10485760 || "File size must be less than 10MB", // 10MB in bytes
        (v) =>
          !v ||
          this.isValidFileType(v) ||
          "Invalid file type. Please select an image, PDF, or Word document.",
      ],
      notesRules: [
        (v) => !!v || "Delivery notes are required",
        (v) =>
          (v && v.length <= 500) ||
          "Delivery notes must be less than 500 characters",
      ],
      uploadedByRules: [
        (v) => !!v || "Please enter who is uploading this POD",
        (v) => (v && v.length >= 2) || "Name must be at least 2 characters",
        (v) => (v && v.length <= 50) || "Name must be less than 50 characters",
      ],
    };
  },
  computed: {
    ...mapState("invoices", ["podData"]),
    ...mapGetters("invoices", ["isPodUploading", "isPodFetching"]),

    hasPod() {
      return this.podData || (this.invoiceDetail && this.invoiceDetail.pod);
    },

    currentPodData() {
      // Return podData from store first, then check invoice detail
      return (
        this.podData || (this.invoiceDetail && this.invoiceDetail.pod) || null
      );
    },
  },
  methods: {
    ...mapActions("invoices", ["uploadPod", "fetchPod", "downloadPodFile"]),

    async openPodDialog() {
      this.podDialog = true;
      this.errorMessage = "";
      this.successMessage = "";
      this.uploadMode = false;

      // Check if POD data already exists in invoice detail
      if (this.invoiceDetail && this.invoiceDetail.pod) {
        this.$store.commit("invoices/SET_POD_DATA", this.invoiceDetail.pod);
      }
      // If no POD data in store and no POD in invoice detail, try to fetch
      else if (
        !this.podData &&
        (!this.invoiceDetail || !this.invoiceDetail.pod)
      ) {
        try {
          await this.fetchPod(this.invoiceId);
        } catch (error) {
          // If POD doesn't exist, that's expected - just continue to upload mode
          if (!error.message.includes("not found")) {
            this.errorMessage = error.message;
          }
        }
      }
    },

    closePodDialog() {
      this.podDialog = false;
      this.uploadMode = false;
      this.resetForm();
    },

    switchToUploadMode() {
      this.uploadMode = true;
      this.resetForm();
    },

    resetForm() {
      this.selectedFile = null;
      this.deliveryNotes = "";
      this.uploadedBy = "";
      this.errorMessage = "";
      this.successMessage = "";
      if (this.$refs.podForm) {
        this.$refs.podForm.resetValidation();
      }
    },

    async uploadPod() {
      if (!this.$refs.podForm.validate()) {
        return;
      }

      try {
        const result = await this.uploadPod({
          invoiceId: this.invoiceId,
          podFile: this.selectedFile,
          deliveryNotes: this.deliveryNotes,
          uploadedBy: this.uploadedBy,
        });

        if (result.success) {
          this.successMessage = result.message;
          this.uploadMode = false;
          this.resetForm();

          // Refresh POD data to show the newly uploaded POD
          setTimeout(() => {
            this.successMessage = "";
          }, 3000);
        }
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    async downloadPod() {
      try {
        const podData = this.currentPodData;
        const filename =
          (podData && (podData.originalname || podData.filename)) ||
          `POD-${this.invoiceId}.jpg`;
        await this.downloadPodFile({
          invoiceId: this.invoiceId,
          filename: filename,
        });
        this.successMessage = "POD downloaded successfully!";
        setTimeout(() => {
          this.successMessage = "";
        }, 3000);
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    formatDate(dateString) {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    isValidFileType(file) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      return allowedTypes.includes(file.type);
    },

    isImage(filename) {
      if (!filename) return false;
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".webp",
      ];
      const extension = filename
        .toLowerCase()
        .substring(filename.lastIndexOf("."));
      return imageExtensions.includes(extension);
    },
  },

  watch: {
    // Reset component state when invoice changes
    invoiceId() {
      this.closePodDialog();
      this.$store.commit("invoices/CLEAR_POD_DATA");
    },

    // Watch for changes in invoiceDetail to update POD data
    invoiceDetail: {
      handler(newVal) {
        if (newVal && newVal.pod && !this.podData) {
          this.$store.commit("invoices/SET_POD_DATA", newVal.pod);
        }
      },
      immediate: true,
    },
  },

  beforeDestroy() {
    // Clear POD data when component is destroyed
    this.$store.commit("invoices/CLEAR_POD_DATA");
  },
};
</script>

<style scoped>
.v-dialog .v-card {
  overflow-y: auto;
}

.v-image {
  border-radius: 8px;
}

.v-chip.v-size--small {
  font-size: 0.75rem;
}
</style>
