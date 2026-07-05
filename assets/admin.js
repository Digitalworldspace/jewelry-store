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

  async function refreshSessionUI() {
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session) {
        loginPanel.style.display = "none";
        dashPanel.style.display = "block";
        logoutBtn.style.display = "inline-block";
        whoami.textContent = session.user.email;
        loadAdminProducts();
      } else {
        loginPanel.style.display = "block";
        dashPanel.style.display = "none";
        logoutBtn.style.display = "none";
        adminList.innerHTML = "";
      }
    } catch (err) {
      console.error("Session refresh error:", err);
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMsg.textContent = "";
    loginMsg.className = "msg";
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    
    if (!email || !password) {
      loginMsg.textContent = "Please enter both email and password.";
      loginMsg.className = "msg error";
      return;
    }

    try {
      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        loginMsg.textContent = error.message;
        loginMsg.className = "msg error";
        return;
      }
      loginForm.reset();
      refreshSessionUI();
    } catch (err) {
      loginMsg.textContent = "Sign in failed: " + err.message;
      loginMsg.className = "msg error";
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await window.supabaseClient.auth.signOut();
      refreshSessionUI();
    } catch (err) {
      console.error("Logout error:", err);
    }
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

    if (isNaN(Number(price)) || Number(price) < 0) {
      uploadMsg.textContent = "Please enter a valid price.";
      uploadMsg.className = "msg error";
      return;
    }

    const okTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      uploadMsg.textContent = "Please upload a JPEG, PNG or WEBP image.";
      uploadMsg.className = "msg error";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      uploadMsg.textContent = "Image must be smaller than 5MB.";
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

      uploadMsg.textContent = `✨ "${name}" is now live on the storefront.`;
      uploadMsg.className = "msg ok";
      uploadForm.reset();
      loadAdminProducts();

      // Scroll to product list
      document.querySelector(".panel:last-child")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      uploadMsg.textContent = "Upload failed: " + err.message;
      uploadMsg.className = "msg error";
    }
  });

  async function loadAdminProducts() {
    adminList.innerHTML = '<div class="state-msg" style="padding:20px;">Loading products…</div>';
    try {
      const { data, error } = await window.supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || !data.length) {
        adminList.innerHTML = `<div class="state-msg" style="padding:30px;">No products yet — add your first piece above.</div>`;
        return;
      }

      adminList.innerHTML = data.map((p) => `
        <div class="admin-row" data-id="${p.id}" data-path="${escapeHtml(p.storage_path || "")}">
          <img src="${escapeHtml(p.image_url || "")}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">
          <div>
            <div class="name">${escapeHtml(p.name)}</div>
            <div class="meta">₹${escapeHtml(p.price)}${p.original_price ? ` (was ₹${escapeHtml(p.original_price)})` : ""} · ${escapeHtml(p.category || "Uncategorised")}${p.badge ? ` · 🏷️ ${escapeHtml(p.badge)}` : ""}</div>
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
          const name = row.querySelector(".name")?.textContent || "this piece";
          if (!confirm(`Remove "${name}" from the live store?`)) return;

          try {
            await window.supabaseClient.from("products").delete().eq("id", id);
            if (path) {
              await window.supabaseClient.storage.from(BUCKET).remove([path]);
            }
            loadAdminProducts();
          } catch (err) {
            alert("Failed to delete: " + err.message);
          }
        });
      });
    } catch (err) {
      adminList.innerHTML = `<div class="msg error">Failed to load products: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Listen for auth changes
  window.supabaseClient.auth.onAuthStateChange(() => refreshSessionUI());

  // Initial load
  refreshSessionUI();
})();
