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
    
    calculateItemCounts(groupedProducts) {
      let rollCount = 0;
      let drumCount = 0;
      let canCount = 0;

      groupedProducts.forEach(product => {
        Object.values(product.widths).forEach(data => {
          if (data.hasZeroWidth) {
            data.rolls.forEach(roll => {
              const quantity = parseFloat(roll.quantity);
              if (quantity === 50) {
                drumCount++;
              } else if (quantity === 5) {
                canCount++;
              } else {
                rollCount++;
              }
            });
          } else {
            rollCount += data.rolls.length;
          }
        });
      });

      return { rollCount, drumCount, canCount };
    },

    // Helper method to format singular/plural text
    formatItemCount(count, singular, plural) {
      if (count === 0) return '';
      return `${count} ${count === 1 ? singular : plural}`;
    },
    
    generateInvoiceCopy(doc, groupedProducts, copyType) {
      let startY = this.addHeader(doc, copyType);
      let grandTotal = 0;
      
      const defaultStartY = startY;
    
      // Count how many unique product types there are
      const uniqueProductCount = groupedProducts.length;
      
      // Track if we're continuing a table from previous page
      let continuingTable = false;
      let currentProductIndex = 0;
      
      // Flag to indicate if we're on the last page (will be set before adding footer)
      let isLastPage = false;

      // Process each product group
      while (currentProductIndex < groupedProducts.length) {
        const group = groupedProducts[currentProductIndex];
        
        // Check if there's enough space for at least the product header and one row
        const minimumSpaceRequired = 35;
        const remainingSpace = doc.internal.pageSize.height - startY - 50;
        
        if (!continuingTable && remainingSpace < minimumSpaceRequired) {
          // Not enough space for even starting this product, add a new page
          doc.addPage();
          startY = this.addHeader(doc, copyType);
          continue; // Recheck with new page
        }

        // Create table data for this product
        const tableData = this.createProductTableData(group, uniqueProductCount);
        
        // Configure table options with pagination handling
        const tableOptions = {
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
          margin: { bottom: 15, top: 0 },
          pageBreak: "auto",
          didDrawPage: (data) => {
            // When a new page is created, add the header
            const headerHeight = this.addHeader(doc, copyType);
            
            // Set the new margin top to be after the header
            data.settings.margin.top = headerHeight;
            
            // Critical fix: Update the startY for content on new pages
            if (data.pageNumber > 1) {
              data.settings.startY = headerHeight;
            }
            
            // Check if this is the last page
            isLastPage = data.pageNumber === data.pageCount;
            
            // Pass the isLastPage flag to the footer function
            this.addFooter(doc, doc.internal.pageSize.height, data.pageNumber, data.pageCount, isLastPage);
          },
          didParseCell: function(data) {
            // Ensure the cell starts after the header on new pages
            if (data.pageCount > 1 && data.row.index === 0 && data.section === 'body') {
              data.cell.y = defaultStartY;
            }
          },
          didDrawCell: (data) => {
            // Add a "Continued..." indicator at the bottom of a table that will continue on next page
            if (data.row.index === data.table.body.length - 1 && 
                data.table.pageCount < data.table.finalY / data.settings.pagesplit) {
              doc.setFontSize(10);
              doc.setFont("helvetica", "italic");
              doc.text("(Continued on next page...)", 105, data.cell.y + data.cell.height + 5, "center");
            }
            
            // Add a "Continued from previous page" indicator at the top of continued tables
            if (data.row.index === 0 && data.pageCount > 1 && data.pageNumber > 1) {
              doc.setFontSize(10);
              doc.setFont("helvetica", "italic");
              doc.text("(Continued from previous page)", 105, data.cell.y - 5, "center");
            }
          },
          willDrawCell: (data) => {
            // Check if this cell will fit on the current page or needs to be moved to next page
            const cellBottom = data.cell.y + data.cell.height;
            const pageHeight = doc.internal.pageSize.height;
            const footerHeight = 50;
            
            if (cellBottom > pageHeight - footerHeight) {
              // This cell doesn't fit, set a flag for the current row to be moved to next page
              data.row.moveToNextPage = true;
            }
          },
          // Ensure no alternating row colors
          tableLineColor: [0, 0, 0],
          alternateRowStyles: {
            fillColor: null
          },
          headStyles : {
            fillColor: null
          }
        };

        // Draw the table
        doc.autoTable(tableOptions);
        
        // Update counter and position
        grandTotal += parseFloat(group.totalQuantity);
        startY = doc.lastAutoTable.finalY;
        currentProductIndex++;
        continuingTable = false;
      }

      // Add overall grand total of all products
      // Check if there's enough space for the grand total (needs about 25mm for proper visibility)
      const spaceNeeded = 35; // Increased space for better visibility
      if (doc.internal.pageSize.height - startY < spaceNeeded) {
        doc.addPage();
        startY = this.addHeader(doc, copyType);
        // We're definitely on the last page now
        isLastPage = true;
      }
      
      // Calculate counts for overall total
      const { rollCount, drumCount, canCount } = this.calculateItemCounts(groupedProducts);
      
      // Create the item count text with proper singular/plural
      const itemTexts = [];
      if (rollCount > 0) {
        itemTexts.push(this.formatItemCount(rollCount, 'Roll', 'Rolls'));
      }
      if (drumCount > 0) {
        itemTexts.push(this.formatItemCount(drumCount, 'Drum', 'Drums'));
      }
      if (canCount > 0) {
        itemTexts.push(this.formatItemCount(canCount, 'Can', 'Cans'));
      }
      
      const itemCountText = itemTexts.join(', ');
      
      // Add some spacing before the total
      startY += 8;
      
      // Add a border around the total for better visibility
      const boxX = 20;
      const boxY = startY;
      const boxWidth = 170;
      const boxHeight = 16;
      
      // Draw background box
      doc.setFillColor(255,255,255); // Light gray background
      doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
      
      // Draw border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(boxX, boxY, boxWidth, boxHeight, 'S');
      
      // Add the text
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      
      const overallTotalText = `Overall Total: ${grandTotal.toFixed(3)} Kgs FOR ${itemCountText}`;
      doc.text(overallTotalText, 105, startY + 10, "center");

      // Add signature lines with proper spacing
      this.addSignatureLines(doc, doc.internal.pageSize.height);
    },
    
    createProductTableData(group, uniqueProductCount) {
      const tableData = [];
      
      // Create table header
      tableData.push([
        { content: `${group.name} - (${group.hsn_code})`, colSpan: 2, styles: { halign: "center", fontStyle: "bold",
        textColor: [0, 0, 0], valign: 'middle', border: true, lineWidth: 0.2, fillColor: null } }
      ]);
      
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
  const isSingleRoll = data.rolls.length === 1;
  const cellStyle = {
    halign: "center",
    fillColor: null,
    ...(isSingleRoll ? { fontStyle: "bold", textColor: [0, 0, 0] } : {})
  };

  tableData.push([
    { content: `${data.rolls[i].quantity} Kgs`, colSpan: 2, styles: cellStyle }
  ]);
}


          
          // Add width subtotal with proper singular/plural
          if (data.rolls.length > 1) {
            // const rollText = data.rolls.length === 1 ? 'roll' : 'rolls';
         
            tableData.push([
              { content: `Total (${data.rolls.length})`, styles: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], fillColor: null } },
              { content: `${data.total.toFixed(3)} Kgs`, styles: { halign: "center", fontStyle: "bold", textColor: [0, 0, 0], fillColor: null } }
            ]);
          }
        } else {
          // For normal width items, show both width and quantity for EACH roll
          for (let i = 0; i < data.rolls.length; i++) {
            tableData.push([
              { content: width, styles: { halign: "center", fillColor: null } },
              { content: `${data.rolls[i].quantity} Kgs`, styles: { halign: "center", fillColor: null } }
            ]);
          }
          
          // Add width subtotal with proper singular/plural
          if (data.rolls.length > 1) {
            const rollText = data.rolls.length === 1 ? 'roll' : 'rolls';
            tableData.push([
              { content: `Total ${width} (${data.rolls.length} ${rollText})`, styles: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], fillColor: null } },
              { content: `${data.total.toFixed(3)} Kgs`, styles: { halign: "center", fontStyle: "bold", textColor: [0, 0, 0], fillColor: null } }
            ]);
          }
        }
      });
      
      // Add product grand total only if there are multiple product types
      if (uniqueProductCount > 1) {
        tableData.push([
          { content: `Total ${group.name}:`, styles: { halign: 'center', fontStyle: 'bold', textColor: [0, 0, 0], fillColor: null } },
          { content: `${group.totalQuantity} Kgs`, styles: { halign: "center", fontStyle: "bold", textColor: [0, 0, 0], fillColor: null } }
        ]);
      }
      
      return tableData;
    },

    addSignatureLines(doc, pageHeight) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Receiver's Signature", 14, pageHeight - 25);
      doc.line(10, pageHeight - 18, 80, pageHeight - 18);
      doc.text("For Hemant Traders", 140, pageHeight - 25);
      doc.line(140, pageHeight - 18, 200, pageHeight - 18);
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

    addFooter(doc, pageHeight, currentPage, totalPages, isLastPage, hasSignature = false) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      // Add page number on all pages
      doc.text(`Page ${currentPage} of ${totalPages}`, 200, pageHeight - 10, "right");

      // Add Terms & Conditions only on the last page
      if (isLastPage) {
        // Position Terms & Conditions based on whether signature lines are added
        const termsYPosition = hasSignature ? pageHeight - 30 : pageHeight - 15;
        
        doc.text(
          `Terms & Conditions(Non Negotiable):
*Please Check the material before use. *Our responsibility ceases once the material leaves our godown. *Subject To Pune Jurisdiction 
*Goods once sold will not be taken back. *Interest @24% will be charged if payments are not made before due date.`,
          14,
          termsYPosition
        );
      }
    },
    
    calculateTableHeight(tableData) {
      // Approximation of height required for a table
      // Header row (10mm) + data rows (8mm each) + buffer (10mm)
      return 10 + (tableData.length * 10) + 10;
    }
  },
};
</script>