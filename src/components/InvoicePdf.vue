<template>
  <v-container> </v-container>
</template>

<script>
import jsPDF from "jspdf";
import "jspdf-autotable"; // Import jsPDF autotable for table generation

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

      // Add Header
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      doc.text("HEMANT TRADERS", 5, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("1281, Sadashiv Peth, Vertex Arcade, Pune - 411030", 14, 30);
      doc.text("Mobile: (+91) 9422080922 / 9420699675", 14, 35);
      doc.text("Website: hemanttraders.vercel.app", 14, 40);
      doc.text(
        "Dealers in BOPP, POLYESTER, PVC, THERMAL FILMS",
        14,
        45
      );
      doc.text(
        "LAMINATION ADHESIVES, BOOKBINDING ADHESIVES, PASTING ADHESIVES, UV COATS",
        14,
        50
      );

      // Add Invoice Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(`Invoice #${this.invoiceDetail._id}`, 14, 70);

      // Add Date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Date: ${this.formatDate(this.invoiceDetail.createdAt)}`,
        14,
        80
      );

      // Add Customer Details
      doc.text(
        `Customer: ${this.invoiceDetail.customer?.name || "N/A"}`,
        14,
        90
      );
      doc.text(
        `Email: ${this.invoiceDetail.customer?.email_id || "N/A"}`,
        14,
        100
      );
      doc.text(
        `Phone No: ${this.invoiceDetail.customer?.phone_no || "N/A"}`,
        14,
        110
      );
      doc.text(
        `GSTIN: ${this.invoiceDetail.customer?.gstin || "N/A"}`,
        14,
        120
      );

      // Add Products Table
      const products = this.invoiceDetail.products.map((product) => [
        product.name,
        product.quantity,
        product.width + (product.width > 70 ? " mm" : " inches"),
        `Rs.${product.unit_price}`,
        `Rs.${product.quantity * product.unit_price}`,
      ]);

      doc.autoTable({
        startY: 130,
        head: [
          [
            "Product Name",
            "Quantity (kg)",
            "Width",
            "Rate (Rs./kg)",
            "Amount (Rs.)",
          ],
        ],
        body: products,
      });

      // Add Totals Section
      doc.text(
        `Basic Total: Rs.${this.invoiceDetail.totalAmount}`,
        14,
        doc.lastAutoTable.finalY + 10
      );
      doc.text(
        `CGST: Rs.${this.invoiceDetail.cgst}`,
        14,
        doc.lastAutoTable.finalY + 20
      );
      doc.text(
        `SGST: Rs.${this.invoiceDetail.sgst}`,
        14,
        doc.lastAutoTable.finalY + 30
      );
      doc.text(
        `Other Charges: Rs.${this.invoiceDetail.otherCharges}`,
        14,
        doc.lastAutoTable.finalY + 40
      );
      doc.text(
        `Grand Total: Rs.${this.invoiceDetail.grandTotal}`,
        14,
        doc.lastAutoTable.finalY + 50
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
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>
