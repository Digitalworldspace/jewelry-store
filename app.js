(function () {
  const grid = document.getElementById("tray");
  const chipsBox = document.getElementById("chips");
  const searchBox = document.getElementById("search");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalBody = document.getElementById("modalBody");

  let allProducts = [];
  let activeCategory = "All";
  let activeSearch = "";

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function formatPrice(p) {
    const n = Number(p);
    if (Number.isNaN(n)) return p;
    return "₹" + n.toLocaleString("en-IN");
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
      grid.innerHTML = `<div class="state-msg">No pieces match yet — try another filter, or check back soon.</div>`;
      return;
    }

    grid.innerHTML = items.map((p) => `
      <article class="tag-card" data-id="${p.id}">
        <span class="punch"></span>
        <div class="thumb">
          ${p.image_url
            ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">`
            : `<div class="ph">no image yet</div>`}
        </div>
        <div class="info">
          <div class="cat">${escapeHtml(p.category || "Uncategorised")}</div>
          <h3>${escapeHtml(p.name)}</h3>
          <div class="price">${formatPrice(p.price)}</div>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll(".tag-card").forEach((card) => {
      card.addEventListener("click", () => {
        const p = allProducts.find((x) => String(x.id) === card.dataset.id);
        if (p) openModal(p);
      });
    });
  }

  function openModal(p) {
    const waMsg = encodeURIComponent(`Hi! I'm interested in "${p.name}" (${formatPrice(p.price)}). Is it available?`);
    const waLink = window.WHATSAPP_NUMBER
      ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${waMsg}`
      : "#";

    modalBody.innerHTML = `
      ${p.image_url
        ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}">`
        : `<div class="thumb"><div class="ph">no image yet</div></div>`}
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <div class="cat">${escapeHtml(p.category || "Uncategorised")}</div>
        <h2>${escapeHtml(p.name)}</h2>
        <div class="price">${formatPrice(p.price)}</div>
        <p class="desc">${escapeHtml(p.description || "No description added yet.")}</p>
        <a class="btn" href="${waLink}" target="_blank" rel="noopener">Enquire on WhatsApp</a>
      </div>
    `;
    modalBody.querySelector(".close").addEventListener("click", closeModal);
    modalBackdrop.classList.add("open");
  }

  function closeModal() {
    modalBackdrop.classList.remove("open");
    modalBody.innerHTML = "";
  }
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  searchBox.addEventListener("input", (e) => {
    activeSearch = e.target.value;
    renderGrid();
  });

  async function loadProducts() {
    grid.innerHTML = `<div class="state-msg">Loading the collection…</div>`;
    const { data, error } = await window.supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      grid.innerHTML = `<div class="state-msg">Couldn't load products: ${escapeHtml(error.message)}</div>`;
      return;
    }
    allProducts = data || [];
    renderChips();
    renderGrid();
  }

  // Live updates: new / edited / removed products from the admin
  // panel appear here immediately, no page refresh needed.
  window.supabaseClient
    .channel("public:products")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
      loadProducts();
    })
    .subscribe();

  loadProducts();
})();
