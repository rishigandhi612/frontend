<template>
  <div class="sticker-container">
    <!-- Preview: renders the exact same HTML that gets printed -->
    <iframe
      v-if="inventoryItem"
      class="preview-frame"
      :srcdoc="previewDoc"
      title="Sticker preview"
    />

    <div class="print-controls">
      <button
        class="print-btn"
        v-if="inventoryItem"
        :disabled="printing"
        @click="printSticker"
      >
        {{ printing ? "Printing..." : "Print This Label" }}
      </button>
      <button
        class="print-btn"
        v-if="inventoryItems && inventoryItems.length > 1"
        :disabled="printing"
        @click="printAllStickers"
      >
        {{
          printing
            ? "Printing..."
            : `Print All Labels (${inventoryItems.length} pages)`
        }}
      </button>
    </div>
  </div>
</template>

<script>
import JsBarcode from "jsbarcode";

export default {
  name: "InventoryThermalSticker",
  props: {
    inventoryItem: Object,
    inventoryItems: Array,
    productName: String,
    // true  -> non-film labels print on a 6x4in landscape page
    // false -> non-film labels are laid out inside the normal 4x6in page
    nonFilmLandscape: { type: Boolean, default: true },
  },
  data() {
    return {
      printing: false,
      barcodeCache: new Map(),
      previewBarcode: null,
    };
  },
  computed: {
    previewDoc() {
      if (!this.inventoryItem) return "";
      return this.buildDocument([this.inventoryItem], [this.previewBarcode], {
        preview: true,
      });
    },
  },
  watch: {
    inventoryItem: {
      immediate: true,
      deep: true,
      async handler(item) {
        this.previewBarcode = item ? await this.generateBarcode(item) : null;
      },
    },
  },
  methods: {
    /* ---------- helpers ---------- */
    escape(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },

    capitalizeFirstLetter(text) {
      return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
    },

    isLandscape(item) {
      return item.type === "non-film" && this.nonFilmLandscape;
    },

    convertToInches(mm) {
      return (parseFloat(mm) / 25.4).toFixed(1);
    },

    calculateCoreWeight(item) {
      const gross = parseFloat(item.grossWeight) || 0;
      const net = parseFloat(item.netWeight) || 0;
      const core = gross - net;
      return core > 0 ? core.toFixed(1) : "N/A";
    },

    // width > 60 is treated as mm, otherwise inches
    displaySizeInInches(width) {
      const w = parseFloat(width);
      if (!w) return "N/A";
      return w > 60 ? `${this.convertToInches(w)}"` : `${w}"`;
    },

    displaySizeInMm(width) {
      const w = parseFloat(width);
      if (!w) return "N/A";
      return w > 60 ? `${w} mm` : `${(w * 25.4).toFixed(1)} mm`;
    },

    /* ---------- barcode ---------- */
    async generateBarcode(item) {
      if (!item?.rollId) return null;
      const key = String(item.rollId);
      if (this.barcodeCache.has(key)) return this.barcodeCache.get(key);

      try {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, key, {
          format: "CODE128",
          displayValue: true,
          fontSize: 20,
          height: 80,
          width: 3,
          margin: 10,
        });
        const data = canvas.toDataURL("image/png");
        this.barcodeCache.set(key, data);
        return data;
      } catch (error) {
        console.error("Error generating barcode:", error);
        return null;
      }
    },

    /* ---------- markup ---------- */
    stickerHTML(item, barcode) {
      const e = this.escape;
      const barcodeImg = barcode
        ? `<img src="${barcode}" alt="Barcode">`
        : `<div class="no-barcode">No Barcode</div>`;
      if (item.type !== "film" && this.isLandscape(item)) {
        return `
    <div class="sticker-content landscape">
      <div class="product-name-header">
        <h1 class="product-name">${e(
          (item.productName) || "Product Name",
        )}</h1>
      </div>

      <div class="ls-batch">
        <div>Batch No: <strong>${e(item.rollId || "N/A")}</strong></div>
        <div>Net Weight: <strong>${e(item.netWeight || "N/A")}</strong> kg</div>
      </div>

      <div class="ls-middle">
        <div class="ls-barcode">${barcodeImg}</div>
        
      </div>
<div class="ls-company">
          <p class="address">Marketed By:</p>
          <h2 class="company-name">HEMANT TRADERS</h2>
          <p class="address">1281, Sadashiv Peth, Vertex Arcade, Pune - 411030</p>
          <p class="contact-web">
            Contact: <strong>(+91) 9422080922 / 9420699675</strong><br>
            Web: hemanttraders.vercel.app
          </p>
        </div>
      <div class="ls-bottom">
        <h2 class="product-line1">Dealers in <strong>BOPP, POLYESTER, PVC, THERMAL Films</strong></h2>
        <h2 class="product-line2"><strong>Adhesives for Lamination, Bookbinding, and Pasting, UV Coats</strong></h2>
      </div>
    </div>`;
      }
      const rows =
        item.type === "film"
          ? `
        <div class="info-row">Roll No: <strong>${e(
          item.rollId || "N/A",
        )}</strong></div>
        <div class="info-row">Length (Approx): <strong>${e(
          item.mtr || "N/A",
        )}</strong> meters</div>
        <div class="info-row">Size: <strong>${e(
          this.displaySizeInInches(item.width),
        )}</strong></div>
        <div class="info-row">Size: ${e(this.displaySizeInMm(item.width))}</div>
        <div class="info-row">Gross Weight: ${e(
          item.grossWeight || "N/A",
        )} kg</div>
        <div class="info-row">Core Weight: ${e(
          this.calculateCoreWeight(item),
        )} kg</div>
        <div class="info-row">Net Weight: <strong>${e(
          item.netWeight || "N/A",
        )}</strong> kg</div>`
          : `
        <div class="batch-number">
          <div class="batch-row">
            <div>Batch No: <strong>${e(item.rollId || "N/A")}</strong></div>
            <div>Net Weight: <strong>${e(
              item.netWeight || "N/A",
            )}</strong> kg</div>
          </div>
        </div>`;
      return `
        <div class="sticker-content ${
          this.isLandscape(item) ? "landscape" : ""
        }">
          <div class="product-name-header">
            <h1 class="product-name">${e(
              this.capitalizeFirstLetter(item.productName) || "Product Name",
            )}</h1>
          </div>
          ${rows}
          <div class="barcode-section">${barcodeImg}</div>
          <div class="footer">
            <p class="address">Marketed By:</p>
            <h2 class="company-name">HEMANT TRADERS</h2>
            <p class="address">1281, Sadashiv Peth, Vertex Arcade, Pune - 411030</p>
            <p class="contact-web">
              Contact: <strong>(+91) 9422080922 / 9420699675</strong><br>
              Web: hemanttraders.vercel.app
            </p>
            <div class="separator-line"></div>
            <h2 class="product-line1">Dealers in <strong>BOPP, POLYESTER, PVC, THERMAL Films</strong></h2>
            <h2 class="product-line2"><strong>Adhesives for Lamination, Bookbinding, and Pasting, UV Coats</strong></h2>
          </div>
        </div>`;
    },

    // One .page per item => one label per printed page
    buildDocument(items, barcodes, { preview = false } = {}) {
      const pages = items
        .map((item, i) => {
          const land = this.isLandscape(item);
          const sticker = this.stickerHTML(item, barcodes[i]);
          return `
      <div class="page ${land ? "landscape-page" : ""}">
        ${land ? `<div class="rotate-wrap">${sticker}</div>` : sticker}
      </div>`;
        })
        .join("");

      return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Print Labels - ${items.length}</title>
    ${this.getStyles(preview)}
  </head>
  <body>${pages}</body>
</html>`;
    },

    getStyles(preview) {
      return `<style>
        @page { size: 4in 6in; margin: 0; }
      
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: white; font-family: Helvetica, Arial, sans-serif; }

        .page {
          width: 4in;
          height: 6in;
          padding: 0.1in;
          overflow: hidden;
          page-break-after: always;
          break-after: page;
        }
        .page:last-child { page-break-after: auto; break-after: auto; }
        .page.landscape-page { padding: 0; position: relative; }
.rotate-wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 6in;
  height: 4in;
  padding: 0.1in;
  transform-origin: top left;
  transform: translateX(4in) rotate(90deg);
}

        .sticker-content {
          width: 100%;
          height: 100%;
          border: 2px solid black;
          padding: 5px;
          background: white;
          display: flex;
          flex-direction: column;
          page-break-inside: avoid;
          break-inside: avoid;
          overflow: hidden;
        }

        .product-name-header {
          background: black;
          color: white;
          text-align: center;
          padding: 6px 2px;
          margin: -5px -5px 6px -5px;
        }
        .product-name { font-size: 18px; text-transform: uppercase; font-weight: bold; }
        .landscape .product-name { font-size: 18px; }

        .info-row {
          padding: 3px 0;
          border-bottom: 1px solid black;
          font-size: 18px;
        }

        .batch-number {
          border: 2px solid black;
          text-align: center;
          font-size: 24px;
          background: white;
          margin: 6px 0;
          padding: 6px 0;
        }
        .landscape .batch-number { font-size: 20px; }
        .batch-row { display: flex; justify-content: space-between; padding: 0 10px; }

        .barcode-section {
          margin: 6px 0;
          text-align: center;
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70px;
          overflow: hidden;
        }
        .barcode-section img { max-width: 100%; max-height: 90px; object-fit: contain; }
        .no-barcode { font-size: 12px; color: #666; }

        .footer {
          text-align: center;
          border-top: 1px solid black;
          margin-top: auto;
        }
        .company-name { font-size: 24px; font-weight: bold; }
        .landscape .company-name { font-size: 18px; }
        .address, .contact-web { margin: 1px 0; font-size: 12px; line-height: 1.2; }
        .landscape .address, .landscape .contact-web { font-size: 10px; }
        .separator-line { height: 1px; background: black; }
        .product-line1, .product-line2 { margin: 2px 0; font-size: 12px; line-height: 1.1; }
        .landscape .product-line1, .landscape .product-line2 { font-size: 9px; }
/* ---------- non-film landscape layout ---------- */
.landscape .ls-batch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid black;
  padding: 8px 14px;
  margin: 4px 0;
  font-size: 22px;
}

