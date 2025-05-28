<template>
  <div class="sticker-container">
    <div class="sticker-content" ref="stickerContent">
      <div class="product-name-header">
        <h1 class="product-name">
          {{ capitalizeFirstLetter(productName) || "Product Name" }}
        </h1>
      </div>

      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Roll No: <strong>{{ inventoryItem.rollId || "N/A" }} </strong>
      </div>
      <div
        class="info-row batch-number"
        v-if="inventoryItem.type === 'non-film'"
      >
        Batch No: <strong>{{ inventoryItem.rollId || "N/A" }} </strong>
      </div>
      <div class="info-row" v-if="inventoryItem.type === 'film'">
        Thickness: <strong>{{ inventoryItem.micron || "N/A" }}</strong> µm
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
      <div class="info-row batch-number">
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

    <div class="print-controls no-print">
      <button @click="printSticker" class="print-btn secondary">
        Print Sticker
      </button>
    </div>
  </div>
</template>

<script>
import JsBarcode from "jsbarcode";
import logo from "../assets/HoloLogo.png";

export default {
  name: "InventorySticker",
  props: {
    inventoryItem: Object,
    productName: String,
  },
  data() {
    return {
      logo,
    };
  },
  mounted() {
    this.generateBarcode();
  },
  methods: {
    capitalizeFirstLetter(text) {
      return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
    },
    convertToInches(mm) {
      return (parseFloat(mm) / 25.4).toFixed(1);
    },
    calculateCoreWeight() {
      const gross = parseFloat(this.inventoryItem.grossWeight) || 0;
      const net = parseFloat(this.inventoryItem.netWeight) || 0;
      const core = gross - net;
      return core > 0 ? core.toFixed(1) : "N/A";
    },
    displaySizeInInches() {
      const width = parseFloat(this.inventoryItem.width);
      if (!width) return "N/A";
      return width > 60 ? `${this.convertToInches(width)}"` : `${width}"`;
    },
    displaySizeInMm() {
      const width = parseFloat(this.inventoryItem.width);
      if (!width) return "N/A";
      return width > 60 ? `${width} mm` : `${(width * 25.4).toFixed(1)} mm`;
    },
    generateBarcode() {
      if (this.$refs.barcodeCanvas && this.inventoryItem.rollId) {
        JsBarcode(this.$refs.barcodeCanvas, this.inventoryItem.rollId, {
          format: "CODE128",
          displayValue: true,
          fontSize: 18,
          height: 50,
        });

        // Also generate the image version for printing
        this.generateBarcodeImage();
      }
    },
    generateBarcodeImage() {
      if (this.$refs.barcodeCanvas && this.$refs.barcodeImage) {
        const imageData = this.$refs.barcodeCanvas.toDataURL("image/png");
        this.$refs.barcodeImage.src = imageData;
      }
    },
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
      const printWindow = window.open("", "_blank", "width=400,height=600");
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
          width: 4in;
          height: 5.80in;
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
           margin: 20px; padding: 15px 0;
           text-align: center;
          font-size: 48px;
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
          font-size: 30px;
          margin: 5px 0;
          font-weight: bold;
        }
        .address, .contact-web {
          margin: 3px 0;
          font-size: 12px;
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
        .footer-logo {
          width: 60px;
          margin-bottom: 5px;
        }
        @media print {
          body { padding: 0; margin: 0; display: block; }
          .sticker-content { margin: 0; }
          @page { size: A4; margin: 0.5in; }
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

.address,
.contact-web {
  margin: 3px 0;
  font-size: 9px;
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

/* No print styles needed - we're using a separate print window */
</style>
