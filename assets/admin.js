(function() {
  // ===== DOM REFERENCES =====
  const loginScreen = document.getElementById("loginScreen");
  const dashboardContent = document.getElementById("dashboardContent");
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");
  const loginMsg = document.getElementById("loginMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const userBadge = document.getElementById("userBadge");
  const userEmail = document.getElementById("userEmail");
  const userAvatar = document.getElementById("userAvatar");

  const uploadForm = document.getElementById("uploadForm");
  const uploadMsg = document.getElementById("uploadMsg");
  const uploadBtn = document.getElementById("uploadBtn");
  const adminList = document.getElementById("adminList");
  const productSearch = document.getElementById("productSearch");

  const totalProducts = document.getElementById("totalProducts");
  const newProducts = document.getElementById("newProducts");
  const categoriesCount = document.getElementById("categoriesCount");
  const avgPrice = document.getElementById("avgPrice");
  const productCount = document.getElementById("productCount");
  const listCount = document.getElementById("listCount");

  const fileInput = document.getElementById("pImage");
  const filePreview = document.getElementById("filePreview");
  const previewImage = document.getElementById("previewImage");
  const fileUploadWrapper = document.getElementById("fileUploadWrapper");

  // Order elements
  const orderList = document.getElementById("orderList");
  const orderStatusFilter = document.getElementById("orderStatusFilter");
  const orderSearch = document.getElementById("orderSearch");
  const ordersCount = document.getElementById("ordersCount");
  const pendingCount = document.getElementById("pendingCount");
  const shippedCount = document.getElementById("shippedCount");
  const deliveredCount = document.getElementById("deliveredCount");
  const totalRevenue = document.getElementById("totalRevenue");
  const orderBadge = document.getElementById("orderBadge");

  const BUCKET = "product-images";
  let allProducts = [];
  let allOrders = [];
  let currentUser = null;

  // ===== TOAST SYSTEM =====
  function showToast(title, message, type = "success") {
    const container = document.getElementById("toastContainer");
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

  // ===== FILE PREVIEW =====
  fileInput.addEventListener("change", function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImage.src = e.target.result;
        filePreview.style.display = "block";
        fileUploadWrapper.style.borderColor = "var(--admin-success)";
        fileUploadWrapper.querySelector(".upload-text").textContent = file.name;
        fileUploadWrapper.querySelector(".upload-hint").textContent = 
          `${(file.size / 1024).toFixed(1)} KB · ${file.type.split('/')[1].toUpperCase()}`;
      };
      reader.readAsDataURL(file);
    }
  });

  fileUploadWrapper.addEventListener("dragover", function(e) {
    e.preventDefault();
    this.style.borderColor = "var(--admin-primary)";
    this.style.background = "rgba(126,33,48,0.04)";
  });

  fileUploadWrapper.addEventListener("dragleave", function(e) {
    e.preventDefault();
    this.style.borderColor = "var(--admin-border)";
    this.style.background = "var(--admin-bg)";
  });

  fileUploadWrapper.addEventListener("drop", function(e) {
    e.preventDefault();
    this.style.borderColor = "var(--admin-border)";
    this.style.background = "var(--admin-bg)";
    const files = e.dataTransfer.files;
    if (files.length) {
      fileInput.files = files;
      fileInput.dispatchEvent(new Event("change"));
    }
  });

  // ===== TAB SWITCHING =====
  window.switchTab = function(tabId) {
    document.querySelectorAll(".admin-nav-item").forEach(el => el.classList.remove("active"));
    const navItem = document.querySelector(`[data-tab="${tabId}"]`);
    if (navItem) navItem.classList.add("active");

    document.querySelectorAll(".admin-panel").forEach(el => el.style.display = "block");
    const panels = {
      "add-product": "addProductPanel",
      "manage-products": "manageProductsPanel",
      "orders": "ordersPanel",
      "settings": "settingsPanel",
      "dashboard": null
    };

    if (panels[tabId]) {
      document.querySelectorAll(".admin-panel").forEach(el => el.style.display = "none");
      document.getElementById(panels[tabId]).style.display = "block";
    } else {
      document.querySelectorAll(".admin-panel").forEach(el => el.style.display = "block");
    }

    if (tabId === "orders") {
      loadOrders();
    }

    document.querySelector(".admin-main").scrollTop = 0;
  };

  document.querySelectorAll(".admin-nav-item").forEach(item => {
    item.addEventListener("click", function() {
      const tab = this.dataset.tab;
      if (tab === "dashboard") {
        document.querySelectorAll(".admin-panel").forEach(el => el.style.display = "block");
        document.querySelectorAll(".admin-nav-item").forEach(el => el.classList.remove("active"));
        this.classList.add("active");
        return;
      }
      switchTab(tab);
    });
  });

  // ===== AUTH =====
  async function refreshSessionUI() {
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session) {
        currentUser = session.user;
        loginScreen.style.display = "none";
        dashboardContent.style.display = "block";
        logoutBtn.style.display = "inline-block";
        userBadge.style.display = "flex";
        userEmail.textContent = session.user.email;
        userAvatar.textContent = session.user.email.charAt(0).toUpperCase();
        loadProducts();
        loadOrders();
        updateStats();
      } else {
        currentUser = null;
        loginScreen.style.display = "flex";
        dashboardContent.style.display = "none";
        logoutBtn.style.display = "none";
        userBadge.style.display = "none";
        adminList.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">🔐</span>
            <h3>Please sign in</h3>
            <p>Sign in to manage your products and orders.</p>
          </div>
        `;
        orderList.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">🔐</span>
            <h3>Please sign in</h3>
            <p>Sign in to manage orders.</p>
          </div>
        `;
      }
    } catch (err) {
      console.error("Session refresh error:", err);
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMsg.className = "login-msg";
    loginMsg.style.display = "none";
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in…";

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    try {
      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        loginMsg.textContent = error.message;
        loginMsg.className = "login-msg error";
        loginMsg.style.display = "block";
        loginBtn.disabled = false;
        loginBtn.textContent = "Sign In";
        return;
      }
      loginMsg.textContent = "✓ Signed in successfully!";
      loginMsg.className = "login-msg success";
      loginMsg.style.display = "block";
      loginForm.reset();
      setTimeout(() => refreshSessionUI(), 500);
    } catch (err) {
      loginMsg.textContent = "Sign in failed: " + err.message;
      loginMsg.className = "login-msg error";
      loginMsg.style.display = "block";
    }
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await window.supabaseClient.auth.signOut();
      showToast("👋 Logged Out", "You have been signed out successfully.");
      refreshSessionUI();
    } catch (err) {
      showToast("Error", err.message, "error");
    }
  });

  // ===== PRODUCT FUNCTIONS =====
  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadMsg.className = "form-msg";
    uploadMsg.style.display = "none";
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = "<span>⏳</span> Publishing…";

    const name = document.getElementById("pName").value.trim();
    const price = document.getElementById("pPrice").value;
    const original_price = document.getElementById("pOriginalPrice").value || null;
    const badge = document.getElementById("pBadge").value || null;
    const category = document.getElementById("pCategory").value.trim();
    const description = document.getElementById("pDesc").value.trim();
    const file = fileInput.files[0];

    if (!name || !price || !file) {
      uploadMsg.textContent = "Name, price and an image are required.";
      uploadMsg.className = "form-msg error show";
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = "<span>📤</span> Publish to Store";
      return;
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      uploadMsg.textContent = "Please enter a valid price.";
      uploadMsg.className = "form-msg error show";
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = "<span>📤</span> Publish to Store";
      return;
    }

    const okTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      uploadMsg.textContent = "Please upload a JPEG, PNG or WEBP image.";
      uploadMsg.className = "form-msg error show";
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = "<span>📤</span> Publish to Store";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      uploadMsg.textContent = "Image must be smaller than 5MB.";
      uploadMsg.className = "form-msg error show";
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = "<span>📤</span> Publish to Store";
      return;
    }

    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await window.supabaseClient
        .storage.from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = window.supabaseClient.storage.from(BUCKET).getPublicUrl(path);
      const image_url = pub.publicUrl;

      const { error: insErr } = await window.supabaseClient
        .from("products")
        .insert([{
          name,
          price: Number(price),
          original_price: original_price ? Number(original_price) : null,
          badge,
          category,
          description,
          image_url,
          storage_path: path
        }]);
      if (insErr) throw insErr;

      showToast("✨ Product Published!", `"${name}" is now live on the storefront.`);
      uploadMsg.textContent = `✨ "${name}" is now live on the storefront.`;
      uploadMsg.className = "form-msg success show";
      uploadForm.reset();
      filePreview.style.display = "none";
      fileUploadWrapper.querySelector(".upload-text").textContent = "Click or drag to upload image";
      fileUploadWrapper.querySelector(".upload-hint").textContent = "JPEG, PNG or WEBP · Max 5MB";
      fileUploadWrapper.style.borderColor = "var(--admin-border)";

      loadProducts();
      updateStats();
      setTimeout(() => switchTab("manage-products"), 800);
    } catch (err) {
      uploadMsg.textContent = "Upload failed: " + err.message;
      uploadMsg.className = "form-msg error show";
      showToast("Upload Failed", err.message, "error");
    }
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = "<span>📤</span> Publish to Store";
  });

  async function loadProducts() {
    try {
      const { data, error } = await window.supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      allProducts = data || [];
      const searchTerm = productSearch ? productSearch.value.toLowerCase() : "";
      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        (p.category || "").toLowerCase().includes(searchTerm)
      );

      renderProductList(filtered);
      updateStats();
    } catch (err) {
      adminList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⚠️</span>
          <h3>Error loading products</h3>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  function renderProductList(products) {
    if (!products || !products.length) {
      adminList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <h3>No products found</h3>
          <p>${allProducts.length ? "Try adjusting your search." : "Add your first piece using the form above."}</p>
        </div>
      `;
      listCount.textContent = "0";
      return;
    }

    adminList.innerHTML = products.map((p) => `
      <div class="product-list-item" data-id="${p.id}" data-path="${escapeHtml(p.storage_path || "")}">
        <img class="product-thumb" src="${escapeHtml(p.image_url || "")}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">
        <div class="product-info">
          <div class="product-name">${escapeHtml(p.name)}</div>
          <div class="product-meta">
            <span>₹${escapeHtml(p.price)}</span>
            ${p.original_price ? `<span>was ₹${escapeHtml(p.original_price)}</span>` : ""}
            ${p.category ? `<span>· ${escapeHtml(p.category)}</span>` : ""}
            ${p.badge ? `<span class="badge-tag">${escapeHtml(p.badge)}</span>` : ""}
          </div>
        </div>
        <div class="product-date">${new Date(p.created_at).toLocaleDateString("en-IN")}</div>
        <div class="product-actions">
          <button class="btn-edit" onclick="editProduct('${p.id}')" title="Edit">✏️</button>
          <button class="btn-delete" onclick="deleteProduct('${p.id}', '${escapeHtml(p.name)}', '${escapeHtml(p.storage_path || "")}')" title="Delete">🗑️</button>
        </div>
      </div>
    `).join("");

    listCount.textContent = products.length;
  }

  window.deleteProduct = async function(id, name, path) {
    if (!confirm(`Remove "${name}" from the live store?`)) return;

    try {
      await window.supabaseClient.from("products").delete().eq("id", id);
      if (path) {
        await window.supabaseClient.storage.from(BUCKET).remove([path]);
      }
      showToast("🗑️ Product Removed", `"${name}" has been deleted.`);
      loadProducts();
      updateStats();
    } catch (err) {
      showToast("Error", err.message, "error");
    }
  };

  window.editProduct = function(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) {
      showToast("Error", "Product not found", "error");
      return;
    }

    document.getElementById("pName").value = product.name || "";
    document.getElementById("pCategory").value = product.category || "";
    document.getElementById("pPrice").value = product.price || "";
    document.getElementById("pOriginalPrice").value = product.original_price || "";
    document.getElementById("pBadge").value = product.badge || "";
    document.getElementById("pDesc").value = product.description || "";

    if (product.image_url) {
      previewImage.src = product.image_url;
      filePreview.style.display = "block";
      fileUploadWrapper.querySelector(".upload-text").textContent = "Current image selected";
      fileUploadWrapper.querySelector(".upload-hint").textContent = "Upload a new image to replace it";
    }

    switchTab("add-product");
    document.querySelector("#addProductPanel .admin-panel-header h2").textContent = "✏️ Edit Product";
    uploadBtn.innerHTML = "<span>💾</span> Update Product";
    uploadBtn.dataset.editId = id;

    uploadForm.onsubmit = async function(e) {
      e.preventDefault();
      showToast("Info", "Edit functionality coming soon!", "success");
    };
  };

  window.refreshProducts = function() {
    loadProducts();
    showToast("🔄 Refreshed", "Product list updated.");
  };

  if (productSearch) {
    productSearch.addEventListener("input", loadProducts);
  }

  function updateStats() {
    const products = allProducts || [];
    const count = products.length;
    totalProducts.textContent = count;
    productCount.textContent = count;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newCount = products.filter(p => new Date(p.created_at) > weekAgo).length;
    newProducts.textContent = newCount;

    const cats = new Set(products.map(p => p.category).filter(Boolean));
    categoriesCount.textContent = cats.size;

    if (count) {
      const avg = products.reduce((sum, p) => sum + Number(p.price), 0) / count;
      avgPrice.textContent = "₹" + Math.round(avg).toLocaleString("en-IN");
    } else {
      avgPrice.textContent = "₹0";
    }
  }

  // ===== ORDER FUNCTIONS =====
  async function loadOrders() {
    try {
      const { data, error } = await window.supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      allOrders = data || [];
      renderOrders();
      updateOrderStats();
    } catch (err) {
      console.error("Error loading orders:", err);
      orderList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⚠️</span>
          <h3>Error loading orders</h3>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

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
            <button class="btn-delete-order" onclick="deleteOrder('${order.id}')" title="Delete Order">🗑️</button>
          </div>
        </div>
        <div class="order-body">
          <div class="order-customer">
            <strong>${escapeHtml(order.customer_name)}</strong>
            <span>📞 ${escapeHtml(order.customer_phone)}</span>
            <span>📧 ${escapeHtml(order.customer_email)}</span>
            <span>📍 ${escapeHtml(order.customer_address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)} - ${escapeHtml(order.pincode)}</span>
          </div>
          <div class="order-product">
            <span class="product-name">${escapeHtml(order.product_name)}</span>
            <span class="product-qty">× ${order.quantity}</span>
            <span class="product-price">₹${Number(order.total_amount).toLocaleString("en-IN")}</span>
          </div>
          ${order.notes ? `<div class="order-notes">📝 ${escapeHtml(order.notes)}</div>` : ''}
          <div class="order-meta">
            <span class="payment-method">${order.payment_method === 'cod' ? '💳 Cash on Delivery' : '💳 Prepaid'}</span>
            <span class="status-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
          </div>
        </div>
      </div>
    `).join("");
  }

  function updateOrderStats() {
    const orders = allOrders || [];
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const shipped = orders.filter(o => o.status === 'shipped' || o.status === 'processing').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const revenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    if (ordersCount) ordersCount.textContent = total;
    if (pendingCount) pendingCount.textContent = pending;
    if (shippedCount) shippedCount.textContent = shipped;
    if (deliveredCount) deliveredCount.textContent = delivered;
    if (totalRevenue) totalRevenue.textContent = "₹" + revenue.toLocaleString("en-IN");
    if (orderBadge) orderBadge.textContent = pending > 0 ? pending : "0";
  }

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
      loadOrders();
    }
  };

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

  window.refreshOrders = function() {
    loadOrders();
    showToast("🔄 Refreshed", "Orders updated.");
  };

  if (orderStatusFilter) {
    orderStatusFilter.addEventListener("change", renderOrders);
  }
  if (orderSearch) {
    orderSearch.addEventListener("input", renderOrders);
  }

  // ===== REALTIME SUBSCRIPTIONS =====
  try {
    window.supabaseClient
      .channel("public:products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        loadProducts();
        updateStats();
      })
      .subscribe();

    window.supabaseClient
      .channel("public:orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
        updateOrderStats();
      })
      .subscribe();
  } catch (err) {
    console.warn("Realtime subscription error:", err);
  }

  // ===== SETTINGS =====
  window.saveSettings = function() {
    const msg = document.getElementById("settingsMsg");
    const whatsapp = document.getElementById("settingsWhatsApp").value.trim();
    const storeName = document.getElementById("settingsStoreName").value.trim();

    if (whatsapp) {
      window.WHATSAPP_NUMBER = whatsapp;
      localStorage.setItem("sol_whatsapp", whatsapp);
    }
    if (storeName) {
      localStorage.setItem("sol_store_name", storeName);
    }

    msg.textContent = "✅ Settings saved successfully!";
    msg.className = "form-msg success show";
    setTimeout(() => {
      msg.className = "form-msg";
      msg.style.display = "none";
    }, 3000);

    showToast("💾 Settings Saved", "Your changes have been applied.");
  };

  function loadSettings() {
    const savedWhatsApp = localStorage.getItem("sol_whatsapp");
    const savedStoreName = localStorage.getItem("sol_store_name");
    if (savedWhatsApp) document.getElementById("settingsWhatsApp").value = savedWhatsApp;
    if (savedStoreName) document.getElementById("settingsStoreName").value = savedStoreName;
  }

  // ===== INIT =====
  window.supabaseClient.auth.onAuthStateChange(() => refreshSessionUI());
  loadSettings();
  refreshSessionUI();

})();
