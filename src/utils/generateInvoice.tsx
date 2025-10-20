// utils/generateInvoice.js

export function generateInvoiceId() {
  let lastNumber = parseInt(localStorage.getItem("lastInvoiceNumber")) || 0;
  lastNumber += 1;
  localStorage.setItem("lastInvoiceNumber", lastNumber.toString());

  return `INV-${lastNumber.toString().padStart(6, "0")}`;
}
