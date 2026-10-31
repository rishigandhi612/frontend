<template>
  <div class="shipping-printer">
    <!-- 1. Upload -->
    <div class="upload-box">
      <label class="file-btn">
        Choose CSV file
        <input
          type="file"
          accept=".csv,.tsv,text/csv"
          @change="onFile"
          hidden
        />
      </label>
      <span v-if="fileName" class="file-name"
        >{{ fileName }} · {{ rows.length }} labels</span
      >
      <span v-else class="hint">
        Columns: shipping_name, shipping_phone, shipping_city, shipping_address
      </span>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- 2. Preview (landscape, exactly as the label reads) -->
    <template v-if="rows.length">
      <iframe
        class="preview-frame"
        :srcdoc="previewDoc"
        title="Shipping sticker preview"
      />

      <div class="controls">
        <button class="btn" :disabled="index === 0" @click="index--">
          Previous
        </button>
        <span class="counter">{{ index + 1 }} of {{ rows.length }}</span>
        <button
          class="btn"
          :disabled="index === rows.length - 1"
          @click="index++"
        >
          Next
        </button>
      </div>

      <div class="controls">
        <button
          class="btn primary"
          :disabled="printing"
          @click="printItems([rows[index]])"
        >
          {{ printing ? "Printing..." : "Print this label" }}
        </button>
        <button
          v-if="rows.length > 1"
          class="btn primary"
          :disabled="printing"
          @click="printItems(rows)"
        >
          {{ printing ? "Printing..." : `Print all labels (${rows.length})` }}
        </button>
      </div>
    </template>
  </div>
</template>

<script>
// Save your mandala / diya illustration here (any path works, just match the import)
import diyaImg from "@/assets/diya-mandala.png";

const REQUIRED = [
  "shipping_name",
  "shipping_phone",
  "shipping_city",
  "shipping_address",
];

const SENDER = {
  name: "Hemant Traders",
  address: "1281, Sadashiv Peth, Vertex Arcade, Pune - 411030",
  phone: "(+91) 9422080922 / 9420699675",
};

