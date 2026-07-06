(function () {
  const loginPanel = document.getElementById("loginPanel");
  const dashPanel = document.getElementById("dashPanel");
  const loginForm = document.getElementById("loginForm");
  const loginMsg = document.getElementById("loginMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const uploadForm = document.getElementById("uploadForm");
  const uploadMsg = document.getElementById("uploadMsg");
  const adminList = document.getElementById("adminList");
  const whoami = document.getElementById("whoami");

  const BUCKET = "product-images";

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

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

    const badge = document.getElementById("orderCountBadge");
    const pendingCount = (data || []).filter((o) => o.status === "Pending").length;
    if (badge) badge.textContent = pendingCount ? `(${pendingCount})` : "";

    if (!data.length) {
      list.innerHTML = `<div class="msg">No orders yet — they'll appear here the moment someone hits "Buy Now" on the storefront.</div>`;
      return;
    }

    list.innerHTML = data.map((o) => {
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

  window.supabaseClient
    .channel("public:orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
      loadOrders();
    })
    .subscribe();

  wireTabs();

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

  logoutBtn.addEventListener("click", async () => {
    await window.supabaseClient.auth.signOut();
    refreshSessionUI();
  });

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadMsg.textContent = "Uploading…";
    uploadMsg.className = "msg";

    const name = document.getElementById("pName").value.trim();
    const price = document.getElementById("pPrice").value;
    const original_price = document.getElementById("pOriginalPrice").value || null;
    const badge = document.getElementById("pBadge").value || null;
    const category = document.getElementById("pCategory").value.trim();
    const description = document.getElementById("pDesc").value.trim();
    const file = document.getElementById("pImage").files[0];

    if (!name || !price || !file) {
      uploadMsg.textContent = "Name, price and an image are required.";
      uploadMsg.className = "msg error";
      return;
    }

    const okTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      uploadMsg.textContent = "Please upload a JPEG, PNG or WEBP image.";
      uploadMsg.className = "msg error";
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
        .insert([{ name, price, original_price, badge, category, description, image_url, storage_path: path }]);
      if (insErr) throw insErr;

      uploadMsg.textContent = `"${name}" is live on the site now.`;
      uploadMsg.className = "msg ok";
      uploadForm.reset();
      loadAdminProducts();
    } catch (err) {
      uploadMsg.textContent = "Upload failed: " + err.message;
      uploadMsg.className = "msg error";
    }
  });

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
    if (!data.length) {
      adminList.innerHTML = `<div class="msg">No products yet — add your first piece above.</div>`;
      return;
    }
    adminList.innerHTML = data.map((p) => `
      <div class="admin-row" data-id="${p.id}" data-path="${escapeHtml(p.storage_path || "")}">
        <img src="${escapeHtml(p.image_url || "")}" alt="">
        <div>
          <div class="name">${escapeHtml(p.name)}</div>
          <div class="meta">₹${escapeHtml(p.price)}${p.original_price ? ` (was ₹${escapeHtml(p.original_price)})` : ""} · ${escapeHtml(p.category || "—")}${p.badge ? ` · ${escapeHtml(p.badge)}` : ""}</div>
        </div>
        <div class="meta">${new Date(p.created_at).toLocaleDateString("en-IN")}</div>
        <button class="link-btn" data-action="delete">Remove</button>
      </div>
    `).join("");

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
        loadAdminProducts();
      });
    });
  }

  window.supabaseClient.auth.onAuthStateChange(() => refreshSessionUI());
  refreshSessionUI();
})();
