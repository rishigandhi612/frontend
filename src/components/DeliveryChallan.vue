<template>
  <div v-if="invoiceDetail">
  </div>
</template>
<script>
import jsPDF from "jspdf";
import "jspdf-autotable";

export default {
props: {
  invoiceDetail: {
    type: Object,
    default: () => null, // Provide a default value
    validator: (value) => value === null || typeof value === 'object'
  }
},

methods: {
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  },

  groupProducts() {
    // First, organize products by name and width
    const organizedProducts = {};
    
    this.invoiceDetail.products.forEach(product => {
      const productName = product.product.name;
      
      // Handle width = 0 case differently - don't include width info
      const widthStr = product.width === 0 ? "no-width" : 
                      (product.width.toFixed(2) + (product.width > 70 ? " mm" : " ''"));
      
      if (!organizedProducts[productName]) {
        organizedProducts[productName] = {
          name: productName,
          hsn_code: product.product.hsn_code || "N/A",
          widths: {}
        };
      }
      
      if (!organizedProducts[productName].widths[widthStr]) {
        organizedProducts[productName].widths[widthStr] = {
          rolls: [],
          total: 0,
          hasZeroWidth: product.width === 0
        };
      }
      
      // Add individual roll
      organizedProducts[productName].widths[widthStr].rolls.push({
        quantity: product.quantity.toFixed(3)
      });
      
      // Update width total
      organizedProducts[productName].widths[widthStr].total += parseFloat(product.quantity);
    });
    
    // Convert to array format for easier processing
    const groupedProducts = Object.values(organizedProducts).map(product => {
      // Calculate total quantity across all widths
      let totalQuantity = 0;
      Object.values(product.widths).forEach(width => {
        totalQuantity += width.total;
      });
      
      // Count valid widths (non-zero)
      const validWidthCount = Object.values(product.widths).filter(width => !width.hasZeroWidth).length;
      
      return {
        ...product,
        totalQuantity: totalQuantity.toFixed(3),
        // Count how many widths exist for this product (excluding 0 width entries)
        widthCount: validWidthCount,
        // Count total number of rolls for this product
        rollCount: Object.values(product.widths).reduce((sum, width) => sum + width.rolls.length, 0)
      };
    });
    
    return groupedProducts;
  },

  downloadPdf() {
    if (!this.invoiceDetail) {
      alert('Invoice details are not available.');
      return;
    }
    const doc = new jsPDF();
    const groupedProducts = this.groupProducts();
    
    // Generate first copy (Original For Recipient)
    this.generateInvoiceCopy(doc, groupedProducts, "Original For Recipient");
    
    // Add a page break
    doc.addPage();
    
    // Generate second copy (Duplicate For Supplier)
    this.generateInvoiceCopy(doc, groupedProducts, "Duplicate For Supplier");
    
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
          alert("PDF opened in a new tab. Use your device's options to print.");
        }
      };
    }
  },
  
  generateInvoiceCopy(doc, groupedProducts, copyType) {
    let startY = this.addHeader(doc, copyType);
    let grandTotal = 0;
    
    // Count how many unique product types there are
    const uniqueProductCount = groupedProducts.length;

    groupedProducts.forEach((group, index) => {
      if (index !== 0 && startY + 50 > doc.internal.pageSize.height - 50) {
        doc.addPage();
        startY = this.addHeader(doc, copyType);
      }

      // Create table header
      const tableData = [
        [{ content: `${group.name} - (${group.hsn_code})`, colSpan: 2, styles: { halign: "center", fontStyle: "bold",
        textColor: [0, 0, 0], valign: 'middle', border: true, lineWidth: 0.2, fillColor: null } }]
      ];
      
      // Only add width/net wt header row if there are non-zero width entries
      if (Object.values(group.widths).some(width => !width.hasZeroWidth)) {
        tableData.push([
          { content: `Width`, styles: { halign: "center", fontStyle: "bold",
          textColor: [0, 0, 0], valign: 'middle', border: true, lineWidth: 0.2, fillColor: null } },
          { content: `Net Wt`, styles: { halign: "center", fontStyle: "bold",
          textColor: [0, 0, 0], valign: 'middle', border: true, lineWidth: 0.2, fillColor: null } }
        ]);
      } else {
        tableData.push([
          { content: `Net Wt`, colSpan: 2, styles: { halign: "center", fontStyle: "bold",
          textColor: [0, 0, 0], valign: 'middle', border: true, lineWidth: 0.2, fillColor: null } }
        ]);
      }

      // For each width, add individual rolls followed by subtotal (if needed)
      Object.entries(group.widths).forEach(([width, data]) => {
        if (data.hasZeroWidth) {
          // For zero width items, only show quantity without width column
          for (let i = 0; i < data.rolls.length; i++) {
            tableData.push([
              { content: `${data.rolls[i].quantity} Kgs`, colSpan: 2, styles: { halign: "center", fillColor: null } }
            ]);
          }
          
          // Add width subtotal only if there are multiple rolls
          if (data.rolls.length > 1) {
            tableData.push([
              { content: `Total:`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], fillColor: null } }
            ]);
            tableData.push([
              { content: `${data.total.toFixed(3)} Kgs`, colSpan: 2, styles: { halign: "center", fontStyle: "bold", textColor: [0, 0, 0], fillColor: null } }
            ]);
          }
        } else {
          // For normal width items, show both width and quantity
          // Add the width in the first row of this section
          tableData.push([
            { content: width, rowSpan: data.rolls.length, styles: { valign: "middle", halign: "center", fillColor: null } },
            { content: `${data.rolls[0].quantity} Kgs`, styles: { halign: "center", fillColor: null } }
          ]);
          
          // Add remaining rolls for this width (starting from index 1)
          for (let i = 1; i < data.rolls.length; i++) {
            tableData.push([
              { content: `${data.rolls[i].quantity} Kgs`, styles: { halign: "center", fillColor: null } }
            ]);
          }
          
          // Add width subtotal only if there are multiple rolls for this width
          if (data.rolls.length > 1) {
            tableData.push([
              { content: `Total for ${width}:`, styles: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], fillColor: null } },
              { content: `${data.total.toFixed(3)} Kgs`, styles: { halign: "center", fontStyle: "bold", textColor: [0, 0, 0], fillColor: null } }
            ]);
          }
        }
      });
      
      // Add product grand total only if there are multiple product types
      // This addresses requirement #3
      if (uniqueProductCount > 1) {
        tableData.push([
          { content: `Total ${group.name}:`, styles: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], fillColor: null } },
          { content: `${group.totalQuantity} Kgs`, styles: { halign: "center", fontStyle: "bold", textColor: [0, 0, 0], fillColor: null } }
        ]);
      }

      grandTotal += parseFloat(group.totalQuantity);

      doc.autoTable({
        body: tableData,
        startY: startY,
        styles: { 
          fontSize: 12, 
          cellPadding: 2, 
          halign: "center", 
          lineWidth: 0.2, 
          textColor: [0, 0, 0],
          fillColor: null 
        },
        margin: { bottom: 0, top: 0 }, // Remove vertical margins
        pageBreak: "auto",
        didDrawPage: (data) => {
          this.addHeader(doc, copyType);
          this.addFooter(doc, doc.internal.pageSize.height, data.pageNumber, data.table.pageCount);
        },
        // Ensure no alternating row colors
        tableLineColor: [0, 0, 0],
        alternateRowStyles: {
          fillColor: null  // Remove alternating row colors
        },
        headerStyles: {
          fillColor: null  // Remove header background color
        }
      });

      // Removed the +10 spacing between tables
      startY = doc.lastAutoTable.finalY;
    });

    // Add overall grand total of all products
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Overall Total: ${grandTotal.toFixed(3)} Kgs`, 105, startY + 10, "center");

    this.addSignatureLines(doc, doc.internal.pageSize.height);
  },

  addSignatureLines(doc, pageHeight) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Receiver's Signature", 14, pageHeight - 25);
    doc.line(14, pageHeight - 15, 80, pageHeight - 15);
    doc.text("For Hemant Traders", 140, pageHeight - 25);
    doc.line(140, pageHeight - 15, 200, pageHeight - 15);
  },

  addHeader(doc, copyType) {
    const logoPath = require("@/assets/HoloLogo.png");
    doc.addImage(logoPath, "PNG", 5, 8, 25, 25);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("HEMANT TRADERS", 105, 20, "center");
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("1281, Sadashiv Peth, Vertex Arcade, Pune - 411030", 105, 25, "center");
    doc.text("Contact: (+91) 9422080922 / 9420699675    Web: hemanttraders.vercel.app", 105, 32, "center");
    doc.line(0, 36, 210, 36);
    doc.text("Dealers in BOPP, POLYESTER, PVC, THERMAL Films", 105, 42, "center");
    doc.text("Adhesives for Lamination, Bookbinding, and Pasting, UV Coats", 105, 48, "center");
    doc.line(0, 51, 210, 51);
    doc.setFontSize(12);
    doc.text(`(${copyType})`, 105, 56, "center");

    doc.setFontSize(12);
    doc.text(`DELIVERY CHALLAN #${this.invoiceDetail.invoiceNumber}`, 14, 62);
    doc.text(`Date: ${this.formatDate(this.invoiceDetail.createdAt)}`, 200, 62, "right");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`M/s ${this.invoiceDetail.customer?.name || "N/A"}`, 105, 70, "center");
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${this.invoiceDetail.customer?.address?.line1 || "N/A"}, ${this.invoiceDetail.customer?.address?.city || "N/A"}-${this.invoiceDetail.customer?.address?.pincode || "N/A"}`,
      105,
      75,
      "center"
    );
    doc.text(`Contact: ${this.invoiceDetail.customer?.phone_no || "N/A"}`, 105, 80, "center");
    doc.text(`GSTIN/UIN: ${this.invoiceDetail.customer?.gstin || "N/A"}`, 105, 85, "center");
    doc.text(`Dispatch through: ${this.invoiceDetail.transporter || "N/A"}`, 105, 90, "center");

    return 100; // Return the new startY for the table
  },

  addFooter(doc, pageHeight, currentPage, totalPages) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    // Add page number on all pages
    doc.text(`Page ${currentPage} of ${totalPages}`, 200, pageHeight - 10, "right");

    // Add Terms & Conditions only on the last page
    if (currentPage === totalPages) {
      doc.text(
        `Terms & Conditions(Non Negotiable):
*Please Check the material before use. *Our responsibility ceases once the material leaves our godown. *Subject To Pune Jurisdiction 
*Goods once sold will not be taken back. *Interest @24% will be charged if payments are not made before due date.`,
        14,
        pageHeight - 35
      );
    }
  }
},
};
</script>