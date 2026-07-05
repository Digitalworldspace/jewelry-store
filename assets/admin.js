// ===== PARCEL STICKER FUNCTIONS =====
window.printParcelSticker = function(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) {
    showToast("Error", "Order not found", "error");
    return;
  }

  // Generate parcel sticker HTML
  const stickerHtml = `
    <div class="parcel-sticker" id="parcelSticker">
      <div class="sticker-header">
        <span class="sticker-brand">✦ Style OF Life</span>
        <span class="sticker-order">Order #${order.order_number}</span>
      </div>
      <div class="sticker-body">
        <div class="sticker-row">
          <strong>To:</strong>
          <span>${escapeHtml(order.customer_name)}</span>
        </div>
        <div class="sticker-row">
          <strong>Phone:</strong>
          <span>${escapeHtml(order.customer_phone)}</span>
        </div>
        <div class="sticker-row">
          <strong>Address:</strong>
          <span>${escapeHtml(order.customer_address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)} - ${escapeHtml(order.pincode)}</span>
        </div>
        <div class="sticker-divider"></div>
        <div class="sticker-row">
          <strong>Product:</strong>
          <span>${escapeHtml(order.product_name)} × ${order.quantity}</span>
        </div>
        <div class="sticker-row">
          <strong>Total:</strong>
          <span>₹${Number(order.total_amount).toLocaleString("en-IN")}</span>
        </div>
        <div class="sticker-row">
          <strong>Date:</strong>
          <span>${new Date(order.created_at).toLocaleDateString("en-IN")}</span>
        </div>
        <div class="sticker-footer">
          <span>❤️ Handcrafted with love</span>
          <span>📦 Handle with care</span>
        </div>
      </div>
      <div class="sticker-barcode">
        <span>||| ||| ||| ||| |||</span>
        <span>${order.order_number}</span>
      </div>
    </div>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Parcel Sticker - ${order.order_number}</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Jost', Arial, sans-serif;
          background: #f5f0eb;
        }
        .parcel-sticker {
          max-width: 350px;
          margin: 0 auto;
          background: white;
          border: 2px solid #1A1A1A;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .sticker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #C79A56;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .sticker-brand {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1A1A1A;
        }
        .sticker-order {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          color: #666;
          background: #f5f0eb;
          padding: 2px 10px;
          border-radius: 12px;
        }
        .sticker-body {
          padding: 4px 0;
        }
        .sticker-row {
          display: flex;
          gap: 8px;
          padding: 4px 0;
          font-size: 0.85rem;
        }
        .sticker-row strong {
          min-width: 60px;
          color: #666;
          font-weight: 600;
        }
        .sticker-row span {
          color: #1A1A1A;
        }
        .sticker-divider {
          border-top: 1px dashed #ddd;
          margin: 8px 0;
        }
        .sticker-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #eee;
          font-size: 0.7rem;
          color: #666;
        }
        .sticker-barcode {
          text-align: center;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #eee;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          color: #999;
        }
        .sticker-barcode span:first-child {
          display: block;
          font-size: 1.8rem;
          letter-spacing: 6px;
          color: #1A1A1A;
        }
        .print-btn {
          display: block;
          margin: 20px auto;
          padding: 12px 40px;
          background: #1A1A1A;
          color: white;
          border: none;
          border-radius: 30px;
          font-size: 0.9rem;
          cursor: pointer;
          font-family: 'Jost', Arial, sans-serif;
        }
        .print-btn:hover {
          background: #333;
        }
        @media print {
          body { background: white; padding: 0; }
          .print-btn { display: none; }
          .parcel-sticker { box-shadow: none; border-color: #ccc; }
        }
      </style>
    </head>
    <body>
      ${stickerHtml}
      <button class="print-btn" onclick="window.print()">🖨️ Print Sticker</button>
      <script>
        // Auto-print after a short delay
        setTimeout(() => window.print(), 500);
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();

  // Mark as printed
  updateParcelPrinted(orderId);
};

async function updateParcelPrinted(orderId) {
  try {
    await window.supabaseClient
      .from("orders")
      .update({ parcel_printed: true })
      .eq("id", orderId);
    
    loadOrders();
  } catch (err) {
    console.error("Error updating parcel printed status:", err);
  }
}

async function updateParcelTracking(orderId, trackingNumber) {
  try {
    const { error } = await window.supabaseClient
      .from("orders")
      .update({ parcel_tracking: trackingNumber })
      .eq("id", orderId);

    if (error) throw error;
    showToast("✅ Tracking Updated", `Tracking number: ${trackingNumber}`);
    loadOrders();
  } catch (err) {
    showToast("❌ Error", err.message, "error");
  }
}

// Update order item rendering to include parcel sticker button
function renderOrders() {
  let filtered = allOrders || [];

  if (orderStatusFilter && orderStatusFilter.value !== "all") {
    filtered = filtered.filter(o => o.status === orderStatusFilter.value);
  }

  if (orderSearch && orderSearch.value.trim()) {
    const term = orderSearch.value.toLowerCase();
    filtered = filtered.filter(o => 
      o.order_number.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.customer_email.toLowerCase().includes(term) ||
      o.customer_phone.includes(term)
    );
  }

  if (!filtered.length) {
    orderList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <h3>No orders found</h3>
        <p>${allOrders.length ? "Try adjusting your filters." : "No orders have been placed yet."}</p>
      </div>
    `;
    return;
  }

  orderList.innerHTML = filtered.map(order => `
    <div class="order-item" data-id="${order.id}">
      <div class="order-header">
        <div class="order-number">
          <strong>${escapeHtml(order.order_number)}</strong>
          <span class="order-date">${new Date(order.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          ${order.parcel_printed ? '<span style="font-size:0.6rem;background:#D4EDDA;color:#155724;padding:2px 10px;border-radius:12px;">📦 Sticker Printed</span>' : ''}
        </div>
        <div class="order-status-actions">
          <select class="status-select" data-id="${order.id}" onchange="updateOrderStatus('${order.id}', this.value)">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>✅ Confirmed</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>🔧 Processing</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>🚚 Shipped</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>📦 Delivered</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
          </select>
          <button class="btn-sticker" onclick="printParcelSticker('${order.id}')" title="Print Parcel Sticker">🏷️</button>
          <button class="btn-delete-order" onclick="deleteOrder('${order.id}')" title="Delete Order">🗑️</button>
        </div>
      </div>
      <div class="order-body">
        <div class="order-customer">
          <strong>${escapeHtml(order.customer_name)}</strong>
          <span>📞 ${escapeHtml(order.customer_phone)}</span>
          <span>📧 ${escapeHtml(order.customer_email)}</span>
          <span>📍 ${escapeHtml(order.customer_address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)} - ${escapeHtml(order.pincode)}</span>
          ${order.parcel_tracking ? `<span style="font-size:0.75rem;color:var(--color-secondary);">📦 Tracking: ${escapeHtml(order.parcel_tracking)}</span>` : ''}
        </div>
        <div class="order-product">
          <span class="product-name">${escapeHtml(order.product_name)}</span>
          <span class="product-qty">× ${order.quantity}</span>
          <span class="product-price">₹${Number(order.total_amount).toLocaleString("en-IN")}</span>
        </div>
        ${order.notes ? `<div class="order-notes">📝 ${escapeHtml(order.notes)}</div>` : ''}
        <div class="order-meta">
          <span class="payment-method">💳 ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid'}</span>
          <span class="status-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
        </div>
      </div>
    </div>
  `).join("");
}