.landscape .ls-middle {
  flex: 1;
 
  align-items: center;
  gap: 8px;
  min-height: 0;
}
.landscape .ls-barcode {
  flex: 1 1 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.landscape .ls-barcode img { max-width: 100%; max-height: 110px; object-fit: contain; }

.landscape .ls-company {

  text-align: center;
  border-left: 1px solid black;
  padding-left: 8px;
}
.landscape .ls-company .company-name { font-size: 24px; margin: 2px 0; }
.landscape .ls-company .address,
.landscape .ls-company .contact-web { font-size: 18px; }

.landscape .ls-bottom {
  border-top: 1px solid black;
  text-align: center;
  padding-top: 3px;
}
.landscape .ls-bottom .product-line1,
.landscape .ls-bottom .product-line2 { font-size: 10px; margin: 1px 0; }
        ${
          preview
            ? "body { overflow: hidden; }"
            : "@media print { html, body { width: auto; height: auto; } }"
        }
      </style>`;
    },

    /* ---------- printing (hidden iframe, no popup needed) ---------- */
    printHtml(html) {
      return new Promise((resolve, reject) => {
        const iframe = document.createElement("iframe");
        iframe.style.cssText =
          "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
        document.body.appendChild(iframe);

        const cleanup = () => {
          setTimeout(() => iframe.remove(), 500);
          resolve();
        };

        iframe.onload = () => {
          try {
            const win = iframe.contentWindow;
            win.onafterprint = cleanup;
            win.focus();
            win.print();
            // Fallback for browsers that don't fire afterprint
            setTimeout(cleanup, 60000);
          } catch (err) {
            iframe.remove();
            reject(err);
          }
        };

        iframe.srcdoc = html;
      });
    },

    async printItems(items) {
      if (this.printing || !items?.length) return;
      this.printing = true;
      try {
        const barcodes = await Promise.all(
          items.map((item) => this.generateBarcode(item)),
        );
        await this.printHtml(this.buildDocument(items, barcodes));
      } catch (error) {
        console.error("Print error:", error);
        alert("Error printing label: " + error.message);
      } finally {
        this.printing = false;
      }
    },

    printSticker() {
      return this.printItems([this.inventoryItem]);
    },

    printAllStickers() {
      return this.printItems(this.inventoryItems);
    },
  },
};
</script>

<style scoped>
.sticker-container {
  font-family: Arial, sans-serif;
}
.preview-frame.landscape {
  width: 6in;
  height: 4in;
}
.preview-frame {
  display: block;
  width: 4in;
  height: 6in;
  border: 1px solid #ccc;
  background: white;
}

.preview-frame.landscape {
  width: 6in;
  height: 4in;
}

.print-controls {
  text-align: center;
  margin-top: 20px;
}

.print-btn {
  padding: 8px 16px;
  margin: 5px;
  font-size: 14px;
  background: #555;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.print-btn:hover:not(:disabled) {
  background: #777;
}

.print-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
