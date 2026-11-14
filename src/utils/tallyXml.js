function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name, value) {
  return `<${name}>${escapeXml(value)}</${name}>`;
}

function amountText(value) {
  return Number(value).toFixed(2);
}

function buildVoucherXml(invoice) {
  if (!invoice || !invoice.invoiceNumber) {
    throw new Error("Invoice details are missing.");
  }

  const products = new Map();

  for (const item of invoice.products || []) {
    const name = item.name || item.product?.name;

    if (!name) {
      throw new Error(
        `A product is missing its name in invoice ${invoice.invoiceNumber}.`,
      );
    }

    const productId = item.product?._id || name;
    const rate = Number(item.unit_price || 0);
    const width = item.width ?? 0;
    const unit = item.unit || "Kg";
    const key = JSON.stringify([productId, name, rate, width, unit]);

    if (!products.has(key)) {
      products.set(key, {
        name,
        rate,
        width,
        unit,
        quantity: 0,
        amount: 0,
      });
    }

    const product = products.get(key);
    product.quantity += Number(item.quantity || 0);
    product.amount += Number(
      item.total_price ?? Number(item.quantity || 0) * rate,
    );
  }

  const lines = [...products.values()];
  const amount = Number(invoice.totalAmount || 0);
  const cgst = Number(invoice.cgst || 0);
  const sgst = Number(invoice.sgst || 0);
  const igst = Number(invoice.igst || 0);
  const otherCharges = Number(invoice.otherCharges || 0);
  const grandTotal = Number(invoice.grandTotal || 0);
  const roundOff = Number(
    (
      grandTotal -
      amount -
      cgst -
      sgst -
      igst -
      otherCharges +
      0.01
    ).toFixed(2),
  );

  const date = new Date(invoice.createdAt);
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Invalid invoice creation date for invoice ${invoice.invoiceNumber}.`,
    );
  }

  const voucherDate =
    `${date.getFullYear()}` +
    `${String(date.getMonth() + 1).padStart(2, "0")}` +
    `${String(date.getDate()).padStart(2, "0")}`;

  const address = invoice.customer?.address || {};
  const addressLines = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);
  const addressXml = addressLines
    .map((line) => tag("ADDRESS", line))
    .join("");
  const buyerAddressXml = addressLines
    .map((line) => tag("BASICBUYERADDRESS", line))
    .join("");

  const inventoryXml = lines
    .map((item) => {
      const quantity = Number(item.quantity);
      const lineAmount = Number(item.amount);

      return `
            <ALLINVENTORYENTRIES.LIST>
              ${tag("STOCKITEMNAME", item.name)}
              ${tag("ISDEEMEDPOSITIVE", "No")}
              ${tag("ISLASTDEEMEDPOSITIVE", "No")}
              ${tag("RATE", `${amountText(item.rate)}/${item.unit}.`)}
              ${tag("AMOUNT", amountText(lineAmount))}
              ${tag("ACTUALQTY", ` ${quantity} ${item.unit}.`)}
              ${tag("BILLEDQTY", ` ${quantity} ${item.unit}.`)}

              <BATCHALLOCATIONS.LIST>
                ${tag("GODOWNNAME", "Company")}
                ${tag("BATCHNAME", "Primary Batch")}
                ${tag("DESTINATIONGODOWNNAME", "Company")}
                ${tag("AMOUNT", amountText(lineAmount))}
                ${tag("ACTUALQTY", ` ${quantity} ${item.unit}.`)}
                ${tag("BILLEDQTY", ` ${quantity} ${item.unit}.`)}
              </BATCHALLOCATIONS.LIST>

              <ACCOUNTINGALLOCATIONS.LIST>
                ${tag("OLDAUDITENTRYIDS.LIST", "")}
                ${tag("LEDGERNAME", "Sales @ 18%")}
                ${tag("ISDEEMEDPOSITIVE", "No")}
                ${tag("AMOUNT", amountText(lineAmount))}
              </ACCOUNTINGALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>`;
    })
    .join("");

  const partyName = invoice.customer?.name || "";
  const state = address.state || "Maharashtra";

  const ledgerXml = ({ name, value, isParty = false }) => `
          <LEDGERENTRIES.LIST>
            ${tag("OLDAUDITENTRYIDS.LIST", "")}
            ${tag("LEDGERNAME", name)}
            ${tag("ISDEEMEDPOSITIVE", value < 0 ? "Yes" : "No")}
            ${tag("ISPARTYLEDGER", isParty ? "Yes" : "No")}
            ${tag("AMOUNT", amountText(value))}
            ${
              isParty
                ? `<BILLALLOCATIONS.LIST>
                    ${tag("NAME", invoice.invoiceNumber)}
                    ${tag("BILLTYPE", "New Ref")}
                    ${tag("AMOUNT", amountText(value))}
                  </BILLALLOCATIONS.LIST>`
                : ""
            }
          </LEDGERENTRIES.LIST>`;

  const ledgerEntries = [
    ledgerXml({ name: partyName, value: -grandTotal, isParty: true }),
    cgst ? ledgerXml({ name: "CGST @ 9%", value: cgst }) : "",
    sgst ? ledgerXml({ name: "SGST @ 9%", value: sgst }) : "",
    igst ? ledgerXml({ name: "IGST @ 18%", value: igst }) : "",
    otherCharges ? ledgerXml({ name: "Other Charges", value: otherCharges }) : "",
    roundOff ? ledgerXml({ name: "Round Off", value: roundOff }) : "",
  ].join("");

  return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <ADDRESS.LIST TYPE="String">${addressXml}</ADDRESS.LIST>
            <BASICBUYERADDRESS.LIST TYPE="String">${buyerAddressXml}</BASICBUYERADDRESS.LIST>
            ${tag("OLDAUDITENTRYIDS.LIST", "")}
            ${tag("DATE", voucherDate)}
            ${tag("BILLOFLADINGDATE", voucherDate)}
            ${tag("STATENAME", state)}
            ${tag(
              "NARRATION",
              invoice.narration || invoice.transporter?.name
                ? invoice.narration ||
                    `By ${invoice.transporter?.name || "Hand"}`
                : "",
            )}
            ${
              invoice.customer?.gstin
                ? tag("PARTYGSTIN", invoice.customer.gstin)
                : ""
            }
            ${tag("PARTYNAME", partyName)}
            ${tag("VOUCHERTYPENAME", "Sales")}
            ${tag("REFERENCE", invoice.invoiceNumber)}
            ${tag("VOUCHERNUMBER", invoice.invoiceNumber)}
            ${tag("PARTYLEDGERNAME", partyName)}
            ${tag("BASICBASEPARTYNAME", partyName)}
            ${tag("PERSISTEDVIEW", "Invoice Voucher View")}
            ${tag("PLACEOFSUPPLY", state)}
            ${tag("COUNTRYOFRESIDENCE", "India")}
            ${tag("BASICSHIPPEDBY", invoice.transporter?.name || "By Hand")}
            ${tag("ISINVOICE", "Yes")}
            ${tag("ISCANCELLED", "No")}
            ${tag("EFFECTIVEDATE", voucherDate)}
            ${inventoryXml}
            ${ledgerEntries}
          </VOUCHER>
        </TALLYMESSAGE>`;
}

export function buildTallyXml(invoices) {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    throw new Error("At least one invoice is required.");
  }

  const vouchersXml = invoices.map(buildVoucherXml).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>HEMANT TRADERS</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${vouchersXml}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}
