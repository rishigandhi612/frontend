<template>
  <v-container> </v-container>
</template>

<script>
import jsPDF from "jspdf";
import "jspdf-autotable";

// ─── Page geometry ────────────────────────────────────────────────────────────
const PW = 210; // A4 width  mm
const PH = 297; // A4 height mm
const ML = 14; // left  margin
const MR = 14; // right margin
const CW = PW - ML - MR; // usable content width = 182 mm
const FOOTER_H = 22; // mm reserved at bottom for footer

// Column widths — must sum to CW (182)
// Date | Voucher No. | Voucher Type | Debit | Credit | Balance
// const COL = [28, 34, 30, 30, 30, 30];

// Absolute left-edge of each column
// const COL_LEFT = COL.reduce((acc, w, i) => {
//   acc.push(i === 0 ? ML : acc[i - 1] + COL[i - 1]);
//   return acc;
// }, []);

const COMPANY_LOGO = require("@/assets/HoloLogo.png");
const TOTAL_PAGES_PLACEHOLDER = "{total_pages_count_string}";

export default {
  name: "InventorySummaryPdf",

  props: {
    inventoryitems: { type: Array, default: () => [] },
    allProducts: { type: Array, default: () => [] },
  },

  data() {
    return {};
  },

  mounted() {
    // No need to preload — require will work directly in drawHeader
  },

  methods: {
    // ── Utilities ────────────────────────────────────────────────────────────
    fmtDate(ds) {
      if (!ds) return "";
      const d = new Date(ds);
      return `${String(d.getDate()).padStart(2, "0")}-${d.toLocaleString(
        "default",
        { month: "short" },
      )}-${String(d.getFullYear()).slice(2)}`;
    },

    fmtNum(v) {
      if (v == null || v === "") return "";
      const n = parseFloat(v);
      return isNaN(n)
        ? ""
        : n.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
    },

    fmtBal(v) {
      if (v == null) return "";
      const n = parseFloat(v);
      if (isNaN(n)) return "";
      return `${Math.abs(n).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${n < 0 ? "Cr" : "Dr"}`;
    },

    sanitizeFilePart(value) {
      return String(value || "Customer")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    },

    buildFilename() {
      return `Inventory_Summary_${Date.now()}.pdf`;
    },
    widthInInch(width) {
      if (!width) return "";
      const inch = parseFloat(width) / 25.4; // Convert mm to inches
      return inch.toFixed(2); // Round to 2 decimal places
    },
    getProductName(productId) {
      const product = this.allProducts.find((p) => p._id === productId);
      return product ? product.name : `Unknown Product (ID: ${productId})`;
    },
    // ── Header ───────────────────────────────────────────────────────────────
    drawHeader(doc, pageNum, totalPages) {
      doc.addImage(COMPANY_LOGO, "PNG", 5, 8, 25, 25);

      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.text("HEMANT TRADERS", 105, 20, "center");

      // Address & contact
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(
        "1281, Sadashiv Peth, Vertex Arcade, Pune - 411030",
        105,
        25,
        "center",
      );
      doc.text(
        "Contact: (+91) 9422080922 / 9420699675    Web: hemanttraders.vercel.app",
        105,
        32,
        "center",
      );

      // Rule 1
      doc.setLineWidth(0.5);
      doc.line(0, 36, 210, 36);

      // Dealer lines
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Dealers in BOPP, POLYESTER, PVC, THERMAL Films",
        105,
        42,
        "center",
      );
      doc.text(
        "Adhesives for Lamination, Bookbinding, and Pasting, UV Coats",
        105,
        48,
        "center",
      );

      // Rule 2
      doc.line(0, 51, 210, 51);

      // Original for recipient
      //   doc.setFontSize(10);
      //   doc.setFont("helvetica", "normal");
      //   doc.text("(Original For Recipient)", 105, 56, "center");

      //   // Customer name + Ledger Account (left-aligned, like reference)
      //   doc.setFontSize(12);
      //   doc.setFont("helvetica", "bold");
      //   doc.text(this.customer?.name || "N/A", 14, 62);
      //   doc.setFont("helvetica", "normal");
      //   doc.text("Ledger Account", 14, 67);

      // Page number — top right
      doc.setFontSize(12);
      doc.text(
        `Page ${pageNum} of ${totalPages} | ${this.fmtDate(new Date())}`,
        PW - 45,
        55,
      );

      // Address under customer name

      let y = 60;

      return y; // table startY
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    // drawFooter(doc) {
    //   const y0 = PH - FOOTER_H;

    //   doc.setDrawColor(0);
    //   doc.setLineWidth(0.3);
    //   doc.line(ML, y0, PW - MR, y0);

    //   doc.setTextColor(50, 50, 50);
    //   doc.setFontSize(6.5);

    //   doc.setFont("helvetica", "bold");
    //   doc.text("Bank:", ML, y0 + 4);
    //   doc.setFont("helvetica", "normal");
    //   doc.text(
    //     "Bank of Maharashtra   A/C: 60038479763   IFSC: MAHB0000001   Branch: Bajirao Rd, Pune",
    //     ML + 9,
    //     y0 + 4,
    //   );

    //   doc.setFont("helvetica", "bold");
    //   doc.text("T&C:", ML, y0 + 9);
    //   doc.setFont("helvetica", "normal");
    //   doc.text(
    //     "Check material before use. Subject to Pune Jurisdiction. Goods once sold will not be taken back. Interest @24% p.a. if payment not made before due date.",
    //     ML + 8,
    //     y0 + 9,
    //     { maxWidth: CW - 8 },
    //   );

    //   doc.setFont("helvetica", "italic");
    //   doc.setFontSize(6);
    //   doc.text(
    //     "This is a computer-generated document and does not require any signature.",
    //     PW / 2,
    //     PH - 3,
    //     { align: "center" },
    //   );

    //   doc.setTextColor(0, 0, 0);
    // },

    // ── Main ─────────────────────────────────────────────────────────────────
    createPdfDocument() {
      const doc = new jsPDF({ unit: "mm", format: "a4" });

      // Approximate header height (used for margin.top and startY)
      const HDR_H = 60;

      // Build table rows
      const tableBody = this["inventoryitems"].map((item) => {
        return [
          this.getProductName(item.productId) || "",
          item.width,
          this.widthInInch(item.width) || "",
          item.rollId || "",
          item.netWeight || "",
          item.grossWeight || "",

          item.mtr || "",
          item.status || "",
        ];
      });

      // autoTable — theme "plain" = no borders, no fills
      doc.autoTable({
        startY: HDR_H,

        head: [
          [
            { content: "Product Name" },
            { content: "Width(mm)" },
            { content: "Width(in)" },
            { content: "Roll Id" },
            { content: "Net Weight" },
            { content: "Gross Weight" },
            { content: "Mtr" },
            { content: "Status" },
          ],
        ],

        body: tableBody,

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 12,
          //   cellPadding: auto,
          textColor: [0, 0, 0],
          //   lineWidth: 0,
          overflow: "linebreak",
        },

        headStyles: {
          fontStyle: "bold",
          fontSize: 12,
          fillColor: false,
          textColor: [0, 0, 0],
          //   lineWidth: 0,
        },

        // alternateRowStyles: { fillColor: false }, // no zebra

        // columnStyles: {
        //   0: { cellWidth: COL[0], halign: "center" },
        //   1: { cellWidth: COL[1], halign: "center" },
        //   2: { cellWidth: COL[2], halign: "center" },
        //   3: { cellWidth: COL[3], halign: "center" },
        //   4: { cellWidth: COL[4], halign: "center" },
        //   5: { cellWidth: COL[5], halign: "center" },
        //   //   6: { cellWidth: COL[6], halign: "center" },
        // },

        margin: { top: HDR_H, left: ML, right: MR, bottom: FOOTER_H + 4 },
        tableWidth: CW,

        // Draw ONE horizontal rule under the header row (Tally style)
        didDrawCell(data) {
          if (data.section === "head" && data.column.index === 4) {
            const lineY = data.cell.y + data.cell.height;
            doc.setDrawColor(0);
            doc.setLineWidth(0.4);
            doc.line(ML, lineY, PW - MR, lineY);
          }
        },

        didDrawPage: (data) => {
          this.drawHeader(doc, data.pageNumber, TOTAL_PAGES_PLACEHOLDER);

          //   this.drawFooter(doc);
        },
      });

      // ── Totals block ─────────────────────────────────────────────────────
      let sy = (doc.lastAutoTable?.finalY || HDR_H) + 3;

      // Overflow to a new page if needed
      if (sy + 18 > PH - FOOTER_H) {
        doc.addPage();
        this.drawHeader(
          doc,
          doc.internal.getNumberOfPages(),
          TOTAL_PAGES_PLACEHOLDER,
        );
        // this.drawFooter(doc);
        sy = HDR_H + 3;
      }

      doc.putTotalPages(TOTAL_PAGES_PLACEHOLDER);
      return doc;
    },
    generatePdf() {
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
                "PDF opened in a new tab. Use your device's options to print.",
              );
            }
          };
        }
      } catch (error) {
        console.error("PDF generation error:", error);
        alert(error.message);
      }
    },

    getPdfBlob() {
      const doc = this.createPdfDocument();
      return doc.output("blob");
    },

    getPdfBlobWithName() {
      const doc = this.createPdfDocument();
      return {
        blob: doc.output("blob"),
        filename: this.buildFilename(),
      };
    },
  },
};
</script>

<style scoped></style>
