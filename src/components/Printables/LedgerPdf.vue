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
// Date | Voucher | Debit | Credit | Balance
const COL = [28, 64, 30, 30, 30];

// Absolute left-edge of each column
const COL_LEFT = COL.reduce((acc, w, i) => {
  acc.push(i === 0 ? ML : acc[i - 1] + COL[i - 1]);
  return acc;
}, []);

export default {
  name: "LedgerPdf",

  props: {
    ledger: { type: Array, default: () => [] },
    summary: { type: Object, default: () => ({}) },
    customer: { type: Object, default: () => ({}) },
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

    // ── Header ───────────────────────────────────────────────────────────────
    drawHeader(doc, pageNum, totalPages) {
      // Logo — use require() directly in this scope (same as InvoicePdf.vue)
      try {
        const logoPath = require("@/assets/HoloLogo.png");
        doc.addImage(logoPath, "PNG", 5, 8, 25, 25);
      } catch (e) {
        console.error("Failed to add logo:", e.message);
      }

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
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("(Original For Recipient)", 105, 56, "center");

      // Customer name + Ledger Account (left-aligned, like reference)
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(this.customer?.name || "N/A", 14, 62);
      doc.setFont("helvetica", "normal");
      doc.text("Ledger Account", 14, 67);

      // Page number — top right
      doc.setFontSize(9);
      doc.text(`Page ${pageNum} of ${totalPages}`, PW - MR, 62, {
        align: "right",
      });

      // Address under customer name
      const addr = [
        this.customer?.address?.line1,
        this.customer?.address?.city,
        this.customer?.address?.pincode,
      ]
        .filter(Boolean)
        .join(", ");
      let y = 72;
      if (addr) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(addr, 14, y);
        y += 5;
      }

      y += 2;
      return y; // table startY
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    drawFooter(doc) {
      const y0 = PH - FOOTER_H;

      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(ML, y0, PW - MR, y0);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(6.5);

      doc.setFont("helvetica", "bold");
      doc.text("Bank:", ML, y0 + 4);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Bank of Maharashtra   A/C: 60038479763   IFSC: MAHB0000001   Branch: Bajirao Rd, Pune",
        ML + 9,
        y0 + 4,
      );

      doc.setFont("helvetica", "bold");
      doc.text("T&C:", ML, y0 + 9);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Check material before use. Subject to Pune Jurisdiction. Goods once sold will not be taken back. Interest @24% p.a. if payment not made before due date.",
        ML + 8,
        y0 + 9,
        { maxWidth: CW - 8 },
      );

      doc.setFont("helvetica", "italic");
      doc.setFontSize(6);
      doc.text(
        "This is a computer-generated document and does not require any signature.",
        PW / 2,
        PH - 3,
        { align: "center" },
      );

      doc.setTextColor(0, 0, 0);
    },

    // ── Main ─────────────────────────────────────────────────────────────────
    generatePdf() {
      const doc = new jsPDF({ unit: "mm", format: "a4" });

      // Approximate header height (used for margin.top and startY)
      const HDR_H = 82;

      // Build table rows
      const tableBody = this.ledger.map((item) => {
        return [
          this.fmtDate(item.date),
          item.referenceNumber || "",
          item.debit != "0.00" ? this.fmtNum(item.debit) : "",
          item.credit != "0.00" ? this.fmtNum(item.credit) : "",
          item.balance != "0.00" ? this.fmtBal(item.balance) : "",
        ];
      });

      // autoTable — theme "plain" = no borders, no fills
      doc.autoTable({
        startY: HDR_H,

        head: [
          [
            { content: "Date", styles: { halign: "left" } },
            { content: "Voucher No.", styles: { halign: "left" } },
            { content: "Debit", styles: { halign: "right" } },
            { content: "Credit", styles: { halign: "right" } },
            { content: "Balance", styles: { halign: "right" } },
          ],
        ],

        body: tableBody,

        theme: "plain", // no cell borders, no zebra shading — pure Tally look

        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: { top: 1.0, bottom: 1.0, left: 1, right: 1 },
          textColor: [0, 0, 0],
          lineWidth: 0,
          overflow: "linebreak",
        },

        headStyles: {
          fontStyle: "bold",
          fontSize: 9,
          fillColor: false,
          textColor: [0, 0, 0],
          lineWidth: 0,
        },

        alternateRowStyles: { fillColor: false }, // no zebra

        columnStyles: {
          0: { cellWidth: COL[0], halign: "left" },
          1: { cellWidth: COL[1], halign: "left" },
          2: { cellWidth: COL[2], halign: "right" },
          3: { cellWidth: COL[3], halign: "right" },
          4: { cellWidth: COL[4], halign: "right" },
        },

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
          // Use "??" as placeholder for total pages; replaced after render
          // if (data.pageNumber === 1) {
          this.drawHeader(doc, data.pageNumber, "??");
          // }

          this.drawFooter(doc);
        },
      });

      // ── Totals block ─────────────────────────────────────────────────────
      let sy = (doc.lastAutoTable?.finalY || HDR_H) + 3;

      // Overflow to a new page if needed
      if (sy + 18 > PH - FOOTER_H) {
        doc.addPage();
        this.drawHeader(doc, doc.internal.getNumberOfPages(), "??");
        this.drawFooter(doc);
        sy = HDR_H + 3;
      }

      const totalDebit = this.summary?.totalDebit || 0;
      const totalCredit = this.summary?.totalCredit || 0;
      const closing = this.summary?.closingBalance || 0;

      // Right-edge x of each column  (used for right-aligned numbers)
      const debitRX = COL_LEFT[2] + COL[2];
      const creditRX = COL_LEFT[3] + COL[3];
      const balRX = COL_LEFT[4] + COL[4];

      // Top rule
      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.line(ML, sy, PW - MR, sy);
      sy += 5;

      // "Current Total :" row  — label left, numbers under their columns
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Current Total :", ML, sy);
      doc.text(this.fmtNum(totalDebit), debitRX, sy, { align: "right" });
      doc.text(this.fmtNum(totalCredit), creditRX, sy, { align: "right" });
      sy += 2;

      // Thin separator
      doc.setLineWidth(0.25);
      doc.line(ML, sy, PW - MR, sy);
      sy += 4;

      // "Closing Balance :" row
      doc.text("Closing Balance :", ML, sy);
      doc.text(this.fmtBal(closing), balRX, sy, { align: "right" });
      sy += 2;

      // Double bottom rule  (Tally's closing double line)
      doc.setLineWidth(0.5);
      doc.line(ML, sy, PW - MR, sy);
      doc.setLineWidth(0.2);
      doc.line(ML, sy + 1.2, PW - MR, sy + 1.2);

      // ── Fix "??" placeholder with real total page count ──────────────────
      const realPages = String(doc.internal.getNumberOfPages());
      let pdfStr = new TextDecoder("latin1").decode(doc.output("arraybuffer"));
      pdfStr = pdfStr.split("??").join(realPages.padEnd(2));
      const fixedBuf = new TextEncoder().encode(pdfStr);

      const blob = new Blob([fixedBuf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
  },
};
</script>

<style scoped></style>
