<template>
  <div class="sticker-container">
    <div
      class="sticker-content"
      ref="stickerContent"
      :class="{ landscape: inventoryItem.type === 'non-film' }"
      v-if="inventoryItem"
    >
      <div class="product-name-header">
        <h1 class="product-name">
          {{
            capitalizeFirstLetter(inventoryItem.productName) || "Product Name"
          }}
        </h1>
      </div>

      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Roll No: <strong>{{ inventoryItem.rollId || "N/A" }} </strong>
      </div>
      <v-row
        class="info-row batch-number"
        v-if="inventoryItem.type === 'non-film'"
      >
        <v-col cols="6">
          Batch No: <strong>{{ inventoryItem.rollId || "N/A" }} </strong>
        </v-col>
        <v-col cols="6">
          Net Weight:
          <strong> {{ inventoryItem.netWeight || "N/A" }} </strong> kg
        </v-col>
      </v-row>

      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Length (Approx):
        <strong>{{ inventoryItem.mtr || "N/A" }}</strong> meters
      </div>
      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Size: <strong>{{ displaySizeInInches() }} </strong>
      </div>
      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Size: {{ displaySizeInMm() }}
      </div>
      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Gross Weight: {{ inventoryItem.grossWeight || "N/A" }} kg
      </div>
      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Core Weight: {{ calculateCoreWeight() }} kg
      </div>
      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Net Weight: <strong> {{ inventoryItem.netWeight || "N/A" }} </strong> kg
      </div>

      <div class="barcode-section">
        <canvas ref="barcodeCanvas" class="barcode-canvas" />
      </div>

      <div class="footer">
        <div class="logo-section">
          <!-- Logo placeholder - add your logo here -->
          <!-- <img src="@/assets/HoloLogo.png" alt="Logo" class="footer-logo"> -->
        </div>
        <p class="address">Marketed By:</p>
        <h2 class="company-name">HEMANT TRADERS</h2>
        <p class="address">1281, Sadashiv Peth, Vertex Arcade, Pune - 411030</p>
        <p class="contact-web">
          Contact: <strong> (+91) 9422080922 / 9420699675 </strong> <br />
          Web: hemanttraders.vercel.app
        </p>
        <div class="separator-line"></div>
        <h2 class="product-line1">
          Dealers in <strong>BOPP, POLYESTER, PVC, THERMAL Films</strong>
        </h2>
        <h2 class="product-line2">
          <strong
            >Adhesives for Lamination, Bookbinding, and Pasting, UV
            Coats</strong
          >
        </h2>
      </div>
    </div>

    <!-- Print Controls -->
    <div class="print-controls no-print">
      <button
        @click="printSticker"
        class="print-btn secondary"
        v-if="inventoryItem"
        :disabled="printing"
      >
        {{ printing ? "Printing..." : "Print Single Sticker" }}
      </button>
      <button
        @click="printMultipleStickers"
        class="print-btn secondary"
        v-if="inventoryItems && inventoryItems.length > 1"
        :disabled="printing"
      >
        {{
          printing
            ? "Printing..."
            : `Print All Stickers (${inventoryItems.length} items)`
        }}
      </button>
    </div>
  </div>
</template>

<script>
import JsBarcode from "jsbarcode";
import logo from "@/assets/HoloLogo.png";