export default {
  name: "ShippingStickerPrinter",
  data() {
    return {
      rows: [],
      index: 0,
      fileName: "",
      error: "",
      printing: false,
    };
  },
  computed: {
    // Absolute URL so the image also loads inside srcdoc iframes
    imageUrl() {
      try {
        return new URL(diyaImg, window.location.href).href;
      } catch (e) {
        return diyaImg;
      }
    },
    previewDoc() {
      if (!this.rows.length) return "";
      return this.buildDocument([this.rows[this.index]], { rotate: false });
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

    // Smaller type for longer addresses so it always fits
    addressSize(text) {
      const n = text.length;
      if (n <= 60) return 19;
      if (n <= 100) return 16;
      if (n <= 150) return 14;
      return 12;
    },

    nameSize(text) {
      const n = text.length;
      if (n <= 22) return 30;
      if (n <= 32) return 25;
      return 20;
    },

    /* ---------- CSV ---------- */
    parseCSV(text) {
      text = text.replace(/^\uFEFF/, "");
      const firstLine = text.split(/\r?\n/)[0] || "";
      const delim = firstLine.includes("\t") ? "\t" : ",";

      const out = [];
      let row = [];
      let field = "";
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
          if (c === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i++;
            } else inQuotes = false;
          } else field += c;
        } else if (c === '"') inQuotes = true;
        else if (c === delim) {
          row.push(field);
          field = "";
        } else if (c === "\n" || c === "\r") {
          if (c === "\r" && text[i + 1] === "\n") i++;
          row.push(field);
          field = "";
          out.push(row);
          row = [];
        } else field += c;
      }
      if (field !== "" || row.length) {
        row.push(field);
        out.push(row);
      }
      return out.filter((r) => r.some((v) => v.trim()));
    },

    async onFile(event) {
      const file = event.target.files?.[0];
      event.target.value = ""; // allow re-uploading the same file
      if (!file) return;

      this.error = "";
      this.rows = [];
      this.index = 0;
      this.fileName = file.name;

      try {
        const table = this.parseCSV(await file.text());
        if (table.length < 2) throw new Error("The file has no data rows.");

        const headers = table[0].map((h) => h.trim().toLowerCase());
        const missing = REQUIRED.filter((h) => !headers.includes(h));
        if (missing.length) {
          throw new Error("Missing column(s): " + missing.join(", "));
        }

        this.rows = table
          .slice(1)
          .map((cells) => {
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = (cells[i] ?? "").trim().replace(/\s*[\r\n]+\s*/g, ", ");
            });
            return obj;
          })
          .filter((r) => r.shipping_name || r.shipping_address);

        if (!this.rows.length) throw new Error("No usable rows found.");
      } catch (err) {
        this.error = err.message;
        this.fileName = "";
      }
    },

    /* ---------- markup ---------- */
    stickerHTML(row) {
      const e = this.escape;
      const name = row.shipping_name || "";
      const address = row.shipping_address || "";
      const img = this.imageUrl;

      return `
        <div class="label">
          <div class="banner">
            <img class="orn" src="${img}" alt="">
            <span class="greet">Happy Diwali</span>
            <img class="orn" src="${img}" alt="">
          </div>

          <div class="body">
            <div class="to">
              <div class="tag">Ship to</div>
              <div class="name" style="font-size:${this.nameSize(name)}px">${e(
        name,
      )}</div>
              <div class="addr" style="font-size:${this.addressSize(
                address,
              )}px">${e(address)}</div>
              <div class="city">${e(row.shipping_city)}</div>
              ${
                row.shipping_phone
                  ? `<div class="phone">Ph: ${e(row.shipping_phone)}</div>`
                  : ""
              }
            </div>

            <div class="from">
              <div class="tag">From</div>
              <div class="from-name">${e(SENDER.name)}</div>
              <div class="from-line">${e(SENDER.address)}</div>
              <div class="from-line">${e(SENDER.phone)}</div>
              <img class="seal" src="${img}" alt="">
            </div>
          </div>

          <div class="wish">Wishing you a bright and prosperous Diwali</div>
        </div>`;
    },

    /*
     * rotate: true  -> real print: 4x6in page, 6x4 label rotated 90deg inside it
     * rotate: false -> on-screen preview: shown landscape so it is easy to read
     */
    buildDocument(items, { rotate = true } = {}) {
      const pages = items
        .map(
          (row) => `
        <div class="page">
          <div class="rot">${this.stickerHTML(row)}</div>
        </div>`,
        )
        .join("");

      return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Shipping Labels - ${items.length}</title>
    ${this.getStyles(rotate)}
  </head>
  <body>${pages}</body>
</html>`;
    },

    getStyles(rotate) {
      const pageSize = rotate
        ? "width:4in;height:6in;"
        : "width:6in;height:4in;";
      const rotCss = rotate
        ? "transform-origin:top left;transform:translateX(4in) rotate(90deg);"
        : "";

      return `<style>
        @page { size: 4in 6in; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: white; color: black; font-family: Helvetica, Arial, sans-serif; }
        ${rotate ? "" : "body { overflow: hidden; }"}

        .page {
          ${pageSize}
          position: relative;
          overflow: hidden;
          page-break-after: always;
          break-after: page;
        }
        .page:last-child { page-break-after: auto; break-after: auto; }

        .rot {
          position: absolute;
          top: 0; left: 0;
          width: 6in; height: 4in;
          padding: 0.1in;
          ${rotCss}
        }

        .label {
          width: 100%;
          height: 100%;
          border: 2.5px solid black;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Festive header */
        .banner {
          background: black;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          padding: 5px 0;
        }
        .greet {
          font-family: Georgia, "Times New Roman", serif;
          font-style: italic;
          font-weight: bold;
          font-size: 28px;
          letter-spacing: 1px;
        }
        .orn { width: 36px; height: 36px; filter: invert(1); }

        /* Address area */
        .body { flex: 1; display: flex; min-height: 0; }

        .to {
          flex: 1 1 62%;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          min-width: 0;
        }
        .tag { font-size: 12px; font-weight: bold; margin-bottom: 1px; }
        .name { font-weight: bold; line-height: 1.1; word-break: break-word; }
        .addr { line-height: 1.25; word-break: break-word; }
        .city { font-size: 22px; font-weight: bold; margin-top: 2px; }
        .phone {
          font-size: 20px;
          font-weight: bold;
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid black;
        }

        .from {
          flex: 1 1 38%;
          border-left: 2px dashed black;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 2px;
        }
        .from-name { font-size: 17px; font-weight: bold; }
        .from-line { font-size: 11px; line-height: 1.25; }
        .seal { width: 74px; height: 74px; margin-top: auto; }

        /* Footer greeting */
        .wish {
          border-top: 2px solid black;
          text-align: center;
          font-family: Georgia, "Times New Roman", serif;
          font-style: italic;
          font-size: 14px;
          padding: 4px 0;
        }
      </style>`;
    },

    /* ---------- printing (hidden iframe) ---------- */
    printHtml(html) {
      return new Promise((resolve, reject) => {
        const iframe = document.createElement("iframe");
        iframe.style.cssText =
          "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
        document.body.appendChild(iframe);

        let done = false;
        const cleanup = () => {
          if (done) return;
          done = true;
          setTimeout(() => iframe.remove(), 500);
          resolve();
        };

        iframe.onload = async () => {
          try {
            const win = iframe.contentWindow;
            // make sure the illustration has loaded before printing
            await Promise.all(
              [...win.document.images].map((img) =>
                img.complete
                  ? Promise.resolve()
                  : new Promise((r) => {
                      img.onload = img.onerror = r;
                    }),
              ),
            );
            win.onafterprint = cleanup;
            win.focus();
            win.print();
            setTimeout(cleanup, 60000); // fallback if afterprint never fires
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
        await this.printHtml(this.buildDocument(items, { rotate: true }));
      } catch (error) {
        console.error("Print error:", error);
        alert("Error printing label: " + error.message);
      } finally {
        this.printing = false;
      }
    },
  },
};
</script>

<style scoped>
.shipping-printer {
  font-family: Arial, sans-serif;
}

.upload-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.file-btn,
.btn {
  padding: 8px 16px;
  font-size: 14px;
  background: #555;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}
.file-btn:hover,
.btn:hover:not(:disabled) {
  background: #777;
}
.btn.primary {
  background: #222;
}
.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.file-name {
  font-size: 14px;
}
.hint {
  font-size: 13px;
  color: #666;
}
.error {
  color: #b00020;
  font-size: 14px;
  margin-bottom: 10px;
}

.preview-frame {
  display: block;
  width: 6in;
  height: 4in;
  border: 1px solid #ccc;
  background: white;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}
.counter {
  font-size: 14px;
  min-width: 70px;
  text-align: center;
}
</style>
