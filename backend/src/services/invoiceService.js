import PDFDocument from "pdfkit";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
}).format(value);

export const generateInvoicePdfBuffer = (order) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", (error) => reject(error));

  doc.fontSize(22).text("Smart Inventory Invoice", { align: "left" });
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor("#444").text(`Order #: ${order.orderNumber}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
  doc.text(`Sold By: ${order.soldBy?.name || "Staff"}`);
  doc.text(`Customer: ${order.customerName || "Walk-in Customer"}`);
  doc.text(`Payment: ${order.paymentMethod}`);
  doc.moveDown(1);

  doc.fillColor("#000").fontSize(12).text("Items", { underline: true });
  doc.moveDown(0.4);

  order.items.forEach((item) => {
    doc
      .fontSize(10)
      .text(`${item.nameSnapshot} (${item.skuSnapshot})`, { continued: true })
      .text(` x ${item.quantity}`, { align: "right" });
    doc
      .fontSize(10)
      .fillColor("#555")
      .text(`${formatCurrency(item.priceSnapshot)} each`, { continued: true })
      .text(`${formatCurrency(item.lineTotal)}`, { align: "right" })
      .fillColor("#000");
    doc.moveDown(0.2);
  });

  doc.moveDown(0.8);
  doc.fontSize(11).text(`Subtotal: ${formatCurrency(order.subtotal)}`, { align: "right" });
  doc.text(`Tax: ${formatCurrency(order.tax)}`, { align: "right" });
  doc.text(`Discount: -${formatCurrency(order.discount)}`, { align: "right" });
  doc.fontSize(14).text(`Total: ${formatCurrency(order.total)}`, { align: "right", underline: true });

  doc.moveDown(2);
  doc.fontSize(10).fillColor("#777").text("Thank you for your business.", { align: "center" });

  doc.end();
});