export default {
  name: "InventorySticker",
  props: {
    inventoryItem: Object,
    inventoryItems: Array,
    productName: String,
  },
  data() {
    return {
      logo,
      printing: false,
      barcodeCache: new Map(), // Cache for barcode images
    };
  },
  mounted() {
    this.generateBarcode();
  },
  watch: {
    inventoryItem: {
      handler() {
        this.$nextTick(() => {
          this.generateBarcode();
        });
      },
      deep: true,
    },
  },
  methods: {
    capitalizeFirstLetter(text) {
      return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
    },

    convertToInches(mm) {
      return (parseFloat(mm) / 25.4).toFixed(1);
    },

    calculateCoreWeight(item = null) {
      const targetItem = item || this.inventoryItem;
      const gross = parseFloat(targetItem.grossWeight) || 0;
      const net = parseFloat(targetItem.netWeight) || 0;
      const core = gross - net;
      return core > 0 ? core.toFixed(1) : "N/A";
    },

    displaySizeInInches(width = null) {
      const w = width || parseFloat(this.inventoryItem.width);
      if (!w) return "N/A";
      return w > 60 ? `${this.convertToInches(w)}"` : `${w}"`;
    },

    displaySizeInMm(width = null) {
      const w = width || parseFloat(this.inventoryItem.width);
      if (!w) return "N/A";
      return w > 60 ? `${w} mm` : `${(w * 25.4).toFixed(1)} mm`;
    },

    generateBarcode() {
      if (this.$refs.barcodeCanvas && this.inventoryItem?.rollId) {
        try {
          JsBarcode(this.$refs.barcodeCanvas, this.inventoryItem.rollId, {
            format: "CODE128",
            displayValue: true,
            fontSize: 20,
            height: 80,
            width: 3,
            margin: 10,
          });
        } catch (error) {
          console.error("Error generating barcode:", error);
        }
      }
    },

    // Generate barcode image data for a specific item with larger size
    async generateBarcodeForItem(item) {
      if (!item?.rollId) return null;

      // Check cache first
      if (this.barcodeCache.has(item.rollId)) {
        return this.barcodeCache.get(item.rollId);
      }

      try {
        // Create a temporary canvas
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, item.rollId, {
          format: "CODE128",
          displayValue: true,
          fontSize: 20,
          height: 80,
          width: 3,
          margin: 10,
        });

        const imageData = canvas.toDataURL("image/png");

        // Cache the result
        this.barcodeCache.set(item.rollId, imageData);

        return imageData;
      } catch (error) {
        console.error("Error generating barcode for item:", error);
        return null;
      }
    },

    // Single sticker print - now uses the same multi-style with one item
    async printSticker() {
      if (this.printing) return;

      this.printing = true;

      try {
        // Generate barcode image
        const barcodeImageData = await this.generateBarcodeForItem(
          this.inventoryItem
        );

        const printWindow = window.open(
          "",
          "_blank",
          "width=1000vw,height=1000vh"
        );
        if (!printWindow) {
          throw new Error("Popup blocked. Please allow popups for this site.");
        }

        // Use the same multi-page content generator with single item
        const { pages, styles } = this.generateMultiPageContent(
          [this.inventoryItem],
          [barcodeImageData]
        );

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Print Sticker</title>
              ${styles}
            </head>
            <body>
              ${pages}
            </body>
          </html>
        `);

        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
          }, 500);
        };
      } catch (error) {
        console.error("Print error:", error);
        alert("Error printing sticker: " + error.message);
      } finally {
        this.printing = false;
      }
    },

    // Multiple stickers print - EXACTLY 4 per page
    async printMultipleStickers() {
      if (this.printing || !this.inventoryItems?.length) return;

      this.printing = true;

      try {
        // Generate all barcodes first
        const barcodePromises = this.inventoryItems.map((item) =>
          this.generateBarcodeForItem(item)
        );
        const barcodeImages = await Promise.all(barcodePromises);

        const printWindow = window.open(
          "",
          "_blank",
          "width=1500vw,height=1000vh"
        );
        if (!printWindow) {
          throw new Error("Popup blocked. Please allow popups for this site.");
        }

        const { pages, styles } = this.generateMultiPageContent(
          this.inventoryItems,
          barcodeImages
        );

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Print Multiple Stickers - ${this.inventoryItems.length} items</title>
              ${styles}
            </head>
            <body>
              ${pages}
            </body>
          </html>
        `);

        printWindow.document.close();

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
          }, 1000);
        };
      } catch (error) {
        console.error("Bulk print error:", error);
        alert("Error printing stickers: " + error.message);
      } finally {
        this.printing = false;
      }
    },

    // Generate content for multiple pages - EXACTLY 4 stickers per page
    generateMultiPageContent(items, barcodeImages) {
      const itemsPerPage = 4; // Fixed at 4 stickers per page
      let pagesHTML = "";

      for (let i = 0; i < items.length; i += itemsPerPage) {
        const pageItems = items.slice(i, i + itemsPerPage);
        const pageBarcodes = barcodeImages.slice(i, i + itemsPerPage);

        let pageHTML = '<div class="print-page"><div class="sticker-grid">';

        // Always create 4 slots, fill empty ones if needed
        for (let j = 0; j < 4; j++) {
          if (j < pageItems.length) {
            const item = pageItems[j];
            const isLandscape = item.type === "non-film";
            const barcodeImage = pageBarcodes[j];
            pageHTML += this.generateStickerHTML(
              item,
              barcodeImage,
              isLandscape
            );
          } else {
            // Empty slot to maintain 2x2 grid
            pageHTML += '<div class="empty-slot"></div>';
          }
        }

        pageHTML += "</div></div>";
        pagesHTML += pageHTML;
      }

      return {
        pages: pagesHTML,
        styles: this.getMultiStickerStyles(),
      };
    },

    generateStickerHTML(item, barcodeImageData, isLandscape) {
      const barcodeImg = barcodeImageData
        ? `<img src="${barcodeImageData}" style="max-width: 100%; height: 80px; object-fit: contain;" alt="Barcode">`
        : `<div style="height: 80px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 12px;">No Barcode</div>`;

      const filmRows =
        item.type === "film"
          ? `
        <div class="info-row">Roll No: <strong>${
          item.rollId || "N/A"
        }</strong></div>
        <div class="info-row">Length (Approx): <strong>${
          item.mtr || "N/A"
        }</strong> meters</div>
        <div class="info-row">Size: <strong>${this.displaySizeInInches(
          item.width
        )}</strong></div>
        <div class="info-row">Size: ${this.displaySizeInMm(item.width)}</div>
        <div class="info-row">Gross Weight: ${
          item.grossWeight || "N/A"
        } kg</div>
        <div class="info-row">Core Weight: ${this.calculateCoreWeight(
          item
        )} kg</div>
        <div class="info-row">Net Weight: <strong>${
          item.netWeight || "N/A"
        }</strong> kg</div>
      `
          : `
        <div class="nonfilm-content">
          <div class="batch-number-large">
            Batch No. ${item.rollId || "N/A"}
          </div>
          <div class="net-weight-large">
            NET WEIGHT - ${item.netWeight || "N/A"} KGS
          </div>
          <div class="industrial-use">
            FOR INDUSTRIAL USE ONLY
          </div>
        </div>
      `;

      return `
        <div class="sticker-content ${isLandscape ? "landscape" : ""}">
          <div class="sticker-header">
            <div class="logo-placeholder">LOGO</div>
            <div class="header-text">
              <h2 class="company-name-header">HEMANT TRADERS</h2>
              <p class="company-address-header">1281, Sadashiv Peth, Vertex Arcade, Pune - 411030</p>
            </div>
          </div>
          
          <div class="product-name-header">
            <h1 class="product-name">${
              this.capitalizeFirstLetter(item.productName) || "Product Name"
            }</h1>
          </div>
          
          ${filmRows}
          ${
            item.type === "film"
              ? `<div class="barcode-section">${barcodeImg}</div>`
              : ""
          }
          
          <div class="footer ${isLandscape ? "footer-landscape" : ""}">
            ${
              isLandscape
                ? `
              <div class="footer-contact">
                <span><strong>C:</strong> 9422080922 / 9420699675</span>
                <span><strong>E:</strong> hemanttraders111@yahoo.in</span>
              </div>
            `
                : `
              <p class="address">Marketed By:</p>
              <h2 class="company-name">HEMANT TRADERS</h2>
              <p class="address">1281, Sadashiv Peth, Vertex Arcade, Pune - 411030</p>
              <p class="contact-web">
                Contact: <strong> (+91) 9422080922 / 9420699675 </strong> <br />
                Web: hemanttraders.vercel.app
              </p>
              <div class="separator-line"></div>
              <h2 class="product-line1">
                Dealers in <strong>BOPP, POLYESTER, PVC, THERMAL Films</strong>
              </h2>
              <h2 class="product-line2">
                <strong>Adhesives for Lamination, Bookbinding, and Pasting, UV Coats</strong>
              </h2>
            `
            }
          </div>
        </div>
      `;
    },

    // Multi-style (unchanged - used for both single and multiple stickers)
    getMultiStickerStyles() {
      return `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: helvetica;
            background: white;
            margin: 0;
            padding: 0;
          }
          
          .print-page {
            width: 100%;
            min-height: 100%;
            page-break-after: always;
            display: flex;
            align-items: center;
            justify-content: center;
            // padding: 0.25in;
          }
          
          .print-page:last-child {
            page-break-after: avoid;
          }
            
          .sticker-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 0.2in;   
            width: 100%;
            max-width: 12in;
            height: 100%;
            max-height: 15in;
          }

          .sticker-content {
            width: 100%;
            height: 100%;
            max-width: 4in;
            min-width: 3.6in;
            min-height: 5.6in;
            border: 2px solid black;
            box-sizing: border-box;
            padding: 5px;
            background: white;
            display: flex;
            flex-direction: column;
            font-family: helvetica;
            page-break-inside: avoid;
          }
          
          .sticker-content.landscape {
            max-width: 4in;
            min-width: 4in;
            min-height: 5.6in;
            grid-column: span 2;
            width: 4in;
          }
          
          .empty-slot {
            width: 100%;
            height: 100%;
            max-height: 6in;
          }
          
          .product-name-header {
            background: black;
            color: white;
            text-align: center;
            padding: 6px 2px;
            margin: -8px -8px 6px -8px;
          }
          
          .product-name {
            font-size: 16px;
            margin: 0;
            text-transform: uppercase;
            font-weight: bold;
          }
          
          .landscape .product-name {
            font-size: 18px;
          }
          
          .info-row {
            padding: 3px 0;
            border-bottom: 1px solid black;
            font-size: 18px;
          }
          
          .batch-number {
            border: 2px solid black;
            box-sizing: border-box;
            text-align: center;
            font-size: 24px;
            background: white;
            margin: 6px 0;
          }
          
          .landscape .batch-number {
            font-size: 20px;
          }
          
          .barcode-section {
            margin: 8px 0;
            text-align: center;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 80px;
          }
          
          .barcode-section img {
            max-width: 100%;
            height: 80px !important;
            object-fit: contain;
          }
          
          .footer {
            text-align: center;
            border-top: 1px solid black;
            margin-top: auto;
            padding-top: 0px;
            font-size: 24px;
          }
          
          .company-name {
            font-size: 24px;
            margin: 0px 0;
            font-weight: bold;
          }
          
          .landscape .company-name {
            font-size: 18px;
          }
          
          .address, .contact-web {
            margin: 1px 0;
            font-size: 12px;
            line-height: 1.2;
          }
          
          .landscape .address,
          .landscape .contact-web {
            font-size: 10px;
          }
          
          .separator-line {
            height: 1px;
            background: black;
            margin: 0px 0;
          }
          
          .product-line1, .product-line2 {
            margin: 2px 0;
            font-size: 12px;
            line-height: 1.1;
          }
          
          .landscape .product-line1,
          .landscape .product-line2 {
            font-size: 9px;
          }
          
          @media print {
            @page {
              size: A4;
              margin: 0.25in;
            }
            
            .print-page {
              margin: 0;
              padding: 0.1in;
              min-height: auto;
              height: auto;
            }
            
            .sticker-grid {
              height: 11in;
              min-height: 10in;
            }
            
            .barcode-section img {
              height: 80px !important;
              max-height: 80px !important;
            }
          }
        </style>
      `;
    },

    // Backward compatibility method
    printStickers() {
      if (this.inventoryItems && this.inventoryItems.length > 1) {
        this.printMultipleStickers();
      } else {
        this.printSticker();
      }
    },
  },
};
</script>

