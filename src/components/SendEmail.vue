<template>
    <v-container>
      <v-btn color="primary" @click="sendEmail">Send Invoice via Email</v-btn>
      <v-alert v-if="message" type="success" class="mt-3">{{ message }}</v-alert>
      <v-alert v-if="errorMessage" type="error" class="mt-3">{{ errorMessage }}</v-alert>
    </v-container>
  </template>
  
  <script>
  import jsPDF from "jspdf";
  import "jspdf-autotable";
  import axios from "axios";
  
  export default {
    props: {
      invoiceDetail: Object, // Invoice details
      email: String, // Recipient email from parent
    },
    data() {
      return {
        message: null,
        errorMessage: null,
      };
    },
    methods: {
      generatePdf() {
        const doc = new jsPDF();
        doc.text("Invoice", 10, 10);
        doc.text(`Invoice #${this.invoiceDetail.invoiceNumber}`, 10, 20);
        // Add other invoice details...
        doc.autoTable({
          startY: 30,
          head: [["Product", "Qty", "Price", "Total"]],
          body: this.invoiceDetail.products.map((p) => [
            p.product.name,
            p.quantity,
            p.unit_price,
            p.quantity * p.unit_price,
          ]),
        });
  
        // Convert to Base64
        return new Promise((resolve) => {
          const pdfDataUri = doc.output("datauristring");
          const base64String = pdfDataUri.split(",")[1]; // Remove `data:application/pdf;base64,`
          resolve(base64String);
        });
      },
  
      async sendEmail() {
        try {
          if (!this.email) {
            this.errorMessage = "Please enter a valid email address.";
            return;
          }
  
          const pdfBase64 = await this.generatePdf();
  
          const response = await axios.post(
            "https://holobackend111.vercel.app/email/email",
            {
              email: this.email,
              subject: "Invoice from Hemant Traders",
              pdfBase64, // Send Base64 PDF
              filename: `Invoice_${this.invoiceDetail.invoiceNumber}.pdf`,
            }
          );
  
          this.message = response.data.message || "Email sent successfully!";
          this.errorMessage = null;
        } catch (error) {
          this.errorMessage = "Failed to send email.";
          this.message = null;
        }
      },
    },
  };
  </script>
  