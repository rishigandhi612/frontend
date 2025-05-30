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
          {{ capitalizeFirstLetter(productName) || "Product Name" }}
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
          <!-- Net Weight: <strong> {{ inventoryItem.netWeight || "N/A" }} </strong> kg -->
        </v-col>
        <v-col cols="6">
          Net Weight: <strong> {{ inventoryItem.netWeight || "N/A" }} </strong> kg
        </v-col>
      </v-row>

      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Length (Approx): <strong>{{ inventoryItem.mtr || "N/A" }}</strong> meters
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
        <img
          ref="barcodeImage"
          class="barcode-image"
          style="display: none"
          alt="Barcode"
        />
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

    <!-- Print Controls (Enhanced) -->
    <div class="print-controls no-print">
      <button 
        @click="printSticker" 
        class="print-btn secondary"
        v-if="inventoryItem"
      >
        Print Single Sticker
      </button>
      <button 
        @click="printMultipleStickers" 
        class="print-btn secondary"
        v-if="inventoryItems && inventoryItems.length > 1"
      >
        Print All Stickers ({{ inventoryItems.length }} items)
      </button>
    </div>

    <!-- Hidden Multi-Sticker Data for Batch Printing -->
    <div style="display: none;" ref="hiddenMultiData">
      <div 
        v-for="(item, index) in inventoryItems" 
        :key="index"
        class="hidden-sticker-data"
        :data-item-index="index"
      >
        <canvas :ref="el => setBarcodeRef(index, el)" />
      </div>
    </div>
  </div>
</template>

<script>
import JsBarcode from "jsbarcode";
import logo from "@/assets/HoloLogo.png";

