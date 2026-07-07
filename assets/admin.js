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

  let allAdminProducts = [];
  let allOrders = [];
  let editingProductId = null;
  let activeOrderStatus = "All";

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------------- Tabs ----------------
  function wireTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("productsTab").style.display = btn.dataset.tab === "products" ? "block" : "none";
        document.getElementById("ordersTab").style.display = btn.dataset.tab === "orders" ? "block" : "none";
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
      .filter((o) => o.status === "Confirmed" || o.status === "Shipped" || o.status === "Delivered")
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
      return;
    }

    adminList.innerHTML = items.map((p) => `
      <div class="admin-row ${p.id === editingProductId ? "editing" : ""}" data-id="${p.id}" data-path="${escapeHtml(p.storage_path || "")}">
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
  }

  function renderOrders() {
    const list = document.getElementById("ordersList");
    const badge = document.getElementById("orderCountBadge");
    const pendingCount = allOrders.filter((o) => o.status === "Pending").length;
    if (badge) badge.textContent = pendingCount ? `(${pendingCount})` : "";

    const q = (orderSearch.value || "").trim().toLowerCase();
    let items = allOrders;
    if (activeOrderStatus !== "All") items = items.filter((o) => o.status === activeOrderStatus);
    if (q) {
      items = items.filter((o) =>
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.customer_phone || "").toLowerCase().includes(q)
      );
    }

    if (!items.length) {
      list.innerHTML = `<div class="msg">${allOrders.length ? "No orders match this filter." : "No orders yet — they'll appear here the moment someone hits \"Buy Now\" on the storefront."}</div>`;
      return;
    }

    list.innerHTML = items.map((o) => {
      const waMsg = encodeURIComponent(
        `Hi ${o.customer_name}, this is Style OF Life confirming your order for ${o.product_name} (x${o.quantity}). Just checking in on your order status!`
      );
      const waLink = `https://wa.me/${(o.customer_phone || "").replace(/[^0-9]/g, "")}?text=${waMsg}`;
      return `
      <div class="order-row" data-id="${o.id}">
        <div>
          <div class="o-top">
            <span class="o-product">${escapeHtml(o.product_name)} × ${o.quantity}</span>
            <span class="status-badge ${escapeHtml(o.status)}">${escapeHtml(o.status)}</span>
          </div>
          <div class="o-meta">
            ₹${escapeHtml(o.unit_price)} each · ${new Date(o.created_at).toLocaleString("en-IN")}<br>
            ${escapeHtml(o.customer_name)} · ${escapeHtml(o.customer_phone)}<br>
            ${escapeHtml(o.customer_address)}
          </div>
        </div>
        <div class="o-actions">
          <a class="link-btn" href="${waLink}" target="_blank" rel="noopener">WhatsApp</a>
          <select class="order-select" data-action="status">
            ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
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
  }

  orderSearch.addEventListener("input", renderOrders);

  function exportOrdersCsv() {
    if (!allOrders.length) return;
    const header = ["Date", "Product", "Quantity", "Unit Price", "Customer Name", "Phone", "Address", "Status"];
    const rows = allOrders.map((o) => [
      new Date(o.created_at).toLocaleString("en-IN"),
      o.product_name, o.quantity, o.unit_price,
      o.customer_name, o.customer_phone, o.customer_address, o.status
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  document.getElementById("exportOrdersBtn").addEventListener("click", exportOrdersCsv);

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
  window.supabaseClient.auth.onAuthStateChange(() => refreshSessionUI());
  refreshSessionUI();
})();
