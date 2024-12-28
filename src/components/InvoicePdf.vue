<template>
  <v-container> </v-container>
</template>

<script>
import jsPDF from "jspdf";
import "jspdf-autotable"; // Import jsPDF autotable for table generation
import { toWords } from "number-to-words"; // Install the library: npm install number-to-words

export default {
  props: {
    invoiceDetail: Object, // Receiving invoice detail as a prop
  },

  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },

    downloadPdf() {
      const doc = new jsPDF();

      // Add Logo
      const logoPath = require("@/assets/HoloLogo.png"); // Ensure the correct path to your logo file
      const imgWidth = 25; // Adjust the width of the logo
      const imgHeight = 25; // Adjust the height of the logo
      doc.addImage(logoPath, "PNG", 5, 8, imgWidth, imgHeight);

      // Add Header
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.text("HEMANT TRADERS", 105, 20, "center");

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(
        "1281, Sadashiv Peth, Vertex Arcade, Pune - 411030",
        105,
        25,
        "center"
      );
      doc.text(
        "Contact: (+91) 9422080922 / 9420699675    Web: hemanttraders.vercel.app",
        105,
        32,
        "center"
      );

      // Horizontal line above
      doc.setLineWidth(0.5);
      doc.line(0, 36, 210, 36);

      // Add Dealer Details
      doc.text(
        "Dealers in BOPP, POLYESTER, PVC, THERMAL Films",
        105,
        42,
        "center"
      );
      doc.text(
        "Adhesives for Lamination, Bookbinding, and Pasting, UV Coats",
        105,
        48,
        "center"
      );

      // Horizontal line below
      doc.line(0, 51, 210, 51);

      // Add Invoice Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Invoice #${this.invoiceDetail._id}`, 14, 60);

      // Add Date
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Date: ${this.formatDate(this.invoiceDetail.createdAt)}  `,
        190,
        60,
        "right"
      );

      // Add Customer Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `M/s ${this.invoiceDetail.customer?.name || "N/A"}`,
        105,
        70,
        "center"
      );
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Address: ${this.invoiceDetail.customer?.address?.line1 || "N/A"}, ${
          this.invoiceDetail.customer?.address?.city || "N/A"
        }`,
        105,
        80,
        "center"
      );
      doc.text(
        `Phone No: ${this.invoiceDetail.customer?.phone_no || "N/A"}`,
        105,
        90,
        "center"
      );
      doc.text(
        `GSTIN: ${this.invoiceDetail.customer?.gstin || "N/A"}`,
        105,
        100,
        "center"
      );
      doc.text(
        `Transport: ${this.invoiceDetail.transporter || "N/A"}`,
        105,
        110,
        "center"
      );

      // Calculate total quantity
      const totalQuantity = this.invoiceDetail.products.reduce(
        (total, product) => total + product.quantity,
        0
      ).toFixed(2); // Total quantity formatted to 2 decimal places

      // Add Products Table with HSN Code
      const products = this.invoiceDetail.products.map((product) => [
        product.name,
        product.product.hsn_code || "N/A", // Include HSN code here
        product.quantity.toFixed(2), // Format quantity to 2 decimal places if necessary
        product.width + (product.width > 70 ? " mm " : "''"),
        `Rs.${product.unit_price.toFixed(2)}`, // Format unit price to 2 decimal places
        `Rs.${(product.quantity * product.unit_price).toFixed(2)}`, // Format amount to 2 decimal places
      ]);

      // Add Total Rows with formatted values
      products.push(["", "", "", "", "", ""]);
      products.push([
        "",
        "",
        "",
        "",
        "Sub Total",
        `Rs.${this.invoiceDetail.totalAmount.toFixed(2)}`, // Format to 2 decimal places
      ]);
      products.push([
        "add:",
        "",
        "",
        "",
        "Other Charges",
        `Rs.${this.invoiceDetail.otherCharges.toFixed(2)}`, // Format to 2 decimal places
      ]);
      products.push([
        "add:",
        "",
        "",
        "",
        "CGST @ 9%",
        `Rs.${this.invoiceDetail.cgst.toFixed(2)}`, // Format to 2 decimal places
      ]);
      products.push([
        "add:",
        "",
        "",
        "",
        "SGST @ 9%",
        `Rs.${this.invoiceDetail.sgst.toFixed(2)}`, // Format to 2 decimal places
      ]);
      products.push([
        "Grand Total",
        "",
        totalQuantity+ " kgs", // Display total quantity here
        "",
        "",
        `Rs.${this.invoiceDetail.grandTotal.toFixed(2)}`, // Format to 2 decimal places
      ]);

      doc.autoTable({
        startY: 120,
        head: [
          [
            "Product Name",
            "HSN/SAC", // Added HSN code column
            "Quantity (kg)",
            "Width",
            "Rate (Rs./kg)",
            "Amount (Rs.)",
          ],
        ],
        body: products,
        styles: {
          fontSize: 10,
        },
        headStyles: {
          fillColor: [0, 0, 0], // Black background for the header
          textColor: [255, 255, 255], // White text color for visibility
        },
        footStyles: {
          fontStyle: "bold",
        },
        didParseCell: function (data) {
          if (data.section === "body") {
            // Bold Quantity Column (index 2) and Amount Column (index 5)
            if (data.column.index === 2 || data.column.index === 5) {
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      // Add Grand Total in Words
      const grandTotalInWords = toWords(
        Math.round(this.invoiceDetail.grandTotal)
      ).toUpperCase(); // Convert to words and uppercase
      doc.setFontSize(10);
      doc.text(
        `AMOUNT CHARGEABLE (in words): INR ${grandTotalInWords} ONLY`,
        14,
        doc.lastAutoTable.finalY + 10 // Place the text below the table
      );

      // Add Footer Note
      const pageHeight = doc.internal.pageSize.height; // Get the page height
      doc.setFontSize(8);
      doc.text(
        `Please Check the material before use.
Our responsibility ceases once the material leaves our godown.
Goods once sold will not be taken back.
Interest @24% will be charged if payments are not made before due date.
This is a computer-generated document and does not require any signature(s).`,
        105,
        pageHeight - 15, // Adjust position as needed
        "center"
      );

      // Save the PDF
      doc.save(`Invoice_${this.invoiceDetail._id}.pdf`);
    },
  },
};
</script>


<style scoped>
#invoice-pdf {
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid black;
  padding: 0px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
  border: 1px solid red;
}
</style>
