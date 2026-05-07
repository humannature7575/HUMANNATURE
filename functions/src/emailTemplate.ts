/**
 * HUMAN NATURE — Order Email Template
 * 
 * Premium HTML email template matching the HUMAN NATURE brand aesthetic.
 * Sent to the store owner when a new order is placed.
 */

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  formattedTotal: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    image?: string;
  }>;
  address: {
    title?: string;
    fullName?: string;
    phone?: string;
    city?: string;
    district?: string;
    fullAddress?: string;
  };
}

/**
 * Build the HTML email body for a new order notification.
 */
export function buildOrderEmailHtml(data: OrderEmailData): string {
  const { orderId, customerName, customerPhone, formattedTotal, items, address } = data;

  // Format the current date in Turkish
  const orderDate = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build items rows
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333333;">
        <strong>${escapeHtml(item.name)}</strong>
        <br>
        <span style="font-size: 12px; color: #888888;">
          ${item.size ? `Beden: ${escapeHtml(item.size)}` : ""}
          ${item.size && item.color ? " · " : ""}
          ${item.color ? `Renk: ${escapeHtml(item.color)}` : ""}
        </span>
      </td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #555555; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333333; text-align: right; font-weight: 600;">
        ₺${(item.price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
      </td>
    </tr>`
    )
    .join("");

  // Build address block
  const addressBlock = address
    ? `
    <div style="background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 8px; padding: 20px; margin-top: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #888888;">
        Teslimat Adresi
      </h3>
      <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
        <strong>${escapeHtml(address.fullName || customerName)}</strong><br>
        ${escapeHtml(address.fullAddress || "")}<br>
        ${escapeHtml(address.district || "")}${address.district && address.city ? " / " : ""}${escapeHtml(address.city || "")}<br>
        📞 ${escapeHtml(address.phone || customerPhone)}
      </p>
    </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yeni Sipariş — ${escapeHtml(orderId)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; -webkit-font-smoothing: antialiased;">
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- ═══ HEADER ═══ -->
    <div style="background-color: #111111; padding: 32px 40px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: 3px;">
        HUMAN NATURE
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 3px;">
        Sipariş Bildirimi
      </p>
    </div>

    <!-- ═══ ALERT BANNER ═══ -->
    <div style="background-color: #ffffff; padding: 24px 40px; border-bottom: 3px solid #111111;">
      <div style="text-align: center;">
        <div style="font-size: 40px; margin-bottom: 8px;">🚀</div>
        <h2 style="margin: 0; font-size: 22px; color: #111111; font-weight: 600;">
          Yeni Sipariş Alındı!
        </h2>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #888888;">
          ${escapeHtml(orderDate)}
        </p>
      </div>
    </div>

    <!-- ═══ ORDER SUMMARY CARD ═══ -->
    <div style="background-color: #ffffff; padding: 32px 40px;">
      
      <!-- Order Meta -->
      <div style="display: flex; border: 1px solid #eeeeee; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <div style="flex: 1; padding: 16px; border-right: 1px solid #eeeeee; text-align: center;">
          <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888;">Sipariş No</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111111;">${escapeHtml(orderId)}</p>
        </div>
        <div style="flex: 1; padding: 16px; border-right: 1px solid #eeeeee; text-align: center;">
          <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888;">Müşteri</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111111;">${escapeHtml(customerName)}</p>
        </div>
        <div style="flex: 1; padding: 16px; text-align: center;">
          <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888;">Toplam</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111111;">${escapeHtml(formattedTotal)}</p>
        </div>
      </div>

      <!-- Items Table -->
      <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #888888;">
        Sipariş Detayları
      </h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #eeeeee; border-radius: 8px;">
        <thead>
          <tr style="background-color: #fafafa;">
            <th style="padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888; font-weight: 600;">Ürün</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888; font-weight: 600;">Adet</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888; font-weight: 600;">Tutar</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #111111;">
            <td colspan="2" style="padding: 16px; font-size: 14px; color: #ffffff; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              Toplam Tutar
            </td>
            <td style="padding: 16px; font-size: 18px; color: #ffffff; font-weight: 700; text-align: right;">
              ${escapeHtml(formattedTotal)}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Address -->
      ${addressBlock}

      <!-- Customer Contact -->
      <div style="background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 8px; padding: 20px; margin-top: 16px;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #888888;">
          Müşteri İletişim
        </h3>
        <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6;">
          <strong>${escapeHtml(customerName)}</strong><br>
          📞 ${escapeHtml(customerPhone || address.phone || "Belirtilmedi")}
        </p>
      </div>
    </div>

    <!-- ═══ FOOTER ═══ -->
    <div style="background-color: #111111; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
      <p style="margin: 0; font-size: 12px; color: #666666;">
        Bu bildirim otomatik olarak gönderilmiştir.
      </p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #555555; letter-spacing: 1px;">
        HUMAN NATURE © ${new Date().getFullYear()}
      </p>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS in email content.
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