<style scoped>
.sticker-container {
  font-family: Arial, sans-serif;
}

.sticker-content {
  width: 4in;
  height: 6in;
  border: 2px solid black;
  box-sizing: border-box;
  padding: 10px;
  background: white;
  display: flex;
  flex-direction: column;
}

.sticker-content.landscape {
  width: 6in;
  height: 4in;
}

.product-name-header {
  background: black;
  color: white;
  text-align: center;
  padding: 10px 0;
  margin: -10px -10px 10px -10px;
}

.product-name {
  font-size: 18px;
  margin: 0;
  text-transform: uppercase;
  font-weight: bold;
}

.info-row {
  padding: 5px 0;
  border-bottom: 1px solid black;
  font-size: 24px;
}

.batch-number {
  border: 2px solid black;
  box-sizing: border-box;
  margin: 20px;
  text-align: center;
  font-size: 48px;
  background: white;
}

.landscape .batch-number {
  font-size: 36px;
}

.barcode-section {
  margin: 15px 0;
  text-align: center;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

.barcode-canvas {
  max-width: 400px;
  height: 80px;
}

.footer {
  text-align: center;
  border-top: 1px solid black;
  margin-top: auto;
  padding-top: 10px;
  font-size: 10px;
}

.company-name {
  font-size: 24px;
  margin: 5px 0;
  font-weight: bold;
}

.landscape .company-name {
  font-size: 24px;
}

.address,
.contact-web {
  margin: 3px 0;
  font-size: 9px;
}

.landscape .address,
.landscape .contact-web {
  font-size: 22px;
}

.separator-line {
  height: 1px;
  background: black;
  margin: 5px 0;
}

.product-line1,
.product-line2 {
  margin: 2px 0;
  font-size: 12px;
}

.landscape .product-line1,
.landscape .product-line2 {
  font-size: 12px;
}

.footer-logo {
  width: 60px;
  margin-bottom: 5px;
}

.print-controls {
  text-align: center;
  margin-top: 20px;
}

.print-btn {
  padding: 8px 16px;
  margin: 5px;
  font-size: 14px;
  background: black;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.print-btn:hover:not(:disabled) {
  background: #333;
}

.print-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.print-btn.secondary {
  background: #555;
}

.print-btn.secondary:hover:not(:disabled) {
  background: #777;
}
</style>
