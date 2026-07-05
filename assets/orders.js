(function() {
  // ===== DOM REFERENCES =====
  const orderForm = document.getElementById("orderForm");
  const orderModal = document.getElementById("orderModal");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const orderSuccess = document.getElementById("orderSuccess");
  const orderNumberDisplay = document.getElementById("orderNumberDisplay");
  const orderList = document.getElementById("orderList");
  const orderStatusFilter = document.getElementById("orderStatusFilter");
  const orderSearch = document.getElementById("orderSearch");
  const ordersCount = document.getElementById("ordersCount");
  const pendingCount = document.getElementById("pendingCount");
  const shippedCount = document.getElementById("shippedCount");
  const deliveredCount = document.getElementById("deliveredCount");
  const totalRevenue = document.getElementById("totalRevenue");

  let allOrders = [];
  let currentProduct = null;
  let currentProductId = null;

  // ===== ORDER FORM FUNCTIONS =====
  window.openOrderForm = function(productId, productName, productPrice) {
    currentProductId = productId;
    currentProduct = { id: productId, name: productName, price: productPrice };
    
    document.getElementById("orderProductName").textContent = productName;
    document.getElementById("orderProductPrice").textContent = "₹" + Number(productPrice).toLocaleString("en-IN");
    document.getElementById("orderProductId").value = productId;
    
    orderModal.style.display = "flex";
    modalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  window.closeOrderModal = function() {
    orderModal.style.display = "none";
    modalBackdrop.classList.remove("open");
    document.body.style.overflow = "";
    orderForm.reset();
    orderSuccess.style.display = "none";
    orderForm.style.display = "block";
  };

  // Close modal on backdrop click
  document.getElementById("orderModalBackdrop").addEventListener("click", function(e) {
    if (e.target === this) closeOrderModal();
  });

  // ===== SUBMIT ORDER =====
  orderForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Placing Order...";

    const formData = {
      customer_name: document.getElementById("customerName").value.trim(),
      customer_email: document.getElementById("customerEmail").value.trim(),
      customer_phone: document.getElementById("customerPhone").value.trim(),
      customer_address: document.getElementById("customerAddress").value.trim(),
      city: document.getElementById("customerCity").value.trim(),
      state: document.getElementById("customerState").value.trim(),
      pincode: document.getElementById("customerPincode").value.trim(),
      product_id: currentProductId,
      product_name: currentProduct.name,
      product_price: currentProduct.price,
      quantity: parseInt(document.getElementById("orderQuantity").value) || 1,
      total_amount: currentProduct.price * (parseInt(document.getElementById("orderQuantity").value) || 1),
      payment_method: document.getElementById("paymentMethod").value,
      notes: document.getElementById("orderNotes").value.trim(),
      status: "pending"
    };

    try {
      const { data, error } = await window.supabaseClient
        .from("orders")
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      // Show success
      orderForm.style.display = "none";
      orderSuccess.style.display = "block";
      orderNumberDisplay.textContent = data.order_number;

      // Send WhatsApp notification
      sendWhatsAppNotification(data);

      // Update stats
      loadOrders();

    } catch (err) {
      alert("Failed to place order: " + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // ===== WHATSAPP NOTIFICATION =====
  function sendWhatsAppNotification(order) {
    const message = encodeURIComponent(
      `🛍️ *New Order Received!*\n\n` +
      `📦 Order: ${order.order_number}\n` +
      `👤 Customer: ${order.customer_name}\n` +
      `📞 Phone: ${order.customer_phone}\n` +
      `📧 Email: ${order.customer_email}\n` +
      `🏷️ Product: ${order.product_name}\n` +
      `💰 Amount: ₹${Number(order.total_amount).toLocaleString("en-IN")}\n` +
      `📍 Address: ${order.customer_address}, ${order.city}, ${order.state} - ${order.pincode}\n\n` +
      `Please confirm and process this order.`
    );
    
    const waLink = window.WHATSAPP_NUMBER 
      ? `https://wa.me/${window.WHATSAPP_NUMBER.replace(/\s/g, "")}?text=${message}`
      : "#";
    
    // Open WhatsApp in new tab
    window.open(waLink, "_blank");
  }

  // ===== ADMIN ORDER MANAGEMENT =====
  async function loadOrders() {
    try {
      const { data, error } = await window.supabaseClient
        .from("orders")
        .select(`
          *,
          products:product_id (name, price, image_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      allOrders = data || [];
      renderOrders();
      updateStats();
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  }

  function renderOrders() {
    let filtered = allOrders;

    // Filter by status
    const status = orderStatusFilter ? orderStatusFilter.value : "all";
    if (status !== "all") {
      filtered = filtered.filter(o => o.status === status);
    }

    // Search
    const search = orderSearch ? orderSearch.value.toLowerCase() : "";
    if (search) {
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(search) ||
        o.customer_name.toLowerCase().includes(search) ||
        o.customer_email.toLowerCase().includes(search) ||
        o.customer_phone.includes(search)
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
            <strong>${order.order_number}</strong>
            <span class="order-date">${new Date(order.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
            <button class="btn-delete-order" onclick="deleteOrder('${order.id}')">🗑️</button>
          </div>
        </div>
        <div class="order-body">
          <div class="order-customer">
            <strong>${order.customer_name}</strong>
            <span>📞 ${order.customer_phone}</span>
            <span>📧 ${order.customer_email}</span>
            <span>📍 ${order.customer_address}, ${order.city}, ${order.state} - ${order.pincode}</span>
          </div>
          <div class="order-product">
            <span class="product-name">${order.product_name}</span>
            <span class="product-qty">× ${order.quantity}</span>
            <span class="product-price">₹${Number(order.total_amount).toLocaleString("en-IN")}</span>
          </div>
          ${order.notes ? `<div class="order-notes">📝 ${order.notes}</div>` : ''}
          <div class="order-meta">
            <span class="payment-method">💳 ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid'}</span>
            <span class="status-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
          </div>
        </div>
      </div>
    `).join("");
  }

  // ===== UPDATE ORDER STATUS =====
  window.updateOrderStatus = async function(orderId, newStatus) {
    try {
      const { error } = await window.supabaseClient
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      showToast("✅ Order Updated", `Order status changed to ${newStatus}`);
      loadOrders();
    } catch (err) {
      showToast("❌ Error", err.message, "error");
      loadOrders(); // Reload to reset select
    }
  };

  // ===== DELETE ORDER =====
  window.deleteOrder = async function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!confirm(`Delete order ${order?.order_number || ''}? This cannot be undone.`)) return;

    try {
      const { error } = await window.supabaseClient
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      showToast("🗑️ Order Deleted", "Order has been removed.");
      loadOrders();
    } catch (err) {
      showToast("❌ Error", err.message, "error");
    }
  };

  // ===== STATS =====
  function updateStats() {
    const total = allOrders.length;
    const pending = allOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const shipped = allOrders.filter(o => o.status === 'shipped' || o.status === 'processing').length;
    const delivered = allOrders.filter(o => o.status === 'delivered').length;
    const revenue = allOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    if (ordersCount) ordersCount.textContent = total;
    if (pendingCount) pendingCount.textContent = pending;
    if (shippedCount) shippedCount.textContent = shipped;
    if (deliveredCount) deliveredCount.textContent = delivered;
    if (totalRevenue) totalRevenue.textContent = "₹" + revenue.toLocaleString("en-IN");
  }

  // ===== TOAST SYSTEM =====
  function showToast(title, message, type = "success") {
    const container = document.getElementById("toastContainer") || createToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
  }

  // ===== EVENT LISTENERS =====
  if (orderStatusFilter) {
    orderStatusFilter.addEventListener("change", renderOrders);
  }
  if (orderSearch) {
    orderSearch.addEventListener("input", renderOrders);
  }

  // ===== REALTIME SUBSCRIPTION =====
  try {
    window.supabaseClient
      .channel("public:orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
      })
      .subscribe();
  } catch (err) {
    console.warn("Realtime subscription error:", err);
  }

  // ===== INIT =====
  loadOrders();

})();
