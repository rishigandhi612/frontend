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

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`(Original For Recipient)`, 105, 56, "center");
      // Add Invoice Title
      doc.setFontSize(12);
      doc.text(`Invoice #${this.invoiceDetail.invoiceNumber}`, 14, 62);

      // Add Date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Date: ${this.formatDate(this.invoiceDetail.createdAt)}  `,
        200,
        62,
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
        `${this.invoiceDetail.customer?.address?.line1 || "N/A"}, ${
          this.invoiceDetail.customer?.address?.city?.pincode || "N/A"
        }`,
        105,
        75,
        "center"
      );
      doc.text(
        `Contact: ${this.invoiceDetail.customer?.phone_no || "N/A"}`,
        105,
        80,
        "center"
      );
      doc.text(
        `GSTIN/UIN: ${this.invoiceDetail.customer?.gstin || "N/A"}`,
        105,
        85,
        "center"
      );
      doc.text(
        `Dispatch through: ${this.invoiceDetail.transporter || "N/A"}`,
        105,
        90,
        "center"
      );

      // Calculate total quantity
      const totalQuantity = this.invoiceDetail.products
        .reduce((total, product) => total + product.quantity, 0)
        .toFixed(3); // Total quantity formatted to 2 decimal places

      // Add Products Table with HSN Code
      const products = this.invoiceDetail.products.map((product) => [
        product.name,
        product.product.hsn_code || "N/A", // Include HSN code here
        product.quantity.toFixed(3) + " Kgs", // Format quantity to 2 decimal places if necessary
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
        `${totalQuantity} Kgs`,
        "",
        "",
        `Rs.${this.invoiceDetail.grandTotal.toFixed(2)}`, // Format to 2 decimal places
      ]);

      doc.autoTable({
        startY: 100,
        head: [
          [
            "Product Name",
            "HSN/SAC",
            "Quantity",
            "Width",
            "Rate",
            "Amount",
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

      // Group by HSN Code
      const hsnSummary = this.invoiceDetail.products.reduce(
        (summary, product) => {
          const hsn = product.product.hsn_code || "N/A";
          if (!summary[hsn]) {
            summary[hsn] = {
              cgst: 0,
              sgst: 0,
            };
          }
          const amount = product.quantity * product.unit_price;
          const cgst = (amount * 9) / 100; // Assuming 9% CGST
          const sgst = (amount * 9) / 100; // Assuming 9% SGST

          summary[hsn].amount += amount;
          summary[hsn].cgst += cgst;
          summary[hsn].sgst += sgst;

          return summary;
        },
        {}
      );

      // Prepare data for the HSN Summary table
      const hsnSummaryData = Object.keys(hsnSummary).map((hsn) => [
        hsn,
        `Rs.${hsnSummary[hsn].cgst.toFixed(2)}`,
        `Rs.${hsnSummary[hsn].sgst.toFixed(2)}`,
      ]);

      // Add Grand Total in Words
      const grandTotalInWords = toWords(
        Math.round(this.invoiceDetail.grandTotal)
      ).toUpperCase(); // Convert to words and uppercase
      doc.setFontSize(10);
      doc.text(
        `AMOUNT CHARGEABLE (in words):`,
        14,
        doc.lastAutoTable.finalY + 7 // Place the text below the table
      );
      doc.setFont("helvetica", "bold");
      doc.text(
        `INR ${grandTotalInWords} Only`,
        14,
        doc.lastAutoTable.finalY + 14 // Place the text below the table
      );

      // Add HSN Summary Table
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 18, // Place it below the main table
        head: [["HSN/SAC", "Central Tax", "State Tax"]],
        body: hsnSummaryData,
        styles: {
          fontSize: 10,
        },
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
        },
      });
      // Calculate Total Tax
      const totalTaxAmount = this.invoiceDetail.cgst + this.invoiceDetail.sgst;

      // Convert Total Tax Amount to Words
      const totalTaxInWords = toWords(Math.round(totalTaxAmount)).toUpperCase(); // Convert to words and uppercase

      // Add Total Tax Amount in Words to the bottom
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Tax Amount(in words):`,
        14,
        doc.lastAutoTable.finalY + 7 // Adjust position below the HSN summary table
      );
      doc.setFont("helvetica", "bold");
      doc.text(
        `INR ${totalTaxInWords} Only`,
        14,
        doc.lastAutoTable.finalY + 14 // Adjust position below the numeric tax amount
      );
      // Footer Note
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `T&C
*Please Check the material before use.
*Subject To Pune Jurisdiction
*Our responsibility ceases once the material leaves our godown.
*Goods once sold will not be taken back.
*Interest @24% will be charged if payments are not made before due date.`,
        14,
        pageHeight - 25,
      );
      doc.setFont("helvetica", "bold");
      doc.text(`This is a computer-generated document and does not require any signature(s).`,105,pageHeight-3,"center")

      doc.text(
        `        Company's Bank Details
        Bank Name: Bank Of Maharashtra
        A/C No. 60038479763
        Branch & IFS Code: Bajirao Rd, Pune - 411030 & MAHB0000001`,
        105,
        pageHeight - 25,
        "left"
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