export default {
  name: "InventorySticker",
  props: {
    inventoryItem: Object, // Single item for preview
    inventoryItems: Array, // Multiple items for batch printing
    productName: String,
  },
  data() {
    return {
      logo,
      barcodeRefs: {},
    };
  },
  mounted() {
    this.generateBarcode();
    if (this.inventoryItems && this.inventoryItems.length > 0) {
      this.$nextTick(() => {
        this.generateMultipleBarcodes();
      });
    }
  },
  methods: {
    setBarcodeRef(index, el) {
      this.barcodeRefs[index] = el;
    },
    
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
      if (this.$refs.barcodeCanvas && this.inventoryItem && this.inventoryItem.rollId) {
        JsBarcode(this.$refs.barcodeCanvas, this.inventoryItem.rollId, {
          format: "CODE128",
          displayValue: true,
          fontSize: 18,
          height: 50,
        });
        this.generateBarcodeImage();
      }
    },
    
    generateMultipleBarcodes() {
      if (this.inventoryItems) {
        this.inventoryItems.forEach((item, index) => {
          const canvas = this.barcodeRefs[index];
          if (canvas && item.rollId) {
            JsBarcode(canvas, item.rollId, {
              format: "CODE128",
              displayValue: true,
              fontSize: 18,
              height: 50,
            });
          }
        });
      }
    },
    
    generateBarcodeImage() {
      if (this.$refs.barcodeCanvas && this.$refs.barcodeImage) {
        const imageData = this.$refs.barcodeCanvas.toDataURL("image/png");
        this.$refs.barcodeImage.src = imageData;
      }
    },
    
    // Alias method for backward compatibility
    printStickers() {
      if (this.inventoryItems && this.inventoryItems.length > 1) {
        this.printMultipleStickers();
      } else {
        this.printSticker();
      }
    },
    
    // Original single print functionality (matching second file exactly)
    printSticker() {
      // Ensure sticker content exists
      const stickerContent = this.$refs.stickerContent;
      if (!stickerContent) {
        console.error("Sticker content not found.");
        return;
      }

      // Get barcode image from canvas
      let barcodeImageData = "";
      if (this.$refs.barcodeCanvas) {
        try {
          barcodeImageData = this.$refs.barcodeCanvas.toDataURL("image/png");
        } catch (err) {
          console.error("Error generating barcode image:", err);
        }
      }

      // Clone the sticker DOM content
      const clonedContent = stickerContent.cloneNode(true);

      // Replace the canvas with an image in the cloned content
      const canvas = clonedContent.querySelector("canvas");
      if (canvas && barcodeImageData) {
        const img = document.createElement("img");
        img.src = barcodeImageData;
        img.style.cssText = "max-width: 300px; height: 75px;";
        img.alt = "Barcode";
        canvas.parentNode.replaceChild(img, canvas);
      }

      // Remove hidden barcode image if present
      const hiddenImg = clonedContent.querySelector(".barcode-image");
      if (hiddenImg) hiddenImg.remove();

      // Create a new print window
      const printWindow = window.open("", "_blank", "width=600,height=400");
      if (!printWindow) {
        console.error("Popup blocked. Please allow popups for this site.");
        return;
      }

      // Write minimal HTML to avoid blocking
      printWindow.document.write(
        "<!DOCTYPE html><html><head><title>Loading...</title></head><body>Loading...</body></html>"
      );
      printWindow.document.close();

      // Once loaded, inject content
      printWindow.onload = () => {
        const isLandscape = this.inventoryItem.type === "non-film";

        printWindow.document.head.innerHTML = `
      <meta charset="UTF-8">
      <title>Print Sticker</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: helvetica;
          background: white;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        .sticker-content {
          ${
            isLandscape
              ? "width: 5.80in; height: 4in;"
              : "width: 3.8in; height: 5.80in;"
          }
          border: 2px solid black;
          box-sizing: border-box;
          padding: 10px;
          background: white;
          display: flex;
          flex-direction: column;
        }
        .product-name-header {
          background: black;
          color: white;
          text-align: center;
          padding: 10px 0;
          margin: -10px -10px 10px -10px;
        }
        .product-name {
          font-size: 24px;
          margin: 0;
          text-transform: uppercase;
          font-weight: bold;
        }
        .batch-number{
          border: 2px solid black;
          box-sizing: border-box;
          padding: 5px 0;
          text-align: center;
          font-size: ${isLandscape ? "36px" : "48px"};
          background: white;
        }
        .info-row {
          padding: 5px 0;
          border-bottom: 1px solid black;
          font-size: 18px;
        }
        .barcode-section {
          margin: 2px 0;
          text-align: center;
        }
        .barcode-section img {
          max-width: 200px;
          height: 50px;
        }
        .footer {
          text-align: center;
          border-top: 1px solid black;
          margin-top: 2px;
          padding-top: 10px;
          font-size: 15px;
        }
        .company-name {
          font-size: ${isLandscape ? "36px" : "30px"};
          margin: 5px 0;
          font-weight: bold;
        }
        .address, .contact-web {
          margin: 3px 0;
          font-size: ${isLandscape ? "14px" : "12px"};
        }
        .separator-line {
          height: 1px;
          background: black;
          margin: 5px 0;
        }
        .product-line1, .product-line2 {
          margin: 2px 0;
          font-size: ${isLandscape ? "14px" : "12px"};
        }
        .footer-logo {
          width: 60px;
          margin-bottom: 5px;
        }
        @media print {
          body { padding: 5; margin: 0; display: block; }
          .sticker-content { margin: 0; }
          @page { size: ${
            isLandscape ? "landscape" : "portrait"
          }; margin: 0.5in; }
        }
      </style>
    `;

        printWindow.document.body.innerHTML = clonedContent.outerHTML;

        // Wait for all images to load before printing
        const images = printWindow.document.images;
        let loadedCount = 0;

        function tryPrint() {
          loadedCount++;
          if (loadedCount === images.length || images.length === 0) {
            setTimeout(() => {
              printWindow.print();
              printWindow.onafterprint = () => printWindow.close();
            }, 200);
          }
        }

        for (let img of images) {
          if (img.complete) {
            tryPrint();
          } else {
            img.onload = tryPrint;
            img.onerror = tryPrint;
          }
        }
      };
    },

    // Enhanced batch print functionality
    printMultipleStickers() {
      if (!this.inventoryItems || this.inventoryItems.length === 0) {
        console.error("No inventory items to print.");
        return;
      }

      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        console.error("Popup blocked. Please allow popups for this site.");
        return;
      }

      // Paginate items (4 per page)
      const itemsPerPage = 4;
      const pages = [];
      for (let i = 0; i < this.inventoryItems.length; i += itemsPerPage) {
        pages.push(this.inventoryItems.slice(i, i + itemsPerPage));
      }

      let allPagesHTML = '';
      pages.forEach((pageItems, pageIndex) => {
        let pageHTML = '<div class="print-page"><div class="sticker-grid">';
        
        pageItems.forEach((item, itemIndex) => {
          // Calculate global index for barcode reference
          const globalIndex = pageIndex * itemsPerPage + itemIndex;
          
          // Get barcode image for this item
          let barcodeImageData = "";
          const canvas = this.barcodeRefs[globalIndex];
          if (canvas) {
            try {
              barcodeImageData = canvas.toDataURL("image/png");
            } catch (err) {
              console.error("Error generating barcode image:", err);
            }
          }

          const isLandscape = item.type === 'non-film';
          pageHTML += this.generateStickerHTML(item, barcodeImageData, isLandscape);
        });

        // Fill empty slots if needed
        const emptySlots = itemsPerPage - pageItems.length;
        for (let j = 0; j < emptySlots; j++) {
          pageHTML += '<div class="sticker-placeholder"></div>';
        }

        pageHTML += '</div></div>';
        allPagesHTML += pageHTML;
      });

      const styles = this.getMultiStickerStyles();

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Stickers - ${this.inventoryItems.length} items</title>
            ${styles}
          </head>
          <body>
            ${allPagesHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      };
    },

 
