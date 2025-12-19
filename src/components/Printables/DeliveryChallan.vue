<template>
  <div v-if="invoiceDetail"></div>
</template>
<script>
import jsPDF from "jspdf";
import "jspdf-autotable";

export default {
  props: {
    invoiceDetail: {
      type: Object,
      default: () => null,
      validator: (value) => value === null || typeof value === "object",
    },
  },

  methods: {
    formatDate(dateString) {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },

    groupProducts() {
      // First, organize products by name and width
      const organizedProducts = {};

      this.invoiceDetail.products.forEach((product) => {
        const productName = product.product.name;

        // Handle width = 0 case differently - don't include width info
        const widthStr =
          product.width === 0
            ? "no-width"
            : product.width.toFixed(2) + (product.width > 70 ? " mm" : " ''");

        if (!organizedProducts[productName]) {
          organizedProducts[productName] = {
            name: productName,
            hsn_code: product.product.hsn_code || "N/A",
            widths: {},
          };
        }

        if (!organizedProducts[productName].widths[widthStr]) {
          organizedProducts[productName].widths[widthStr] = {
            rolls: [],
            total: 0,
            hasZeroWidth: product.width === 0,
          };
        }

        // Add individual roll
        organizedProducts[productName].widths[widthStr].rolls.push({
          quantity: product.quantity.toFixed(3),
        });

        // Update width total
        organizedProducts[productName].widths[widthStr].total += parseFloat(
          product.quantity
        );
      });

      // Convert to array format for easier processing
      const groupedProducts = Object.values(organizedProducts).map(
        (product) => {
          // Calculate total quantity across all widths
          let totalQuantity = 0;
          Object.values(product.widths).forEach((width) => {
            totalQuantity += width.total;
          });

          // Count valid widths (non-zero)
          const validWidthCount = Object.values(product.widths).filter(
            (width) => !width.hasZeroWidth
          ).length;

          // Check if zero-width entries have same net weights
          Object.values(product.widths).forEach((width) => {
            if (width.hasZeroWidth && width.rolls.length > 1) {
              const firstQuantity = parseFloat(width.rolls[0].quantity);
              const allSameWeight = width.rolls.every(
                (roll) => parseFloat(roll.quantity) === firstQuantity
              );
              width.allSameWeight = allSameWeight;
              if (allSameWeight) {
                width.singleQuantity = firstQuantity;
                width.rollCount = width.rolls.length;
              }
            }
          });

          return {
            ...product,
            totalQuantity: totalQuantity.toFixed(3),
            widthCount: validWidthCount,
            rollCount: Object.values(product.widths).reduce(
              (sum, width) => sum + width.rolls.length,
              0
            ),
          };
        }
      );

      return groupedProducts;
    },

    calculateItemCounts(groupedProducts) {
      let rollCount = 0;
      let drumCount = 0;
      let canCount = 0;

      groupedProducts.forEach((product) => {
        Object.values(product.widths).forEach((data) => {
          if (data.hasZeroWidth) {
            data.rolls.forEach((roll) => {
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
      if (count === 0) return "";
      return `${count} ${count === 1 ? singular : plural}`;
    },

    createProductTableData(group, uniqueProductCount) {
      const tableData = [];

      // Create table header
      tableData.push([
        {
          content: `${group.name} - (${group.hsn_code})`,
          colSpan: 2,
          styles: {
            halign: "center",
            fontStyle: "bold",
            textColor: [0, 0, 0],
            valign: "middle",
            border: true,
            lineWidth: 0.2,
            fillColor: null,
          },
        },
      ]);

      // Only add width/net wt header row if there are non-zero width entries
      if (Object.values(group.widths).some((width) => !width.hasZeroWidth)) {
        tableData.push([
          {
            content: `Width`,
            styles: {
              halign: "center",
              fontStyle: "bold",
              textColor: [0, 0, 0],
              valign: "middle",
              border: true,
              lineWidth: 0.2,
              fillColor: null,
            },
          },
          {
            content: `Net Wt`,
            styles: {
              halign: "center",
              fontStyle: "bold",
              textColor: [0, 0, 0],
              valign: "middle",
              border: true,
              lineWidth: 0.2,
              fillColor: null,
            },
          },
        ]);
      } else {
        tableData.push([
          {
            content: `Net Wt`,
            colSpan: 2,
            styles: {
              halign: "center",
              fontStyle: "bold",
              textColor: [0, 0, 0],
              valign: "middle",
              border: true,
              lineWidth: 0.2,
              fillColor: null,
            },
          },
        ]);
      }

      // For each width, add individual rolls followed by subtotal (if needed)
      Object.entries(group.widths).forEach(([width, data]) => {
        if (data.hasZeroWidth) {
          // Check if all weights are the same for zero-width items
          if (data.allSameWeight && data.rollCount > 1) {
            // Show: "3 x 50.000 Kgs = 150.000 Kgs" format
            tableData.push([
              {
                content: `${data.rollCount} x ${data.singleQuantity.toFixed(
                  3
                )} Kgs = ${data.total.toFixed(3)} Kgs`,
                colSpan: 2,
                styles: {
                  halign: "center",
                  fontStyle: "bold",
                  textColor: [0, 0, 0],
                  fillColor: null,
                },
              },
            ]);
          } else {
            // For zero width items, show only the total weight directly (no individual rolls)
            tableData.push([
              {
                content: `${data.total.toFixed(3)} Kgs`,
                colSpan: 2,
                styles: {
                  halign: "center",
                  fontStyle: "bold",
                  textColor: [0, 0, 0],
                  fillColor: null,
                },
              },
            ]);
          }
        } else {
          // For normal width items, show both width and quantity for EACH roll
          const isSingleRoll = data.rolls.length === 1;

          for (let i = 0; i < data.rolls.length; i++) {
            const cellStyle = {
              halign: "center",
              fillColor: null,
              ...(isSingleRoll
                ? { fontStyle: "bold", textColor: [0, 0, 0] }
                : {}),
            };

            tableData.push([
              { content: width, styles: cellStyle },
              { content: `${data.rolls[i].quantity} Kgs`, styles: cellStyle },
            ]);
          }

          // Add width subtotal with proper singular/plural
          if (data.rolls.length > 1) {
            tableData.push([
              {
                content: `Total ${width} (${data.rolls.length})`,
                styles: {
                  halign: "center",
                  fontStyle: "bold",
                  textColor: [0, 0, 0],
                  fillColor: null,
                },
              },
              {
                content: `${data.total.toFixed(3)} Kgs`,
                styles: {
                  halign: "center",
                  fontStyle: "bold",
                  textColor: [0, 0, 0],
                  fillColor: null,
                },
              },
            ]);
          }
        }
      });

      // Add product grand total only if there are multiple product types
      if (uniqueProductCount > 1) {
        tableData.push([
          {
            content: `Total ${group.name}:`,
            styles: {
              halign: "center",
              fontStyle: "bold",
              textColor: [0, 0, 0],
              fillColor: null,
            },
          },
          {
            content: `${group.totalQuantity} Kgs`,
            styles: {
              halign: "center",
              fontStyle: "bold",
              textColor: [0, 0, 0],
              fillColor: null,
            },
          },
        ]);
      }

      return tableData;
    },

    addSignatureLines(doc, pageHeight, contentEndY = null) {
      const hasTransporter =
        this.invoiceDetail.transporter?.name &&
        this.invoiceDetail.transporter.name !== "By Hand" &&
        this.invoiceDetail.transporter.name.trim() !== "";

      // Calculate minimum spacing needed from last content
      const minSpacingFromContent = 10;

      if (hasTransporter) {
        // Compact minimalist design
        const boxX = 15;
        const boxWidth = 180;
        const boxHeight = 12;

        // Position box at least minSpacingFromContent below the last content
        // but not lower than pageHeight - 32
        let boxY = pageHeight - 32;
        if (contentEndY !== null) {
          const minYPosition = contentEndY + minSpacingFromContent;
          boxY = Math.max(minYPosition, pageHeight - 32);
        }

        // Simple thin border box
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(boxX, boxY, boxWidth, boxHeight, "S");

        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("BOOKING DETAILS:", 105, boxY + 5, "center");

        // Transporter name + contact in same line
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const transporterName = this.invoiceDetail.transporter.name || "N/A";
        const contact = this.invoiceDetail.transporter.phone
          ? ` | Contact: ${this.invoiceDetail.transporter.phone}`
          : "";

        const detailText = `${transporterName}${contact}`;
        doc.text(detailText, 105, boxY + 10, "center");
      } else {
        // Receiver & company signature layout
        let signatureY = pageHeight - 30;
        if (contentEndY !== null) {
          const minYPosition = contentEndY + minSpacingFromContent;
          signatureY = Math.max(minYPosition, pageHeight - 30);
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);

        doc.text("Receiver's Signature", 14, signatureY);
        doc.line(14, signatureY + 10, 80, signatureY + 10);

        doc.text("For Hemant Traders", 140, signatureY);
        doc.line(140, signatureY + 10, 200, signatureY + 10);
      }
    },

    addHeader(doc, copyType) {
      const logoPath = require("@/assets/HoloLogo.png");
      doc.addImage(logoPath, "PNG", 5, 8, 25, 25);

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

      doc.line(0, 36, 210, 36);
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

      doc.line(0, 51, 210, 51);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`(${copyType})`, 105, 56, "center");

      doc.setFontSize(12);
      doc.text(`DELIVERY CHALLAN #${this.invoiceDetail.invoiceNumber}`, 14, 62);
      doc.text(
        `Date: ${this.formatDate(this.invoiceDetail.createdAt)}`,
        200,
        62,
        "right"
      );

      // Start y position for customer details
      let y = 70;

      // CUSTOMER NAME (bold)
      doc.setFont("helvetica", "bold");
      let nameLines = doc.splitTextToSize(
        `M/s ${this.invoiceDetail.customer?.name || "N/A"}`,
        180
      );
      nameLines.forEach((line) => {
        doc.text(line, 105, y, "center");
        y += 5;
      });

      // CUSTOMER ADDRESS (normal)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      let addressText =
        `${this.invoiceDetail.customer?.address?.line1 || "N/A"}, ` +
        `${this.invoiceDetail.customer?.address?.city || "N/A"}-` +
        `${this.invoiceDetail.customer?.address?.pincode || "N/A"}`;
      let addressLines = doc.splitTextToSize(addressText, 180);
      addressLines.forEach((line) => {
        doc.text(line, 105, y, "center");
        y += 5;
      });

      // CONTACT
      let contactLines = doc.splitTextToSize(
        `Contact: ${this.invoiceDetail.customer?.phone_no || "N/A"}`,
        180
      );
      contactLines.forEach((line) => {
        doc.text(line, 105, y, "center");
        y += 5;
      });

      // GSTIN
      let gstLines = doc.splitTextToSize(
        `GSTIN/UIN: ${this.invoiceDetail.customer?.gstin || "N/A"}`,
        180
      );
      gstLines.forEach((line) => {
        doc.text(line, 105, y, "center");
        y += 5;
      });

      return y + 0; // Return new startY for the table
    },

    addFooter(
      doc,
      pageHeight,
      currentPage,
      totalPages,
      isLastPage,
      hasSignature = false
    ) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      // Add page number on all pages
      doc.text(
        `Page ${currentPage} of ${totalPages}`,
        200,
        pageHeight - 10,
        "right"
      );

      // Add Terms & Conditions only on the last page
      if (isLastPage) {
        // Position Terms & Conditions based on whether signature lines are added
        const termsYPosition = hasSignature ? pageHeight - 15 : pageHeight - 15;

        doc.text(
          `Terms & Conditions(Non Negotiable):
*Please Check the material before use. *Our responsibility ceases once the material leaves our godown. *Subject To Pune Jurisdiction
*Goods once sold will not be taken back. *Interest @24% will be charged if payments are not made before due date.`,
          14,
          termsYPosition
        );
      }
    },

    generateInvoiceCopy(doc, groupedProducts, copyType) {
      let startY = this.addHeader(doc, copyType);
      let grandTotal = 0;

      const defaultStartY = startY;
      let continuingTable = false;
      let currentProductIndex = 0;
      let isLastPage = false;

      // Track the actual page number for this copy
      let copyPageNumber = 1;
      console.log(
        `defaultStartY: ${defaultStartY}, copyPageNumber: ${copyPageNumber}, isLastPage: ${isLastPage}`
      );

      const startPageNumber = doc.internal.getNumberOfPages();

      // Process each product group
      while (currentProductIndex < groupedProducts.length) {
        const group = groupedProducts[currentProductIndex];

        // Check if there's enough space for at least the product header and one row
        const minimumSpaceRequired = 35;
        const remainingSpace = doc.internal.pageSize.height - startY - 50;

        if (!continuingTable && remainingSpace < minimumSpaceRequired) {
          // Not enough space for even starting this product, add a new page
          doc.addPage();
          copyPageNumber++;
          startY = this.addHeader(doc, copyType);
          continue; // Recheck with new page
        }

        // Create table data for this product
        const tableData = this.createProductTableData(
          group,
          groupedProducts.length
        );

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
            fillColor: null,
          },
          showHead: "everyPage",
          margin: { bottom: 15, top: 0 },
          pageBreak: "auto",
          didDrawPage: (data) => {
            // Calculate the correct page number for this copy
            const absolutePageNum = doc.internal.getNumberOfPages();
            const relativePageNum = absolutePageNum - startPageNumber + 1;
            console.log(` relativePageNum: ${relativePageNum}`);

            // When a new page is created, add the header
            const headerHeight = this.addHeader(doc, copyType);

            // Set the new margin top to be after the header
            data.settings.margin.top = headerHeight;

            // Critical fix: Update the startY for content on new pages
            if (data.pageNumber > 1) {
              data.settings.startY = headerHeight;
              copyPageNumber++;
            }

            // Check if this is the last page (we'll update this later)
            isLastPage = false;

            // Use relative page numbers for this copy
            // Note: We can't determine total pages here, will update in post-processing
          },
          tableLineColor: [0, 0, 0],
          alternateRowStyles: {
            fillColor: null,
          },
          headStyles: {
            fillColor: null,
          },
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
      const spaceNeeded = 35;
      if (doc.internal.pageSize.height - startY < spaceNeeded) {
        doc.addPage();
        copyPageNumber++;
        startY = this.addHeader(doc, copyType);
      }

      // Calculate counts for overall total
      const { rollCount, drumCount, canCount } =
        this.calculateItemCounts(groupedProducts);

      // Create the item count text with proper singular/plural
      const itemTexts = [];
      if (rollCount > 0) {
        itemTexts.push(this.formatItemCount(rollCount, "Roll", "Rolls"));
      }
      if (drumCount > 0) {
        itemTexts.push(this.formatItemCount(drumCount, "Drum", "Drums"));
      }
      if (canCount > 0) {
        itemTexts.push(this.formatItemCount(canCount, "Can", "Cans"));
      }

      const itemCountText = itemTexts.join(", ");

      // Add some spacing before the total
      startY += 8;

      // Add a border around the total for better visibility
      const boxX = 20;
      const boxY = startY;
      const boxWidth = 170;
      const boxHeight = 16;

      // Draw background box
      doc.setFillColor(255, 255, 255);
      doc.rect(boxX, boxY, boxWidth, boxHeight, "F");

      // Draw border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(boxX, boxY, boxWidth, boxHeight, "S");

      // Add the text
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);

      const overallTotalText = `Overall Total: ${grandTotal.toFixed(
        3
      )} Kgs FOR ${itemCountText}`;
      doc.text(overallTotalText, 105, startY + 10, "center");

      // Add signature lines with proper spacing
      this.addSignatureLines(doc, doc.internal.pageSize.height);

      // Mark this as the last page of this copy
      isLastPage = true;

      // Calculate total pages for this copy
      const endPageNumber = doc.internal.getNumberOfPages();
      const totalPagesInCopy = endPageNumber - startPageNumber + 1;

      // Now go back and add footers to all pages in this copy with correct page numbers
      for (let i = startPageNumber; i <= endPageNumber; i++) {
        doc.setPage(i);
        const pageNum = i - startPageNumber + 1;
        const isLast = i === endPageNumber;
        const hasSignature =
          this.invoiceDetail.transporter?.name &&
          this.invoiceDetail.transporter.name !== "By Hand" &&
          this.invoiceDetail.transporter.name.trim() !== "";

        this.addFooter(
          doc,
          doc.internal.pageSize.height,
          pageNum,
          totalPagesInCopy,
          isLast,
          hasSignature
        );
      }

      // Return to the last page
      doc.setPage(endPageNumber);
    },

    // NEW: Reusable method to create PDF document
    createPdfDocument() {
      if (!this.invoiceDetail) {
        throw new Error("Invoice details are not available.");
      } else if (this.invoiceDetail.products.length === 0) {
        throw new Error("No products found in the invoice.");
      }

      const doc = new jsPDF();
      const groupedProducts = this.groupProducts();

      // Generate first copy (Original For Recipient)
      this.generateInvoiceCopy(doc, groupedProducts, "Original For Recipient");

      // Add a page break
      doc.addPage();

      // Generate second copy (Duplicate For Supplier)
      this.generateInvoiceCopy(doc, groupedProducts, "Duplicate For Supplier");

      return doc;
    },

    // Original download method now uses the reusable createPdfDocument
    downloadPdf() {
      try {
        const doc = this.createPdfDocument();

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
      } catch (error) {
        console.error("PDF generation error:", error);
        alert(error.message);
      }
    },

    // NEW: Method to get PDF as blob for email
    getPdfBlob() {
      const doc = this.createPdfDocument();
      return doc.output("blob");
    },

    // NEW: Method to get PDF as blob with custom filename
    getPdfBlobWithName() {
      const doc = this.createPdfDocument();
      const filename = `Delivery_Challan_${this.invoiceDetail.invoiceNumber}.pdf`;
      return {
        blob: doc.output("blob"),
        filename: filename,
      };
    },

    calculateTableHeight(tableData) {
      // Approximation of height required for a table
      // Header row (10mm) + data rows (8mm each) + buffer (10mm)
      return 10 + tableData.length * 10 + 10;
    },
  },
};
</script>
