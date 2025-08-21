<template>
  <v-container> </v-container>
</template>

<script>
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toWords } from "number-to-words";

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

    // Helper function to split text into multiple lines based on width
    splitTextToFitWidth(doc, text, maxWidth, fontSize = 12) {
      doc.setFontSize(fontSize);
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";

      for (let word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = doc.getTextWidth(testLine);

        if (textWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // If single word is too long, break it at character level
            let remainingWord = word;
            while (remainingWord.length > 0) {
              let charCount = 1;
              while (
                charCount <= remainingWord.length &&
                doc.getTextWidth(remainingWord.substring(0, charCount)) <=
                  maxWidth
              ) {
                charCount++;
              }
              lines.push(remainingWord.substring(0, charCount - 1));
              remainingWord = remainingWord.substring(charCount - 1);
            }
          }
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    },

    // Function to calculate the total height needed for the header
    calculateHeaderHeight(doc) {
      // Base header elements height (static parts)
      let currentY = 56; // Starting from the static header elements

      // Calculate customer name height
      const customerName = `M/s ${this.invoiceDetail.customer?.name || "N/A"}`;
      const nameLines = this.splitTextToFitWidth(doc, customerName, 180, 12);
      currentY += nameLines.length * 5; // 5 is line height for customer name

      // Calculate address height
      const addressText = `${
        this.invoiceDetail.customer?.address?.line1 || "N/A"
      }, ${this.invoiceDetail.customer?.address?.city || "N/A"},${
        this.invoiceDetail.customer?.address?.pincode || "N/A"
      }`;
      const addressLines = this.splitTextToFitWidth(doc, addressText, 180, 12);
      currentY += addressLines.length * 5; // 5 is line height for address

      // Add space for other fixed elements (phone, GSTIN, dispatch)
      currentY += 15; // 3 lines * 5 line height each

      return {
        height: currentY,
        nameLines: nameLines.length,
        addressLines: addressLines.length,
      };
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

      // Dynamic customer name handling
      let currentY = 70;
      const customerName = `M/s ${this.invoiceDetail.customer?.name || "N/A"}`;
      const nameLines = this.splitTextToFitWidth(doc, customerName, 180, 12);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      nameLines.forEach((line, index) => {
        doc.text(line, 105, currentY + index * 5, "center");
      });
      currentY += nameLines.length * 5;

      // Dynamic address handling
      const addressText = `${
        this.invoiceDetail.customer?.address?.line1 || "N/A"
      }, ${this.invoiceDetail.customer?.address?.city || "N/A"},${
        this.invoiceDetail.customer?.address?.pincode || "N/A"
      }`;
      const addressLines = this.splitTextToFitWidth(doc, addressText, 180, 12);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      addressLines.forEach((line, index) => {
        doc.text(line, 105, currentY + index * 5, "center");
      });
      currentY += addressLines.length * 5;

      // Contact, GSTIN, and Dispatch info (these typically don't need wrapping but can be made dynamic too if needed)
      doc.text(
        `Contact: ${this.invoiceDetail.customer?.phone_no || "N/A"}`,
        105,
        currentY,
        "center"
      );
      currentY += 5;

      doc.text(
        `GSTIN/UIN: ${this.invoiceDetail.customer?.gstin || "N/A"}`,
        105,
        currentY,
        "center"
      );
      currentY += 5;

      doc.text(
        `Dispatch through: ${this.invoiceDetail.transporter?.name || "N/A"}`,
        105,
        currentY,
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
        `        Company's GSTIN: 27AAVPG7824M1ZX
        
        Company's Bank Details
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

    // NEW: Reusable method to create PDF document (extracted from downloadPdf)
    createPdfDocument() {
      const doc = new jsPDF();

      // Calculate dynamic start position for the table based on header height
      const headerInfo = this.calculateHeaderHeight(doc);
      const tableStartY = headerInfo.height + 15;

      // Step 1: First aggregation by name-hsn-width (same as before)
      const initialAggregation = this.invoiceDetail.products.reduce(
        (acc, product) => {
          const key = `${product.product.name}-${product.product.hsn_code}-${product.width}`;
          if (!acc[key]) {
            acc[key] = {
              ...product,
              quantity: 0,
              nos: 0,
            };
          }
          acc[key].quantity += product.quantity;
          acc[key].nos += 1;
          return acc;
        },
        {}
      );

      // Step 2: Group by product name and HSN to check width count
      const productGroups = {};
      Object.values(initialAggregation).forEach((product) => {
        const groupKey = `${product.product.name}-${product.product.hsn_code}`;
        if (!productGroups[groupKey]) {
          productGroups[groupKey] = [];
        }
        productGroups[groupKey].push(product);
      });

      // Step 3: Final aggregation - merge if 4+ different widths
      const finalAggregatedProducts = {};
      Object.entries(productGroups).forEach(([groupKey, products]) => {
        if (products.length >= 4) {
          const mergedProduct = {
            product: products[0].product,
            width: "DIFF",
            unit_price: products[0].unit_price,
            quantity: products.reduce((sum, p) => sum + p.quantity, 0),
            nos: products.reduce((sum, p) => sum + p.nos, 0),
          };
          finalAggregatedProducts[groupKey] = mergedProduct;
        } else {
          products.forEach((product, index) => {
            const key = `${groupKey}-${index}`;
            finalAggregatedProducts[key] = product;
          });
        }
      });

      // Step 4: Create products array for the table
      const products = Object.values(finalAggregatedProducts).map((product) => [
        product.product.name,
        product.product.hsn_code || "N/A",
        product.width === "DIFF"
          ? "DIFF"
          : product.width + (product.width > 70 ? " mm " : "''"),
        product.nos,
        `${product.quantity.toFixed(3)} Kgs`,
        `Rs.${product.unit_price.toFixed(2)}`,
        `Rs.${(product.quantity * product.unit_price).toFixed(2)}`,
      ]);

      // Calculate totals
      const totalNos = Object.values(finalAggregatedProducts).reduce(
        (total, product) => total + product.nos,
        0
      );
      const totalQuantity = Object.values(finalAggregatedProducts)
        .reduce((total, product) => total + product.quantity, 0)
        .toFixed(3);

      // Add summary rows
      products.push(["", "", "", "", "", "", ""]);
      products.push([
        "",
        "",
        "",
        "",
        "",
        "Sub Total",
        `Rs.${this.invoiceDetail.totalAmount.toFixed(2)}`,
      ]);

      if (this.invoiceDetail.otherCharges !== 0) {
        products.push([
          "add:",
          "",
          "",
          "",
          "",
          "Other Charges",
          `Rs.${this.invoiceDetail.otherCharges.toFixed(2)}`,
        ]);
      }

      // Add tax rows
      if (this.invoiceDetail.cgst > 0 || this.invoiceDetail.sgst > 0) {
        products.push([
          "add:",
          "",
          "",
          "",
          "",
          "CGST @ 9%",
          `Rs.${this.invoiceDetail.cgst.toFixed(2)}`,
        ]);
        products.push([
          "add:",
          "",
          "",
          "",
          "",
          "SGST @ 9%",
          `Rs.${this.invoiceDetail.sgst.toFixed(2)}`,
        ]);
      }

      if (this.invoiceDetail.igst > 0) {
        products.push([
          "add:",
          "",
          "",
          "",
          "",
          "IGST @ 18%",
          `Rs.${this.invoiceDetail.igst.toFixed(2)}`,
        ]);
      }

      products.push([
        "Grand Total",
        "",
        "",
        totalNos,
        `${totalQuantity} Kgs`,
        "",
        `Rs.${this.invoiceDetail.grandTotal.toFixed(2)}`,
      ]);

      // Render the product table
      doc.autoTable({
        startY: tableStartY,
        head: [
          [
            "Product Name",
            "HSN/SAC",
            "Width",
            "Nos",
            "Quantity",
            "Rate",
            "Amount",
          ],
        ],
        body: products,
        styles: {
          fontSize: 10,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          border: true,
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          halign: "center",
          valign: "middle",
          border: false,
        },
        didDrawPage: () => {
          this.addHeader(doc);
          this.addFooter(doc, doc.internal.pageSize.height);
        },
        didParseCell: function (data) {
          if (data.section === "body") {
            if (data.column.index === 3 || data.column.index === 5) {
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        tableLineWidth: 0.1,
        tableLineColor: [0, 0, 0],
      });

      // Add amount in words and HSN summary
      doc.setFontSize(10);
      let amountTextY = doc.lastAutoTable.finalY + 7;

      const availableHeight =
        doc.internal.pageSize.height - doc.lastAutoTable.finalY - 40;
      let newPageAddedForHSN = false;

      if (availableHeight < 50) {
        doc.addPage();
        this.addHeader(doc);
        newPageAddedForHSN = true;
        amountTextY = this.calculateHeaderHeight(doc).height + 10;
      }

      const amountText = "AMOUNT CHARGEABLE (in words):";
      doc.text(amountText, 14, amountTextY);

      // HSN Summary
      const hsnSummary = this.invoiceDetail.products.reduce(
        (summary, product) => {
          const hsn = product.product.hsn_code || "N/A";
          if (!summary[hsn]) {
            summary[hsn] = { amount: 0, cgst: 0, sgst: 0, igst: 0 };
          }
          const amount = parseFloat(product.quantity * product.unit_price);
          summary[hsn].amount += amount;

          if (this.invoiceDetail.igst > 0) {
            const igstRate = 0.18;
            summary[hsn].igst += amount * igstRate;
          } else {
            const cgstRate = 0.09;
            const sgstRate = 0.09;
            summary[hsn].cgst += amount * cgstRate;
            summary[hsn].sgst += amount * sgstRate;
          }

          return summary;
        },
        {}
      );

      let hsnSummaryData = [];
      let hsnTableHeaders = [];

      if (this.invoiceDetail.igst > 0) {
        hsnTableHeaders = [["HSN/SAC", "Integrated Tax"]];
        hsnSummaryData = Object.keys(hsnSummary).map((hsn) => [
          hsn,
          `Rs.${hsnSummary[hsn].igst.toFixed(2)}`,
        ]);
      } else {
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

      // Render HSN Summary Table
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + (availableHeight < 50 ? 10 : 18),
        head: hsnTableHeaders,
        body: hsnSummaryData,
        styles: {
          cellPadding: 1,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "right",
          valign: "middle",
          border: true,
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          halign: "right",
          valign: "middle",
          border: false,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },
        didDrawPage: () => {
          if (newPageAddedForHSN) {
            this.addFooter(doc, doc.internal.pageSize.height);
          }
        },
      });

      // Tax amount in words
      let totalTaxAmount = 0;
      if (this.invoiceDetail.igst > 0) {
        totalTaxAmount = this.invoiceDetail.igst;
      } else {
        totalTaxAmount = this.invoiceDetail.cgst + this.invoiceDetail.sgst;
      }

      const totalTaxInWords = toWords(Math.round(totalTaxAmount)).toUpperCase();

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Tax Amount(in words):`, 14, doc.lastAutoTable.finalY + 7);
      doc.setFont("helvetica", "bold");
      doc.text(
        `INR ${totalTaxInWords} Only`,
        14,
        doc.lastAutoTable.finalY + 14
      );

      return doc;
    },

    // Original download method now uses the reusable createPdfDocument
    downloadPdf() {
      const doc = this.createPdfDocument();

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

    // NEW: Method to get PDF as blob for email
    getPdfBlob() {
      const doc = this.createPdfDocument();
      return doc.output("blob");
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