generateStickerHTML(item, barcodeImageData, isLandscape) {
  const barcodeImg = barcodeImageData ? 
    `<img src="${barcodeImageData}" style="max-width: 200px; height: 50px;" alt="Barcode">` : 
    '';

  const filmRows = item.type === 'film' ? `
    <div class="info-row">Roll No: <strong>${item.rollId || "N/A"}</strong></div>
    <div class="info-row">Thickness: <strong>${item.micron || "N/A"}</strong> µm</div>
    <div class="info-row">Size: <strong>${this.displaySizeInInches(item.width)}</strong></div>
    <div class="info-row">Size: ${this.displaySizeInMm(item.width)}</div>
    <div class="info-row">Gross Weight: ${item.grossWeight || "N/A"} kg</div>
    <div class="info-row">Core Weight: ${this.calculateCoreWeight(item)} kg</div>
    <div class="info-row">Net Weight: <strong>${item.netWeight || "N/A"}</strong> kg</div>
  ` : `
    <div class="batch-number">
      <div style="display: flex; justify-content: space-between;">
        <div>Batch No: <strong>${item.rollId || "N/A"}</strong></div>
        <div>Net Weight: <strong>${item.netWeight || "N/A"}</strong> kg</div>
      </div>
    </div>
  `;

  return `
    <div class="sticker-content ${isLandscape ? 'landscape' : ''}">
      <div class="product-name-header">
        <h1 class="product-name">${this.capitalizeFirstLetter(this.productName) || "Product Name"}</h1>
      </div>
      ${filmRows}
      <div class="barcode-section">${barcodeImg}</div>
      <div class="footer">
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
      </div>
    </div>
  `;
},

