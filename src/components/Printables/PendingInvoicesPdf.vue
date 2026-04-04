<template>
  <v-container></v-container>
</template>

<script>
import jsPDF from "jspdf";
import "jspdf-autotable";

// ─── Page geometry ────────────────────────────────────────────────────────────
const PW = 210;
const PH = 297;
const ML = 14;
const MR = 14;
const CW = PW - ML - MR; // 182
const FOOTER_H = 22;

// Column widths — must sum to CW (182)
// Date | Invoice No | Opening Amt | Allocated | Pending
const COL = [28, 54, 34, 34, 32];

const COL_LEFT = COL.reduce((acc, w, i) => {
  acc.push(i === 0 ? ML : acc[i - 1] + COL[i - 1]);
  return acc;
}, []);

const COMPANY_LOGO = require("@/assets/HoloLogo.png");

export default {
  name: "PendingInvoicesPdf",
  props: {
    invoices: { type: Array, default: () => [] }, // all pending invoices
    summary: { type: Object, default: () => ({}) }, // { count, totalBill, totalAllocated, totalPending }
    customer: { type: Object, default: () => ({}) }, // { name, address, phone_no, gstin }
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

    // ── Header ───────────────────────────────────────────────────────────────
    addHeader(doc) {
      doc.addImage(COMPANY_LOGO, "PNG", 5, 8, 25, 25);
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.text("HEMANT TRADERS", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("1281, Sadashiv Peth, Vertex Arcade, Pune - 411030", 105, 25, {
        align: "center",
      });
      doc.text(
        "Contact: (+91) 9422080922 / 9420699675    Web: hemanttraders.vercel.app",
        105,
        32,
        { align: "center" },
      );

      doc.line(0, 36, 210, 36);
      doc.text("Dealers in BOPP, POLYESTER, PVC, THERMAL Films", 105, 42, {
        align: "center",
      });
      doc.text(
        "Adhesives for Lamination, Bookbinding, and Pasting, UV Coats",
        105,
        48,
        { align: "center" },
      );

      doc.line(0, 51, 210, 51);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("(Original For Recipient)", 105, 56, { align: "center" });

      doc.setFontSize(12);
      doc.text("PENDING INVOICES", 14, 62);
      doc.text(`Date: ${this.fmtDate(new Date())}`, 200, 62, {
        align: "right",
      });

      let y = 70;

      // CUSTOMER NAME
      doc.setFont("helvetica", "bold");
      const nameLines = doc.splitTextToSize(
        `M/s ${this.customer?.name || "N/A"}`,
        180,
      );
      nameLines.forEach((line) => {
        doc.text(line, 105, y, { align: "center" });
        y += 5;
      });

      // CUSTOMER ADDRESS
      //   doc.setFont("helvetica", "normal");
      //   doc.setFontSize(12);
      //   const addressText =
      //     `${this.customer?.address?.line1 || "N/A"}, ` +
      //     `${this.customer?.address?.city || "N/A"}-` +
      //     `${this.customer?.address?.pincode || "N/A"}`;
      //   const addressLines = doc.splitTextToSize(addressText, 180);
      //   addressLines.forEach((line) => {
      //     doc.text(line, 105, y, { align: "center" });
      //     y += 5;
      //   });

      // CONTACT
      //   const contactLines = doc.splitTextToSize(
      //     `Contact: ${this.customer?.phone_no || "N/A"}`,
      //     180,
      //   );
      //   contactLines.forEach((line) => {
      //     doc.text(line, 105, y, { align: "center" });
      //     y += 5;
      //   });

      //   // GSTIN
      //   const gstLines = doc.splitTextToSize(
      //     `GSTIN/UIN: ${this.customer?.gstin || "N/A"}`,
      //     180,
      //   );
      //   gstLines.forEach((line) => {
      //     doc.text(line, 105, y, { align: "center" });
      //     y += 5;
      //   });

      return y + 4;
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    drawFooter(doc) {
      const y0 = PH - FOOTER_H;

      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(ML, y0, PW - MR, y0);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(7);

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
        "Subject to Pune Jurisdiction. Goods once sold will not be taken back. Interest @24% p.a. if payment not made before due date.",
        ML + 8,
        y0 + 9,
        { maxWidth: CW - 8 },
      );

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
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
      const HDR_H = this.addHeader(doc, 1);

      // Sort by invoice date ascending (oldest first — like a statement)
      const sorted = [...this.invoices].sort(
        (a, b) => new Date(a.invoiceDate) - new Date(b.invoiceDate),
      );

      const tableBody = sorted.map((inv) => [
        this.fmtDate(inv.invoiceDate),
        inv.invoiceno || "",
        this.fmtNum(inv.openingAmount),
        this.fmtNum(inv.allocatedAmount),
        this.fmtNum(inv.pendingAmount),
      ]);

      doc.autoTable({
        startY: HDR_H,

        head: [
          [
            { content: "Invoice Date", styles: { halign: "left" } },
            { content: "Invoice No", styles: { halign: "left" } },
            { content: "Bill Amount", styles: { halign: "right" } },
            { content: "Allocated", styles: { halign: "right" } },
            { content: "Pending", styles: { halign: "right" } },
          ],
        ],

        body: tableBody,

        theme: "plain",

        styles: {
          font: "helvetica",
          fontSize: 12,
          cellPadding: { top: 1.0, bottom: 1.0, left: 1, right: 1 },
          textColor: [0, 0, 0],
          lineWidth: 0,
          overflow: "linebreak",
        },

        headStyles: {
          fontStyle: "bold",
          fontSize: 12,
          fillColor: false,
          textColor: [0, 0, 0],
          lineWidth: 0,
        },

        alternateRowStyles: { fillColor: false },

        columnStyles: {
          0: { cellWidth: COL[0], halign: "left" },
          1: { cellWidth: COL[1], halign: "left" },
          2: { cellWidth: COL[2], halign: "right" },
          3: { cellWidth: COL[3], halign: "right" },
          4: { cellWidth: COL[4], halign: "right" },
        },

        margin: { top: HDR_H, left: ML, right: MR, bottom: FOOTER_H + 4 },
        tableWidth: CW,

        // Horizontal rule under header row (Tally style)
        didDrawCell(data) {
          if (data.section === "head" && data.column.index === COL.length - 1) {
            const lineY = data.cell.y + data.cell.height;
            doc.setDrawColor(0);
            doc.setLineWidth(0.4);
            doc.line(ML, lineY, PW - MR, lineY);
          }
        },

        didDrawPage: (data) => {
          const newHdrH = this.addHeader(doc, data.pageNumber);
          data.settings.margin.top = newHdrH; // keeps table body below header on page 2+
          this.drawFooter(doc);
        },
      });

      // ── Totals block ─────────────────────────────────────────────────────
      let sy = (doc.lastAutoTable?.finalY || HDR_H) + 3;

      if (sy + 22 > PH - FOOTER_H) {
        doc.addPage();
        this.addHeader(doc, doc.internal.getNumberOfPages());
        this.drawFooter(doc);
        sy = HDR_H + 3;
      }

      const totalBill = this.summary?.totalBill || 0;
      const totalAllocated = this.summary?.totalAllocated || 0;
      const totalPending = this.summary?.totalPending || 0;

      // Right edges of numeric columns
      const billRX = COL_LEFT[2] + COL[2];
      const allocatedRX = COL_LEFT[3] + COL[3];
      const pendingRX = COL_LEFT[4] + COL[4];

      // Top rule
      doc.setDrawColor(0);
      doc.setLineWidth(0.4);
      doc.line(ML, sy, PW - MR, sy);
      sy += 5;

      // Totals row
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Total :", ML, sy);
      doc.text(this.fmtNum(totalBill), billRX, sy, { align: "right" });
      doc.text(this.fmtNum(totalAllocated), allocatedRX, sy, {
        align: "right",
      });
      doc.text(this.fmtNum(totalPending), pendingRX, sy, { align: "right" });
      sy += 2;

      // Thin separator
      doc.setLineWidth(0.25);
      doc.line(ML, sy, PW - MR, sy);
      sy += 4;

      // Summary line: invoice count + outstanding
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(
        `${
          this.summary?.count || sorted.length
        } invoice(s) pending   |   Outstanding: ${this.fmtNum(totalPending)}`,
        ML,
        sy,
      );
      sy += 2;

      // Double bottom rule
      doc.setLineWidth(0.5);
      doc.line(ML, sy, PW - MR, sy);
      doc.setLineWidth(0.2);
      doc.line(ML, sy + 1.2, PW - MR, sy + 1.2);

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
  },
};
</script>

<style scoped></style>
