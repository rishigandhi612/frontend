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

      // Add Products Table with HSN Code
      const aggregatedProducts = this.invoiceDetail.products.reduce(
        (acc, product) => {
          const key = `${product.product.name}-${product.product.hsn_code}-${product.width}`;
          if (!acc[key]) {
            acc[key] = { ...product, quantity: 0 }; // Initialize the quantity
          }
          acc[key].quantity += product.quantity; // Add quantity for matching products
          return acc;
        },
        {}
      );

      const products = Object.values(aggregatedProducts).map((product) => [
        product.product.name,
        product.product.hsn_code || "N/A",
        product.width + (product.width > 70 ? " mm " : "''"),
        `${product.quantity.toFixed(3)} Kgs`,
        `Rs.${product.unit_price.toFixed(2)}`,
        `Rs.${(product.quantity * product.unit_price).toFixed(2)}`,
      ]);

      // Calculate total quantity
      const totalQuantity = Object.values(aggregatedProducts)
        .reduce((total, product) => total + product.quantity, 0)
        .toFixed(3);

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
      if (this.invoiceDetail.otherCharges !== 0) { products.push([
        "add:",
        "",
        "",
        "",
        "Other Charges",
        `Rs.${this.invoiceDetail.otherCharges.toFixed(2)}`, // Format to 2 decimal places
      ]);
    }
      
      // Conditionally add tax rows based on what's in the invoice
      if (this.invoiceDetail.cgst > 0 || this.invoiceDetail.sgst > 0) {
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
      }
      
      // Add IGST if present
      if (this.invoiceDetail.igst > 0) {
        products.push([
          "add:",
          "",
          "",
          "",
          "IGST @ 18%",
          `Rs.${this.invoiceDetail.igst.toFixed(2)}`, // Format to 2 decimal places
        ]);
      }
      
      products.push([
        "Grand Total",
        "",
        "",
        `${totalQuantity} Kgs`,
        "",
        `Rs.${this.invoiceDetail.grandTotal.toFixed(2)}`, // Format to 2 decimal places
      ]);

      // Render the product table
      doc.autoTable({
        startY: 100,
        head: [
            ["Product Name", "HSN/SAC", "Width", "Quantity", "Rate", "Amount"],
        ],
        body: products,
        styles: { 
            fontSize: 10,
            cellPadding: 2,  // Adds some space inside the cells for a cleaner look
        },
        headStyles: { 
            fillColor: [255, 255, 255], // Lighter gray background for header
            textColor: [0, 0, 0],  // Black text
            fontStyle: 'bold',
            halign: 'center', // Center-align header text
            valign: 'middle', // Center-align vertically
            border: true,  // Border for header cells
            lineWidth: 0.2,  // Slightly thicker line for the header
            lineColor: [0, 0, 0],  // Black border for header
        },
        bodyStyles: {
          fillColor: [255, 255, 255], // Lighter gray background for header
          textColor: [0, 0, 0],  // Black text
            halign: 'center', // Left-align body text
            valign: 'middle', // Center-align vertically
            border: false,  // Border for body cells
            // lineWidth: 0.1,  // Thin line for body cells
            // lineColor: [0, 0, 0], // Black border for body
        },
        didDrawPage: () => {
            this.addHeader(doc);
            this.addFooter(doc, doc.internal.pageSize.height);
        },
        didParseCell: function (data) {
            if (data.section === "body") {
                // Bold Quantity Column (index 3) and Amount Column (index 5)
                if (data.column.index === 3 || data.column.index === 5) {
                    data.cell.styles.fontStyle = "bold";
                }
            }
        },
        tableLineWidth: 0.1,  // Adding fine line for the entire table
        tableLineColor: [0, 0, 0], // Line color for the whole table
      });

      doc.setFontSize(10);

      // Handle new page addition properly
      let amountTextY = doc.lastAutoTable.finalY + 7;

      // Check if a new page is added due to lack of space
      const availableHeight =
        doc.internal.pageSize.height - doc.lastAutoTable.finalY - 40; // Approximate space needed for footnotes
      let newPageAddedForHSN = false;

      if (availableHeight < 50) {
        doc.addPage();
        this.addHeader(doc);
        newPageAddedForHSN = true;
        amountTextY = 20; // Adjust the Y position for the new page (or any appropriate value)
      }

      // Print the "AMOUNT CHARGEABLE (in words)"
      const amountText = "AMOUNT CHARGEABLE (in words):";
      doc.text(amountText, 14, amountTextY);

      // Group by HSN Code and handle both CGST/SGST and IGST scenarios
      const hsnSummary = this.invoiceDetail.products.reduce(
        (summary, product) => {
          const hsn = product.product.hsn_code || "N/A";
          if (!summary[hsn]) {
            // Initialize with all tax types
            summary[hsn] = { amount: 0, cgst: 0, sgst: 0, igst: 0 };
          }
          const amount = parseFloat(product.quantity * product.unit_price);
          summary[hsn].amount += amount;
          
          // Calculate taxes based on what's in the invoice
          if (this.invoiceDetail.igst > 0) {
            // For inter-state: calculate IGST
            const igstRate = 0.18; // 18%
            summary[hsn].igst += amount * igstRate;
          } else {
            // For intra-state: calculate CGST and SGST
            const cgstRate = 0.09; // 9%
            const sgstRate = 0.09; // 9%
            summary[hsn].cgst += amount * cgstRate;
            summary[hsn].sgst += amount * sgstRate;
          }
          
          return summary;
        },
        {}
      );

      // Prepare HSN summary data based on which taxes are present
      let hsnSummaryData = [];
      let hsnTableHeaders = [];
      
      if (this.invoiceDetail.igst > 0) {
        // Inter-state transaction: Show IGST column only
        hsnTableHeaders = [["HSN/SAC", "Integrated Tax"]];
        hsnSummaryData = Object.keys(hsnSummary).map((hsn) => [
          hsn,
          `Rs.${hsnSummary[hsn].igst.toFixed(2)}`,
        ]);
      } else {
        // Intra-state transaction: Show CGST and SGST columns
        hsnTableHeaders = [["HSN/SAC", "Central Tax", "State Tax"]];
        hsnSummaryData = Object.keys(hsnSummary).map((hsn) => [
          hsn,
          `Rs.${hsnSummary[hsn].cgst.toFixed(2)}`,
          `Rs.${hsnSummary[hsn].sgst.toFixed(2)}`,
        ]);
      }

      const grandTotalInWords = toWords(
        Math.round(this.invoiceDetail.grandTotal)
      ).toUpperCase();
      doc.setFont("helvetica", "bold");
      doc.text(
        `INR ${grandTotalInWords} Only`,
        14,
        doc.lastAutoTable.finalY + 14
      );

      // Render the HSN Summary Table with dynamic headers
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + (availableHeight < 50 ? 10 : 18),
        head: hsnTableHeaders,
        body: hsnSummaryData,
        styles: { 
          cellPadding: 1,  // Adds some space inside the cells for a cleaner look
        },
        headStyles: { 
          fillColor: [255, 255, 255], // Lighter gray background for header
          textColor: [0, 0, 0],  // Black text
          fontStyle: 'bold',
          halign: 'right', // Center-align header text
          valign: 'middle', // Center-align vertically
          border: true,  // Border for header cells
          lineWidth: 0.2,  // Slightly thicker line for the header
          lineColor: [0, 0, 0],  // Black border for header
        },
        bodyStyles: {
          fillColor: [255, 255, 255], // Lighter gray background for header
          textColor: [0, 0, 0],  // Black text
          halign: 'right', // Left-align body text
          valign: 'middle', // Center-align vertically
          border: false,  // Border for body cells
          lineWidth: 0.1,  // Thin line for body cells
          lineColor: [0, 0, 0], // Black border for body
        },
        didDrawPage: () => {
          if (newPageAddedForHSN) {
            this.addFooter(doc, doc.internal.pageSize.height);
          }
        },
      });

      // Calculate total tax amount based on tax type
      let totalTaxAmount = 0;
      if (this.invoiceDetail.igst > 0) {
        totalTaxAmount = this.invoiceDetail.igst;
      } else {
        totalTaxAmount = this.invoiceDetail.cgst + this.invoiceDetail.sgst;
      }
      
      const totalTaxInWords = toWords(Math.round(totalTaxAmount)).toUpperCase();

      // Print "Tax Amount(in words)" text and total tax amount in words
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Tax Amount(in words):`, 14, doc.lastAutoTable.finalY + 7);
      doc.setFont("helvetica", "bold");
      doc.text(
        `INR ${totalTaxInWords} Only`,
        14,
        doc.lastAutoTable.finalY + 14
      );

      // Create the PDF blob and open it
      const blob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(blob);
      const newWindow = window.open(pdfUrl, "_blank");
      if (!newWindow) {
        alert("Please allow pop-ups to view and print the PDF.");
      } else {
        newWindow.onload = function () {
          if (!/Mobi|Android/i.test(navigator.userAgent)) {
            newWindow.focus();
            newWindow.print();
          } else {
            alert(
              "PDF opened in a new tab. Use your device's options to print."
            );
          }
        };
      }
    },
    addHeader(doc) {
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

      // Dealer Details
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
          this.invoiceDetail.customer?.address?.city || "N/A"
        },${this.invoiceDetail.customer?.address?.pincode || "N/A"}`,
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
    },

    addFooter(doc) {
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
        pageHeight - 25
      );
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(
        `        Company's Bank Details
        Bank Name: Bank Of Maharashtra
        A/C No. 60038479763
        Branch & IFS Code: Bajirao Rd, Pune - 411030 & MAHB0000001`,
        105,
        pageHeight - 25,
        "left"
      );
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(
        `This is a computer-generated document and does not require any signature(s).`,
        105,
        pageHeight - 3,
        "center"
      );
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