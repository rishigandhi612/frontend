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
      const groupedProducts = this.invoiceDetail.products.reduce((acc, product) => {
        const existingProduct = acc.find((p) => p.name === product.product.name);

        if (existingProduct) {
          existingProduct.details.push({
            width: product.width.toFixed(2) + (product.width > 70 ? " mm" : " ''"),
            quantity: product.quantity.toFixed(3),
          });
        } else {
          acc.push({
            name: product.product.name,
            hsn_code: product.product.hsn_code || "N/A",
            details: [
              {
                width: product.width.toFixed(2) + (product.width > 70 ? " mm" : " ''"),
                quantity: product.quantity.toFixed(3),
              },
            ],
          });
        }
        return acc;
      }, []);

      return groupedProducts;
    },

    downloadPdf() {
        if (!this.invoiceDetail) {
        alert('Invoice details are not available.');
        return;
      }
      const doc = new jsPDF();
      const groupedProducts = this.groupProducts();

      let startY = this.addHeader(doc); // Ensure header appears first

      groupedProducts.forEach((group, index) => {
        if (index !== 0 && startY + 50 > doc.internal.pageSize.height - 50) {
          doc.addPage();
          startY = this.addHeader(doc); // Ensure header appears on new pages
        }

        const tableData = [
          [{ content: `${group.name} - (${group.hsn_code})`, colSpan: 2, styles: { halign: "center", fontStyle: "bold",fillColor: [255, 255, 255],
          textColor: [0, 0, 0], valign: 'middle', border: true, lineWidth: 0.2, lineColor: [0, 0, 0] } }],
          [
            { content: `Width`, styles: { halign: "center", fontStyle: "bold" ,   fillColor: [255, 255, 255],
          textColor: [0, 0, 0], valign: 'middle', border: true, lineWidth: 0.2, lineColor: [0, 0, 0]} },
            { content: `Net Wt`, styles: { halign: "center", fontStyle: "bold",   fillColor: [255, 255, 255],
            textColor: [0, 0, 0], valign: 'middle', border: true, lineWidth: 0.2, lineColor: [0, 0, 0] } },
          ],
          ...group.details.map((detail) => [detail.width, `${detail.quantity} Kgs`]),
          [
            { content: `Total:`, styles: { halign: 'center', fontStyle: 'bold',textColor: [0, 0, 0] } },
            {
              content: `${group.details.reduce((sum, detail) => sum + parseFloat(detail.quantity), 0).toFixed(3)} Kgs`,
              styles: { halign: "center", fontStyle: "bold",textColor: [0, 0, 0] },
            },
          ],
        ];

        doc.autoTable({
          body: tableData,
          startY: startY,
          styles: { fontSize: 10, cellPadding: 2 , halign: "center",lineWidth: 0.2, lineColor: [0, 0, 0],textColor: [0, 0, 0],},
          margin: { bottom: 30 , top:90},
          pageBreak: "auto",
          didDrawPage: (data) => {
            this.addHeader(doc); // Ensure header appears on every page
            this.addFooter(doc, doc.internal.pageSize.height, data.pageNumber, data.table.pageCount);
          },
        });

        startY = doc.lastAutoTable.finalY + 10;
      });

      this.addSignatureLines(doc, doc.internal.pageSize.height);
      this.addFooter
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

    addSignatureLines(doc, pageHeight) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Receiver's Signature", 14, pageHeight - 25);
      doc.line(14, pageHeight - 15, 80, pageHeight - 15);
      doc.text("For Hemant Traders", 140, pageHeight - 25);
      doc.line(140, pageHeight - 15, 200, pageHeight - 15);
    },

    addHeader(doc) {
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
      doc.setFontSize(10);
      doc.text("(Original For Recipient)", 105, 56, "center");

      doc.setFontSize(12);
      doc.text(`DELIVERY CHALLAN #${this.invoiceDetail.invoiceNumber}`, 14, 62);
      doc.text(`Date: ${this.formatDate(this.invoiceDetail.createdAt)}`, 200, 62, "right");

      doc.setFontSize(12);
      doc.setFont("helvetica" , "bold");
      doc.text(`M/s ${this.invoiceDetail.customer?.name || "N/A"}`, 105, 70, "center");
      doc.setFontSize(12);
      doc.setFont("helvetica" , "normal");
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
