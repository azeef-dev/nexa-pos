export function printReceipt(sale, businessName = "NexaPOS") {
    const receiptWindow = window.open("", "_blank", "width=380,height=600");
    if (!receiptWindow) return;

    const itemRows = sale.items
        .map(
            (item) => `
        <tr>
          <td style="padding:4px 0;">${item.name}</td>
          <td style="padding:4px 0;text-align:center;">${item.qty}</td>
          <td style="padding:4px 0;text-align:right;">Rs. ${item.price.toFixed(2)}</td>
        </tr>`
        )
        .join("");

    const html = `
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; font-size: 13px; color: #111; padding: 16px; width: 300px; }
          h2 { text-align: center; margin: 0 0 4px; }
          .meta { text-align: center; font-size: 11px; color: #555; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          .divider { border-top: 1px dashed #999; margin: 8px 0; }
          .totals td { padding: 2px 0; }
          .totals .label { color: #555; }
          .grand { font-weight: bold; font-size: 15px; }
          .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #555; }
        </style>
      </head>
      <body>
        <h2>${businessName}</h2>
        <div class="meta">${new Date(sale.createdAt).toLocaleString()}</div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <td style="font-weight:bold;">Item</td>
              <td style="font-weight:bold;text-align:center;">Qty</td>
              <td style="font-weight:bold;text-align:right;">Price</td>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="divider"></div>
        <table class="totals">
          <tr><td class="label">Subtotal</td><td style="text-align:right;">Rs. ${sale.subtotal.toFixed(2)}</td></tr>
          <tr><td class="label">Tax (5%)</td><td style="text-align:right;">Rs. ${sale.tax.toFixed(2)}</td></tr>
          <tr class="grand"><td>Total</td><td style="text-align:right;">Rs. ${sale.total.toFixed(2)}</td></tr>
        </table>
        ${sale.customer ? `<div class="divider"></div><div>Customer: ${sale.customer.name}${sale.isCredit ? " (Credit)" : ""}</div>` : ""}
        <div class="footer">Thank you for shopping with us!</div>
      </body>
    </html>
  `;

    receiptWindow.document.write(html);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
}