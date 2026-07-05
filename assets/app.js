(function () {
  const grid = document.getElementById("tray");
  const chipsBox = document.getElementById("chips");
  const searchBox = document.getElementById("search");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalBody = document.getElementById("modalBody");
  const mobileToggle = document.getElementById("mobileToggle");
  const mainNav = document.getElementById("mainNav");

  let allProducts = [];
  let activeCategory = "All";
  let activeSearch = "";

  // Mobile menu toggle
  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener("click", () => {
      mobileToggle.classList.toggle("active");
      mainNav.classList.toggle("open");
    });
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function formatPrice(p) {
    const n = Number(p);
    if (Number.isNaN(n)) return p;
    return "₹" + n.toLocaleString("en-IN");
  }

  function discountPct(price, mrp) {
    const p = Number(price),
      m = Number(mrp);
    if (!m || m <= p) return 0;
    return Math.round(((m - p) / m) * 100);
  }

  function ribbonClass(badge) {
    const b = (badge || "").toLowerCase();
    if (b === "new") return "new";
    if (b === "sale") return "sale";
    if (b === "bestseller") return "bestseller";
    return "";
  }

  function wireWhatsAppLinks() {
    const base = window.WHATSAPP_NUMBER ?
      `https://wa.me/${window.WHATSAPP_NUMBER.replace(/\s/g, "")}?text=${encodeURIComponent("Hi! I'd like to know more about your jewellery collection.")}` :
      "#";
    ["headerWa", "ctaWa", "footerWa", "footerWa2", "floatWa"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.href = base;
    });
  }

  function renderChips() {
    const cats = ["All", ...new Set(allProducts.map((p) => p.category).filter(Boolean))];
    chipsBox.innerHTML = cats.map((c) =>
      `<button class="chip ${c === activeCategory ? "active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join("");
    chipsBox.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        renderChips();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    let items = allProducts;
    if (activeCategory !== "All") {
      items = items.filter((p) => p.category === activeCategory);
    }
    if (activeSearch.trim()) {
      const q = activeSearch.trim().toLowerCase();
      items = items.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }

    if (!items.length) {
      grid.innerHTML = `
        <div class="loading-state" style="grid-column:1/-1;padding:60px 0;">
          <p style="color:var(--color-muted);font-family:var(--font-mono);font-size:0.85rem;">
            ✨ No pieces match your filters — try adjusting your search.
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map((p, i) => {
      const off = discountPct(p.price, p.original_price);
      const delay = Math.min(i, 15) * 50;
      return `
        <article class="product-card" data-id="${p.id}" style="animation-delay:${delay}ms">
          <div class="product-card-image">
            ${p.image_url ?
              `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">` :
              `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--color-muted-light);font-family:var(--font-mono);font-size:0.8rem;">no image</div>`
            }
            ${p.badge ? `<span class="product-card-badge ${ribbonClass(p.badge)}">${escapeHtml(p.badge)}</span>` : ""}
            <div class="product-card-overlay">
              <span>👁️ Quick View</span>
            </div>
          </div>
          <div class="product-card-info">
            <div class="product-card-category">${escapeHtml(p.category || "Uncategorised")}</div>
            <h3 class="product-card-name">${escapeHtml(p.name)}</h3>
            <div class="product-card-price">
              <span class="price-current">${formatPrice(p.price)}</span>
              ${off > 0 ? `
                <span class="price-original">${formatPrice(p.original_price)}</span>
                <span class="price-discount">${off}% off</span>
              ` : ""}
            </div>
          </div>
        </article>
      `;
    }).join("");

    grid.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("click", () => {
        const p = allProducts.find((x) => String(x.id) === card.dataset.id);
        if (p) openModal(p);
      });
    });
  }

  function openModal(p) {
    const off = discountPct(p.price, p.original_price);
    const waMsg = encodeURIComponent(`Hi! I'm interested in "${p.name}" (${formatPrice(p.price)}). Is it available?`);
    const waLink = window.WHATSAPP_NUMBER ?
      `https://wa.me/${window.WHATSAPP_NUMBER.replace(/\s/g, "")}?text=${waMsg}` :
      "#";

    modalBody.innerHTML = `
      ${p.image_url ?
        `<img class="modal-image" src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">` :
        `<div class="modal-image" style="display:flex;align-items:center;justify-content:center;color:var(--color-muted-light);font-family:var(--font-mono);font-size:0.9rem;">✨ no image</div>`}
      <div class="modal-body">
        <button class="modal-close" aria-label="Close">✕</button>
        <div class="modal-category">${escapeHtml(p.category || "Uncategorised")}</div>
        <h2 class="modal-title">${escapeHtml(p.name)}</h2>
        <div class="modal-price">
          <span class="modal-price-current">${formatPrice(p.price)}</span>
          ${off > 0 ? `
            <span class="modal-price-original">${formatPrice(p.original_price)}</span>
            <span class="modal-price-discount">${off}% off</span>
          ` : ""}
        </div>
        <p class="modal-description">${escapeHtml(p.description || "No description added yet.")}</p>
        <a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener" style="width:100%;justify-content:center;">
          <span class="btn-icon">💬</span> Enquire on WhatsApp
        </a>
      </div>
    `;
    modalBody.querySelector(".modal-close").addEventListener("click", closeModal);
    modalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modalBackdrop.classList.remove("open");
    modalBody.innerHTML = "";
    document.body.style.overflow = "";
  }

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  searchBox.addEventListener("input", (e) => {
    activeSearch = e.target.value;
    renderGrid();
  });

  async function loadProducts() {
    grid.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Curating the collection…</p>
      </div>
    `;
    try {
      const { data, error } = await window.supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      allProducts = data || [];
      renderChips();
      renderGrid();
    } catch (err) {
      grid.innerHTML = `
        <div class="loading-state" style="grid-column:1/-1;padding:60px 0;">
          <p style="color:var(--color-accent);font-family:var(--font-mono);font-size:0.85rem;">
            ⚠️ Couldn't load products: ${escapeHtml(err.message)}
          </p>
        </div>
      `;
    }
  }

  // Live updates
  try {
    window.supabaseClient
      .channel("public:products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        loadProducts();
      })
      .subscribe();
  } catch (err) {
    console.warn("Realtime subscription error:", err);
  }

  // Newsletter form
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector(".newsletter-input");
      if (input && input.value.trim()) {
        alert("✨ Thanks for subscribing! We'll keep you updated on new arrivals.");
        input.value = "";
      }
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  wireWhatsAppLinks();
  loadProducts();
})();