getMultiStickerStyles() {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      @media print {
        @page {
          size: A4;
          margin: 0.5in;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: helvetica;
          background: white;
        }
        .print-page {
          width: 100%;
          height: 100vh;
          page-break-after: always;
          position: relative;
        }
        .print-page:last-child {
          page-break-after: avoid;
        }
        .sticker-grid {
          display: grid;
          grid-template-columns: 4in 4in;
          grid-template-rows: 5.80in 5.80in;
          gap: 0.2in;
          width: 100%;
          height: 100%;
          justify-content: start;
          align-content: start;
          padding: 0;
        }
        
        /* Main sticker container - exact size as single print */
        .sticker-content {
          width: 4in;
          height: 5.80in;
          border: 2px solid black;
          box-sizing: border-box;
          padding: 20px;
          background: white;
          display: flex;
          flex-direction: column;
          font-family: helvetica;
          page-break-inside: avoid;
        }
        
        /* Landscape orientation for non-film items */
        .sticker-content.landscape {
          width: 5.80in;
          height: 4in;
          grid-column: span 2; /* Take full width for landscape */
        }
        
        /* Adjust grid for landscape items */
        .sticker-grid.has-landscape {
          grid-template-columns: 5.80in;
          grid-template-rows: repeat(auto-fit, 4in);
          gap: 0.2in;
        }
        
        .sticker-placeholder {
          width: 4in;
          height: 5.80in;
        }
        
        /* Product name header - matching single print */
        .product-name-header {
          background: black;
          color: white;
          text-align: center;
          padding: 10px 0;
          margin: -10px -10px 10px -10px;
        }
        
        .product-name {
          font-size: 24px;
          margin: 0;
          text-transform: uppercase;
          font-weight: bold;
        }
        
        /* Info rows - matching single print */
        .info-row {
          padding: 5px 0;
          border-bottom: 1px solid black;
          font-size: 18px;
        }
        
        /* Batch number styling - matching single print exactly */
        .batch-number {
          border: 2px solid black;
          box-sizing: border-box;
          padding: 5px 0;
          text-align: center;
          font-size: 48px;
          background: white;
        }
        
        /* Landscape batch number */
        .landscape .batch-number {
          font-size: 36px;
        }
        
        /* Barcode section - matching single print */
        .barcode-section {
          margin: 2px 0;
          text-align: center;
        }
        
        .barcode-section img {
          max-width: 200px;
          height: 50px;
        }
        
        /* Footer - matching single print */
        .footer {
          text-align: center;
          border-top: 1px solid black;
          margin-top: 2px;
          padding-top: 10px;
          font-size: 15px;
        }
        
        .company-name {
          font-size: 30px;
          margin: 5px 0;
          font-weight: bold;
        }
        
        /* Landscape company name */
        .landscape .company-name {
          font-size: 36px;
        }
        
        .address, .contact-web {
          margin: 3px 0;
          font-size: 12px;
        }
        
        /* Landscape address and contact */
        .landscape .address,
        .landscape .contact-web {
          font-size: 14px;
        }
        
        .separator-line {
          height: 1px;
          background: black;
          margin: 5px 0;
        }
        
        .product-line1, .product-line2 {
          margin: 2px 0;
          font-size: 12px;
        }
        
        /* Landscape product lines */
        .landscape .product-line1,
        .landscape .product-line2 {
          font-size: 14px;
        }
        
        .footer-logo {
          width: 60px;
          margin-bottom: 5px;
        }
      }
      
      /* Screen styles for preview */
      @media screen {
        body {
          font-family: helvetica;
          background: white;
          padding: 20px;
        }
        .print-page {
          margin-bottom: 30px;
          border: 1px dashed #ccc;
          padding: 20px;
        }
        .sticker-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 20px;
          max-width: 800px;
        }
        .sticker-content {
          width: 200px;
          height: 290px;
          border: 2px solid black;
          box-sizing: border-box;
          padding: 5px;
          background: white;
          display: flex;
          flex-direction: column;
          font-family: helvetica;
          transform: scale(0.5);
          transform-origin: top left;
        }
        .sticker-content.landscape {
          width: 290px;
          height: 200px;
        }
      }
    </style>
  `;
}
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

/* Landscape orientation for non-film items */
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
  font-size: 12px;
}

.batch-number {
  border: 2px solid black;
  box-sizing: border-box;
  margin: 20px;
  text-align: center;
  font-size: 48px;
  background: white;
}

/* Adjust batch number size for landscape */
.landscape .batch-number {
  font-size: 36px;
}

.barcode-section {
  margin: 15px 0;
  text-align: center;
}

.barcode-canvas,
.barcode-image {
  max-width: 200px;
  height: 100px;
}

.footer {
  text-align: center;
  border-top: 1px solid black;
  margin-top: auto;
  padding-top: 10px;
  font-size: 10px;
}

.company-name {
  font-size: 12px;
  margin: 5px 0;
  font-weight: bold;
}

/* Larger company name for landscape */
.landscape .company-name {
  font-size: 18px;
}

.address,
.contact-web {
  margin: 3px 0;
  font-size: 9px;
}

/* Larger text for landscape */
.landscape .address,
.landscape .contact-web {
  font-size: 11px;
}

.separator-line {
  height: 1px;
  background: black;
  margin: 5px 0;
}

.product-line1,
.product-line2 {
  margin: 2px 0;
  font-size: 8px;
}

/* Larger product lines for landscape */
.landscape .product-line1,
.landscape .product-line2 {
  font-size: 10px;
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
}

.print-btn.secondary {
  background: #555;
}

.hidden-sticker-data {
  display: none;
}
</style>