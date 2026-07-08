(function () {
  const loginPanel = document.getElementById("loginPanel");
  const dashPanel = document.getElementById("dashPanel");
  const loginForm = document.getElementById("loginForm");
  const loginMsg = document.getElementById("loginMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const forgotBtn = document.getElementById("forgotBtn");
  const uploadForm = document.getElementById("uploadForm");
  const uploadMsg = document.getElementById("uploadMsg");
  const adminList = document.getElementById("adminList");
  const whoami = document.getElementById("whoami");
  const productSearch = document.getElementById("productSearch");
  const orderSearch = document.getElementById("orderSearch");
  const formTitle = document.getElementById("formTitle");
  const formSubmitBtn = document.getElementById("formSubmitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const pImageLabel = document.getElementById("pImageLabel");

  const BUCKET = "product-images";
  const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
  const PAYMENT_STATUSES = ["Unpaid", "Paid"];

  let allAdminProducts = [];
  let allOrders = [];
  let editingProductId = null;
  let activeOrderStatus = "All";
  let activePaymentFilter = "All";
  let activeDateFilter = "All";
  let selectedOrderIds = new Set();
  let selectedProductIds = new Set();

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------------- Tabs ----------------
  function wireTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    const tabPanels = { products: "productsTab", orders: "ordersTab", analytics: "analyticsTab" };
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        Object.entries(tabPanels).forEach(([key, panelId]) => {
          const panel = document.getElementById(panelId);
          if (panel) panel.style.display = key === btn.dataset.tab ? "block" : "none";
        });
        if (btn.dataset.tab === "analytics") renderAnalytics();
      });
    });
  }

  // ---------------- Dashboard stats ----------------
  function renderStats() {
    const statProducts = document.getElementById("statProducts");
    const statOrders = document.getElementById("statOrders");
    const statPending = document.getElementById("statPending");
    const statRevenue = document.getElementById("statRevenue");
    if (!statProducts) return;

    statProducts.textContent = allAdminProducts.length;
    statOrders.textContent = allOrders.length;
    statPending.textContent = allOrders.filter((o) => o.status === "Pending").length;

    const revenue = allOrders
      .filter((o) => o.payment_status === "Paid")
      .reduce((sum, o) => sum + (Number(o.unit_price) || 0) * (Number(o.quantity) || 1), 0);
    statRevenue.textContent = "₹" + revenue.toLocaleString("en-IN");
  }

  // ---------------- Auth ----------------
  async function refreshSessionUI() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
      loginPanel.style.display = "none";
      dashPanel.style.display = "block";
      whoami.textContent = session.user.email;
      loadAdminProducts();
      loadOrders();
    } else {
      loginPanel.style.display = "block";
      dashPanel.style.display = "none";
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMsg.textContent = "";
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      loginMsg.textContent = error.message;
      loginMsg.className = "msg error";
      return;
    }
    refreshSessionUI();
  });

  forgotBtn.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) {
      loginMsg.textContent = "Enter your email above first, then tap 'Forgot password?' again.";
      loginMsg.className = "msg error";
      return;
    }
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email);
    if (error) {
      loginMsg.textContent = error.message;
      loginMsg.className = "msg error";
      return;
    }
    loginMsg.textContent = `Password reset email sent to ${email} (if that account exists).`;
    loginMsg.className = "msg ok";
  });

  logoutBtn.addEventListener("click", async () => {
    await window.supabaseClient.auth.signOut();
    refreshSessionUI();
  });

  // ---------------- Add / Edit product ----------------
  function resetForm() {
    editingProductId = null;
    uploadForm.reset();
    formTitle.textContent = "Add a new piece";
    formSubmitBtn.textContent = "Upload & publish live";
    cancelEditBtn.style.display = "none";
    pImageLabel.textContent = "Product image (JPEG / PNG / WEBP)";
    uploadMsg.textContent = "";
  }

  function startEdit(p) {
    editingProductId = p.id;
    document.getElementById("pName").value = p.name || "";
    document.getElementById("pCategory").value = p.category || "";
    document.getElementById("pPrice").value = p.price || "";
    document.getElementById("pOriginalPrice").value = p.original_price || "";
    document.getElementById("pBadge").value = p.badge || "";
    document.getElementById("pDesc").value = p.description || "";
    formTitle.textContent = `Editing "${p.name}"`;
    formSubmitBtn.textContent = "Save changes";
    cancelEditBtn.style.display = "inline-block";
    pImageLabel.textContent = "Replace image — optional (leave blank to keep the current photo)";
    uploadMsg.textContent = "";
    uploadForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  cancelEditBtn.addEventListener("click", resetForm);

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadMsg.textContent = editingProductId ? "Saving…" : "Uploading…";
    uploadMsg.className = "msg";

    const name = document.getElementById("pName").value.trim();
    const price = document.getElementById("pPrice").value;
    const original_price = document.getElementById("pOriginalPrice").value || null;
    const badge = document.getElementById("pBadge").value || null;
    const category = document.getElementById("pCategory").value.trim();
    const description = document.getElementById("pDesc").value.trim();
    const file = document.getElementById("pImage").files[0];

    if (!name || !price || (!editingProductId && !file)) {
      uploadMsg.textContent = "Name, price and an image are required.";
      uploadMsg.className = "msg error";
      return;
    }

    if (file) {
      const okTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!okTypes.includes(file.type)) {
        uploadMsg.textContent = "Please upload a JPEG, PNG or WEBP image.";
        uploadMsg.className = "msg error";
        return;
      }
    }

    try {
      let image_url, storage_path;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await window.supabaseClient
          .storage.from(BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = window.supabaseClient.storage.from(BUCKET).getPublicUrl(path);
        image_url = pub.publicUrl;
        storage_path = path;
      }

      if (editingProductId) {
        const updates = { name, price, original_price, badge, category, description };
        if (image_url) {
          updates.image_url = image_url;
          updates.storage_path = storage_path;
        }
        const { error: updErr } = await window.supabaseClient
          .from("products")
          .update(updates)
          .eq("id", editingProductId);
        if (updErr) throw updErr;
        uploadMsg.textContent = `"${name}" updated.`;
      } else {
        const { error: insErr } = await window.supabaseClient
          .from("products")
          .insert([{ name, price, original_price, badge, category, description, image_url, storage_path }]);
        if (insErr) throw insErr;
        uploadMsg.textContent = `"${name}" is live on the site now.`;
      }

      uploadMsg.className = "msg ok";
      resetForm();
      loadAdminProducts();
    } catch (err) {
      uploadMsg.textContent = (editingProductId ? "Couldn't save changes: " : "Upload failed: ") + err.message;
      uploadMsg.className = "msg error";
    }
  });

  // ---------------- Product list ----------------
  function populateCategoryList() {
    const dl = document.getElementById("categoryList");
    if (!dl) return;
    const cats = [...new Set(allAdminProducts.map((p) => p.category).filter(Boolean))];
    dl.innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}">`).join("");
  }

  function renderAdminProducts() {
    const q = (productSearch.value || "").trim().toLowerCase();
    const items = q
      ? allAdminProducts.filter((p) => (p.name || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q))
      : allAdminProducts;

    if (!items.length) {
      adminList.innerHTML = `<div class="msg">${allAdminProducts.length ? "No products match your search." : "No products yet — add your first piece above."}</div>`;
      renderProductBulkBar();
      return;
    }

    adminList.innerHTML = items.map((p) => `
      <div class="admin-row ${p.id === editingProductId ? "editing" : ""}" data-id="${p.id}" data-path="${escapeHtml(p.storage_path || "")}">
        <div class="p-check"><input type="checkbox" class="product-check" ${selectedProductIds.has(String(p.id)) ? "checked" : ""}></div>
        <img src="${escapeHtml(p.image_url || "")}" alt="">
        <div>
          <div class="name">${escapeHtml(p.name)}</div>
          <div class="meta">₹${escapeHtml(p.price)}${p.original_price ? ` (was ₹${escapeHtml(p.original_price)})` : ""} · ${escapeHtml(p.category || "—")}${p.badge ? ` · ${escapeHtml(p.badge)}` : ""}</div>
        </div>
        <div class="meta">${new Date(p.created_at).toLocaleDateString("en-IN")}</div>
        <div class="row-actions">
          <button class="link-btn" data-action="edit">Edit</button>
          <button class="link-btn" data-action="delete">Remove</button>
        </div>
      </div>
    `).join("");

    adminList.querySelectorAll(".product-check").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.closest(".admin-row").dataset.id;
        if (cb.checked) selectedProductIds.add(id); else selectedProductIds.delete(id);
        renderProductBulkBar();
        syncSelectAllCheckbox("selectAllProducts", ".product-check");
      });
    });

    adminList.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest(".admin-row");
        const p = allAdminProducts.find((x) => String(x.id) === row.dataset.id);
        if (p) startEdit(p);
      });
    });

    adminList.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest(".admin-row");
        const id = row.dataset.id;
        const path = row.dataset.path;
        if (!confirm("Remove this piece from the live store?")) return;
        await window.supabaseClient.from("products").delete().eq("id", id);
        if (path) {
          await window.supabaseClient.storage.from(BUCKET).remove([path]);
        }
        if (editingProductId === id) resetForm();
        loadAdminProducts();
      });
    });

    renderProductBulkBar();
    syncSelectAllCheckbox("selectAllProducts", ".product-check");
  }

  // ---------------- Bulk selection helpers ----------------
  function syncSelectAllCheckbox(checkboxId, itemSelector) {
    const all = document.getElementById(checkboxId);
    const items = document.querySelectorAll(`#${checkboxId === "selectAllProducts" ? "adminList" : "ordersList"} ${itemSelector}`);
    if (!all) return;
    if (!items.length) { all.checked = false; all.indeterminate = false; return; }
    const checkedCount = Array.from(items).filter((c) => c.checked).length;
    all.checked = checkedCount === items.length;
    all.indeterminate = checkedCount > 0 && checkedCount < items.length;
  }

  const BADGE_OPTIONS = ["", "New", "Bestseller", "Sale", "Limited Stock"];

  function renderProductBulkBar() {
    const bar = document.getElementById("productBulkBar");
    if (!bar) return;
    const n = selectedProductIds.size;
    if (n === 0) {
      bar.classList.add("empty");
      bar.innerHTML = `Select products below to apply bulk actions.`;
      return;
    }
    bar.classList.remove("empty");
    bar.innerHTML = `
      <span class="bb-count">${n} selected</span>
      <div class="bb-actions">
        <select id="bulkBadgeSelect">
          <option value="">Set badge…</option>
          ${BADGE_OPTIONS.filter((b) => b).map((b) => `<option value="${b}">${b}</option>`).join("")}
          <option value="__clear__">No badge</option>
        </select>
        <button class="bb-btn" id="bulkApplyBadgeBtn">Apply</button>
        <button class="bb-btn danger" id="bulkDeleteProductsBtn">Delete</button>
        <button class="bb-btn" id="bulkClearProductsBtn">Clear</button>
      </div>
    `;

    document.getElementById("bulkApplyBadgeBtn").addEventListener("click", async () => {
      const val = document.getElementById("bulkBadgeSelect").value;
      if (!val) return;
      const badge = val === "__clear__" ? null : val;
      for (const id of selectedProductIds) {
        await window.supabaseClient.from("products").update({ badge }).eq("id", id);
      }
      selectedProductIds.clear();
      loadAdminProducts();
    });

    document.getElementById("bulkDeleteProductsBtn").addEventListener("click", async () => {
      const ids = Array.from(selectedProductIds);
      if (!confirm(`Remove ${ids.length} product${ids.length === 1 ? "" : "s"} from the live store? This can't be undone.`)) return;
      for (const id of ids) {
        const p = allAdminProducts.find((x) => String(x.id) === id);
        await window.supabaseClient.from("products").delete().eq("id", id);
        if (p && p.storage_path) {
          await window.supabaseClient.storage.from(BUCKET).remove([p.storage_path]);
        }
      }
      selectedProductIds.clear();
      if (ids.includes(editingProductId)) resetForm();
      loadAdminProducts();
    });

    document.getElementById("bulkClearProductsBtn").addEventListener("click", () => {
      selectedProductIds.clear();
      renderAdminProducts();
    });
  }

  function wireSelectAllProducts() {
    const all = document.getElementById("selectAllProducts");
    if (!all) return;
    all.addEventListener("change", () => {
      document.querySelectorAll("#adminList .product-check").forEach((cb) => {
        cb.checked = all.checked;
        const id = cb.closest(".admin-row").dataset.id;
        if (all.checked) selectedProductIds.add(id); else selectedProductIds.delete(id);
      });
      renderProductBulkBar();
    });
  }

  async function loadAdminProducts() {
    adminList.innerHTML = "Loading…";
    const { data, error } = await window.supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      adminList.innerHTML = `<div class="msg error">${escapeHtml(error.message)}</div>`;
      return;
    }
    allAdminProducts = data || [];
    populateCategoryList();
    renderAdminProducts();
    renderStats();
  }

  productSearch.addEventListener("input", renderAdminProducts);

  // ---------------- Orders ----------------
  function wireOrderFilters() {
    document.querySelectorAll("#orderFilters .filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll("#orderFilters .filter-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeOrderStatus = chip.dataset.status;
        renderOrders();
      });
    });
    document.querySelectorAll("#paymentFilters .filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll("#paymentFilters .filter-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activePaymentFilter = chip.dataset.payment;
        renderOrders();
      });
    });
    const dateFilter = document.getElementById("dateFilter");
    if (dateFilter) {
      dateFilter.addEventListener("change", () => {
        activeDateFilter = dateFilter.value;
        renderOrders();
      });
    }
  }

  function withinDateFilter(dateStr) {
    if (activeDateFilter === "All") return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (activeDateFilter === "today") {
      return d.toDateString() === now.toDateString();
    }
    if (activeDateFilter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    if (activeDateFilter === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  }

  function renderOrders() {
    const list = document.getElementById("ordersList");
    const badge = document.getElementById("orderCountBadge");
    const pendingCount = allOrders.filter((o) => o.status === "Pending").length;
    if (badge) badge.textContent = pendingCount ? `(${pendingCount})` : "";

    const q = (orderSearch.value || "").trim().toLowerCase();
    let items = allOrders;
    if (activeOrderStatus !== "All") items = items.filter((o) => o.status === activeOrderStatus);
    if (activePaymentFilter !== "All") items = items.filter((o) => (o.payment_status || "Unpaid") === activePaymentFilter);
    items = items.filter((o) => withinDateFilter(o.created_at));
    if (q) {
      items = items.filter((o) =>
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.customer_phone || "").toLowerCase().includes(q)
      );
    }

    if (!items.length) {
      list.innerHTML = `<div class="msg">${allOrders.length ? "No orders match this filter." : "No orders yet — they'll appear here the moment someone hits \"Buy Now\" on the storefront."}</div>`;
      renderOrderBulkBar();
      return;
    }

    list.innerHTML = items.map((o) => {
      const waMsg = encodeURIComponent(
        `Hi ${o.customer_name}, this is Style OF Life confirming your order for ${o.product_name} (x${o.quantity}). Just checking in on your order status!`
      );
      const waLink = `https://wa.me/${(o.customer_phone || "").replace(/[^0-9]/g, "")}?text=${waMsg}`;
      return `
      <div class="order-row" data-id="${o.id}">
        <div class="o-check"><input type="checkbox" class="order-check" ${selectedOrderIds.has(String(o.id)) ? "checked" : ""}></div>
        <div>
          <div class="o-top">
            <span class="o-product">${escapeHtml(o.product_name)} × ${o.quantity}</span>
            <span>
              <span class="status-badge ${escapeHtml(o.status)}">${escapeHtml(o.status)}</span>
              <span class="pay-badge ${escapeHtml(o.payment_status || "Unpaid")}">${escapeHtml(o.payment_status || "Unpaid")}</span>
            </span>
          </div>
          <div class="o-meta">
            ₹${escapeHtml(o.unit_price)} each · ${new Date(o.created_at).toLocaleString("en-IN")}<br>
            ${escapeHtml(o.customer_name)} · ${escapeHtml(o.customer_phone)}<br>
            ${escapeHtml(o.customer_address)}
          </div>
          <input class="order-notes" data-action="notes" type="text" placeholder="Internal note (not shown to customer)…" value="${escapeHtml(o.admin_notes || "")}">
        </div>
        <div class="o-actions">
          <a class="link-btn" href="${waLink}" target="_blank" rel="noopener">WhatsApp</a>
          <button class="link-btn" data-action="label">Shipping label</button>
          <select class="order-select" data-action="status">
            ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
          <select class="order-select" data-action="payment">
            ${PAYMENT_STATUSES.map((s) => `<option value="${s}" ${s === (o.payment_status || "Unpaid") ? "selected" : ""}>${s}</option>`).join("")}
          </select>
          <button class="link-btn" data-action="delete-order" style="color:var(--oxblood)">Delete</button>
        </div>
      </div>
    `;
    }).join("");

    list.querySelectorAll('[data-action="status"]').forEach((sel) => {
      sel.addEventListener("change", async () => {
        const row = sel.closest(".order-row");
        const id = row.dataset.id;
        await window.supabaseClient.from("orders").update({ status: sel.value }).eq("id", id);
        loadOrders();
      });
    });

    list.querySelectorAll('[data-action="payment"]').forEach((sel) => {
      sel.addEventListener("change", async () => {
        const row = sel.closest(".order-row");
        const id = row.dataset.id;
        await window.supabaseClient.from("orders").update({ payment_status: sel.value }).eq("id", id);
        loadOrders();
      });
    });

    list.querySelectorAll('[data-action="notes"]').forEach((input) => {
      input.addEventListener("blur", async () => {
        const row = input.closest(".order-row");
        const id = row.dataset.id;
        await window.supabaseClient.from("orders").update({ admin_notes: input.value.trim() }).eq("id", id);
      });
    });

    list.querySelectorAll('[data-action="label"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest(".order-row");
        const o = allOrders.find((x) => String(x.id) === row.dataset.id);
        if (o) printShippingLabel(o);
      });
    });

    list.querySelectorAll('[data-action="delete-order"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        const row = btn.closest(".order-row");
        const id = row.dataset.id;
        if (!confirm("Delete this order permanently? This can't be undone.")) return;
        await window.supabaseClient.from("orders").delete().eq("id", id);
        loadOrders();
      });
    });

    list.querySelectorAll(".order-check").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.closest(".order-row").dataset.id;
        if (cb.checked) selectedOrderIds.add(id); else selectedOrderIds.delete(id);
        renderOrderBulkBar();
        syncSelectAllCheckbox("selectAllOrders", ".order-check");
      });
    });

    renderOrderBulkBar();
    syncSelectAllCheckbox("selectAllOrders", ".order-check");
  }

  // ---------------- Shipping label ----------------
  function labelBlockHtml(o) {
    const shortId = String(o.id).slice(0, 8).toUpperCase();
    return `
      <div class="label">
        <div class="brand">STYLE OF LIFE</div>
        <div class="sub">Imitation Jewellery</div>
        <div class="section">
          <div class="label-tag">Ship To</div>
          <div class="value">${escapeHtml(o.customer_name)}</div>
          <div class="addr">${escapeHtml(o.customer_address).replace(/\n/g, "<br>")}</div>
          <div class="addr">Phone: ${escapeHtml(o.customer_phone)}</div>
        </div>
        <div class="order-id">Order ${shortId} &nbsp;·&nbsp; ${new Date(o.created_at).toLocaleDateString("en-IN")}</div>
      </div>
    `;
  }

  const LABEL_STYLES = `
    @page{ size:4in 6in; margin:0.2in; }
    body{ font-family: 'Courier New', monospace; padding:16px; color:#1B120E; }
    .label{ border:2px solid #1B120E; padding:18px; }
    .brand{ font-size:20px; font-weight:bold; letter-spacing:1px; margin-bottom:2px; }
    .sub{ font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#555; margin-bottom:16px; }
    .section{ border-top:1px dashed #999; padding-top:10px; margin-top:10px; }
    .label-tag{ font-size:10px; letter-spacing:1px; text-transform:uppercase; color:#777; }
    .value{ font-size:15px; font-weight:bold; margin-top:2px; }
    .addr{ font-size:14px; line-height:1.5; margin-top:2px; }
    .order-id{ font-size:11px; color:#777; margin-top:16px; }
    .label-page{ margin-bottom:24px; }
    @media print{
      .no-print{ display:none; }
      .label-page{ page-break-after:always; margin-bottom:0; }
      .label-page:last-child{ page-break-after:auto; }
    }
  `;

  function printShippingLabel(o) {
    printShippingLabelsBulk([o]);
  }

  function printShippingLabelsBulk(orders) {
    if (!orders.length) return;
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) {
      alert("Please allow pop-ups to print shipping labels.");
      return;
    }
    const blocks = orders.map((o) => `<div class="label-page">${labelBlockHtml(o)}</div>`).join("");
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>Shipping Label${orders.length > 1 ? "s" : ""}</title>
      <style>${LABEL_STYLES}</style>
      </head><body>
        ${blocks}
        <p class="no-print" style="text-align:center; margin-top:16px;">
          <button onclick="window.print()" style="font-family:sans-serif; padding:10px 20px; cursor:pointer;">Print ${orders.length} label${orders.length === 1 ? "" : "s"}</button>
        </p>
      </body></html>
    `);
    win.document.close();
  }

  async function loadOrders() {
    const list = document.getElementById("ordersList");
    if (!list) return;
    const { data, error } = await window.supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      list.innerHTML = `<div class="msg error">${escapeHtml(error.message)}</div>`;
      return;
    }
    allOrders = data || [];
    renderOrders();
    renderStats();
    const analyticsTab = document.getElementById("analyticsTab");
    if (analyticsTab && analyticsTab.style.display === "block") renderAnalytics();
  }

  orderSearch.addEventListener("input", renderOrders);

  function ordersToCsv(list) {
    const header = ["Order ID", "Date", "Product", "Quantity", "Unit Price", "Customer Name", "Phone", "Address", "Status", "Payment Status", "Razorpay Payment ID", "Admin Notes"];
    const rows = list.map((o) => [
      o.id, new Date(o.created_at).toLocaleString("en-IN"),
      o.product_name, o.quantity, o.unit_price,
      o.customer_name, o.customer_phone, o.customer_address, o.status,
      o.payment_status || "Unpaid", o.razorpay_payment_id || "", o.admin_notes || ""
    ]);
    return [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  function downloadCsv(csv, filename) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportOrdersCsv() {
    if (!allOrders.length) return;
    downloadCsv(ordersToCsv(allOrders), `orders-${new Date().toISOString().slice(0, 10)}.csv`);
  }
  document.getElementById("exportOrdersBtn").addEventListener("click", exportOrdersCsv);

  // ---------------- Order bulk actions ----------------
  function renderOrderBulkBar() {
    const bar = document.getElementById("orderBulkBar");
    if (!bar) return;
    const n = selectedOrderIds.size;
    if (n === 0) {
      bar.classList.add("empty");
      bar.innerHTML = `Select orders below to apply bulk actions.`;
      return;
    }
    bar.classList.remove("empty");
    bar.innerHTML = `
      <span class="bb-count">${n} selected</span>
      <div class="bb-actions">
        <select id="bulkOrderStatusSelect">
          <option value="">Set status…</option>
          ${STATUSES.map((s) => `<option value="${s}">${s}</option>`).join("")}
        </select>
        <button class="bb-btn" id="bulkApplyStatusBtn">Apply</button>
        <select id="bulkOrderPaymentSelect">
          <option value="">Set payment…</option>
          ${PAYMENT_STATUSES.map((s) => `<option value="${s}">${s}</option>`).join("")}
        </select>
        <button class="bb-btn" id="bulkApplyPaymentBtn">Apply</button>
        <button class="bb-btn" id="bulkPrintLabelsBtn">Print labels</button>
        <button class="bb-btn" id="bulkExportSelectedBtn">Export selected</button>
        <button class="bb-btn danger" id="bulkDeleteOrdersBtn">Delete</button>
        <button class="bb-btn" id="bulkClearOrdersBtn">Clear</button>
      </div>
    `;

    function getSelectedOrders() {
      return allOrders.filter((o) => selectedOrderIds.has(String(o.id)));
    }

    document.getElementById("bulkApplyStatusBtn").addEventListener("click", async () => {
      const val = document.getElementById("bulkOrderStatusSelect").value;
      if (!val) return;
      for (const id of selectedOrderIds) {
        await window.supabaseClient.from("orders").update({ status: val }).eq("id", id);
      }
      selectedOrderIds.clear();
      loadOrders();
    });

    document.getElementById("bulkApplyPaymentBtn").addEventListener("click", async () => {
      const val = document.getElementById("bulkOrderPaymentSelect").value;
      if (!val) return;
      for (const id of selectedOrderIds) {
        await window.supabaseClient.from("orders").update({ payment_status: val }).eq("id", id);
      }
      selectedOrderIds.clear();
      loadOrders();
    });

    document.getElementById("bulkPrintLabelsBtn").addEventListener("click", () => {
      printShippingLabelsBulk(getSelectedOrders());
    });

    document.getElementById("bulkExportSelectedBtn").addEventListener("click", () => {
      downloadCsv(ordersToCsv(getSelectedOrders()), `orders-selected-${new Date().toISOString().slice(0, 10)}.csv`);
    });

    document.getElementById("bulkDeleteOrdersBtn").addEventListener("click", async () => {
      const ids = Array.from(selectedOrderIds);
      if (!confirm(`Delete ${ids.length} order${ids.length === 1 ? "" : "s"} permanently? This can't be undone.`)) return;
      for (const id of ids) {
        await window.supabaseClient.from("orders").delete().eq("id", id);
      }
      selectedOrderIds.clear();
      loadOrders();
    });

    document.getElementById("bulkClearOrdersBtn").addEventListener("click", () => {
      selectedOrderIds.clear();
      renderOrders();
    });
  }

  function wireSelectAllOrders() {
    const all = document.getElementById("selectAllOrders");
    if (!all) return;
    all.addEventListener("change", () => {
      document.querySelectorAll("#ordersList .order-check").forEach((cb) => {
        cb.checked = all.checked;
        const id = cb.closest(".order-row").dataset.id;
        if (all.checked) selectedOrderIds.add(id); else selectedOrderIds.delete(id);
      });
      renderOrderBulkBar();
    });
  }

  // ---------------- Bulk status update via Excel/CSV ----------------
  document.getElementById("bulkStatusBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("bulkStatusFile");
    const msg = document.getElementById("bulkStatusMsg");
    const file = fileInput.files[0];
    if (!file) {
      msg.textContent = "Choose a file first.";
      msg.className = "msg error";
      return;
    }
    if (typeof XLSX === "undefined") {
      msg.textContent = "The Excel reader didn't load — check your internet connection and try again.";
      msg.className = "msg error";
      return;
    }

    msg.textContent = "Reading file…";
    msg.className = "msg";

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) {
          msg.textContent = "That file has no rows.";
          msg.className = "msg error";
          return;
        }

        let updated = 0, skipped = 0;
        for (const row of rows) {
          const keys = Object.keys(row);
          const idKey = keys.find((k) => k.trim().toLowerCase() === "order id");
          const statusKey = keys.find((k) => k.trim().toLowerCase() === "status");
          const paymentKey = keys.find((k) => k.trim().toLowerCase() === "payment status");
          const id = idKey ? String(row[idKey]).trim() : "";
          const status = statusKey ? String(row[statusKey]).trim() : "";
          const payment = paymentKey ? String(row[paymentKey]).trim() : "";

          const updates = {};
          if (STATUSES.includes(status)) updates.status = status;
          if (PAYMENT_STATUSES.includes(payment)) updates.payment_status = payment;

          if (!id || Object.keys(updates).length === 0) {
            skipped++;
            continue;
          }
          const { error } = await window.supabaseClient.from("orders").update(updates).eq("id", id);
          if (error) skipped++; else updated++;
        }

        msg.textContent = `Updated ${updated} order${updated === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} (missing Order ID, or no valid Status/Payment Status value)` : ""}.`;
        msg.className = updated ? "msg ok" : "msg error";
        fileInput.value = "";
        loadOrders();
      } catch (err) {
        msg.textContent = "Couldn't read that file: " + err.message;
        msg.className = "msg error";
      }
    };
    reader.readAsArrayBuffer(file);
  });

  // ---------------- Analytics ----------------
  let charts = {};
  function upsertChart(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === "undefined") return;
    if (charts[id]) {
      charts[id].data = config.data;
      charts[id].options = config.options || charts[id].options;
      charts[id].update();
    } else {
      charts[id] = new Chart(canvas, config);
    }
  }

  function renderAnalytics() {
    if (typeof Chart === "undefined") return;

    const chartFont = { family: "IBM Plex Mono, monospace", size: 11 };
    Chart.defaults.font = chartFont;
    Chart.defaults.color = "#6b5c4f";

    // Revenue by day (paid orders only)
    const byDay = {};
    allOrders.filter((o) => o.payment_status === "Paid").forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      byDay[day] = (byDay[day] || 0) + (Number(o.unit_price) || 0) * (Number(o.quantity) || 1);
    });
    const dayLabels = Object.keys(byDay);
    upsertChart("chartRevenue", {
      type: "line",
      data: {
        labels: dayLabels,
        datasets: [{
          label: "Revenue (₹)",
          data: dayLabels.map((d) => byDay[d]),
          borderColor: "#7E2130",
          backgroundColor: "rgba(126,33,48,0.12)",
          tension: 0.35,
          fill: true,
          pointBackgroundColor: "#C79A56",
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // Orders by status
    const statusCounts = STATUSES.map((s) => allOrders.filter((o) => o.status === s).length);
    upsertChart("chartStatus", {
      type: "doughnut",
      data: {
        labels: STATUSES,
        datasets: [{
          data: statusCounts,
          backgroundColor: ["#E4CBA2", "#BBD6EA", "#D6C4EE", "#BFE2CC", "#EEC4C9"],
          borderWidth: 0,
        }]
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });

    // Top selling products (by quantity across all orders)
    const byProduct = {};
    allOrders.forEach((o) => {
      byProduct[o.product_name] = (byProduct[o.product_name] || 0) + (Number(o.quantity) || 1);
    });
    const topEntries = Object.entries(byProduct).sort((a, b) => b[1] - a[1]).slice(0, 6);
    upsertChart("chartTopProducts", {
      type: "bar",
      data: {
        labels: topEntries.map(([name]) => name),
        datasets: [{
          label: "Units ordered",
          data: topEntries.map(([, qty]) => qty),
          backgroundColor: "#C79A56",
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { precision: 0 } } }
      }
    });

    // At-a-glance cards
    const paidOrders = allOrders.filter((o) => o.payment_status === "Paid");
    const totalRevenue = paidOrders.reduce((s, o) => s + (Number(o.unit_price) || 0) * (Number(o.quantity) || 1), 0);
    const avgOrder = paidOrders.length ? totalRevenue / paidOrders.length : 0;
    const itemsSold = allOrders.reduce((s, o) => s + (Number(o.quantity) || 1), 0);
    const uniqueCustomers = new Set(allOrders.map((o) => (o.customer_phone || "").trim())).size;

    document.getElementById("analyticsCards").innerHTML = `
      <div class="stat-card"><div class="v">₹${Math.round(avgOrder).toLocaleString("en-IN")}</div><div class="l">Avg. paid order value</div></div>
      <div class="stat-card"><div class="v">${itemsSold}</div><div class="l">Total items ordered</div></div>
      <div class="stat-card"><div class="v">${uniqueCustomers}</div><div class="l">Unique customers</div></div>
      <div class="stat-card"><div class="v">${paidOrders.length}</div><div class="l">Paid orders</div></div>
    `;
  }

  // ---------------- Realtime ----------------
  window.supabaseClient
    .channel("public:orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
    .subscribe();

  window.supabaseClient
    .channel("public:products")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadAdminProducts())
    .subscribe();

  wireTabs();
  wireOrderFilters();
  wireSelectAllOrders();
  wireSelectAllProducts();
  window.supabaseClient.auth.onAuthStateChange(() => refreshSessionUI());
  refreshSessionUI();
})();
