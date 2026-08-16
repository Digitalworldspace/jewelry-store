(function () {
  const grid = document.getElementById("tray");

  // ---------------- Shopping cart ----------------
  let cart = [];
  function loadCartFromStorage() {
    try {
      const raw = localStorage.getItem("sol_cart");
      cart = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch (e) { cart = []; }
  }
  function saveCartToStorage() {
    try { localStorage.setItem("sol_cart", JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }
  function calcShipping(subtotal) {
    const fee = Number(window.SHIPPING_FEE) || 0;
    const threshold = Number(window.FREE_SHIPPING_THRESHOLD);
    if (threshold && subtotal >= threshold) return 0;
    return fee;
  }

  function cartSubtotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
  function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }

  function addToCart(p, qty) {
    qty = qty || 1;
    const existing = cart.find((i) => String(i.id) === String(p.id));
    if (existing) existing.qty += qty;
    else cart.push({ id: p.id, name: p.name, price: p.price, image_url: p.image_url || null, qty });
    saveCartToStorage();
    renderCartBadge();
    renderCartDrawer();
    trackEvent("add_to_cart", p.name);
    openCartDrawer();
  }
  function removeFromCart(id) {
    cart = cart.filter((i) => String(i.id) !== String(id));
    saveCartToStorage();
    renderCartBadge();
    renderCartDrawer();
  }
  function setCartQty(id, qty) {
    const item = cart.find((i) => String(i.id) === String(id));
    if (!item) return;
    item.qty = Math.max(1, qty);
    saveCartToStorage();
    renderCartBadge();
    renderCartDrawer();
  }
  function clearCart() {
    cart = [];
    saveCartToStorage();
    renderCartBadge();
    renderCartDrawer();
  }

  function renderCartBadge() {
    const badge = document.getElementById("cartCount");
    if (!badge) return;
    const n = cartCount();
    badge.textContent = n;
    badge.style.display = n > 0 ? "flex" : "none";
  }

  function renderCartDrawer() {
    const body = document.getElementById("cartDrawerBody");
    const footer = document.getElementById("cartDrawerFooter");
    if (!body) return;

    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty">Your cart is empty.<br>Add something beautiful ✦</div>`;
      if (footer) footer.style.display = "none";
      return;
    }
    if (footer) footer.style.display = "block";

    body.innerHTML = cart.map((item) => `
      <div class="cart-line" data-id="${item.id}">
        ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}">` : `<div class="ph" style="width:64px;height:64px;background:#EADFC6;"></div>`}
        <div class="cart-line-info">
          <div class="name">${escapeHtml(item.name)}</div>
          <div class="price">${formatPrice(item.price)}</div>
          <div class="qty-control">
            <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="cart-remove" type="button" data-action="remove" aria-label="Remove item">&times;</button>
      </div>
    `).join("");

    body.querySelectorAll('[data-action="dec"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".cart-line").dataset.id;
        const item = cart.find((i) => String(i.id) === id);
        if (!item) return;
        if (item.qty <= 1) removeFromCart(id); else setCartQty(id, item.qty - 1);
      });
    });
    body.querySelectorAll('[data-action="inc"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".cart-line").dataset.id;
        const item = cart.find((i) => String(i.id) === id);
        if (item) setCartQty(id, item.qty + 1);
      });
    });
    body.querySelectorAll('[data-action="remove"]').forEach((btn) => {
      btn.addEventListener("click", () => removeFromCart(btn.closest(".cart-line").dataset.id));
    });

    const subtotalEl = document.getElementById("cartDrawerSubtotal");
    const shippingEl = document.getElementById("cartDrawerShipping");
    const totalEl = document.getElementById("cartDrawerTotal");
    const subtotal = cartSubtotal();
    const shipping = calcShipping(subtotal);
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = shipping > 0 ? formatPrice(shipping) : "Free";
    if (totalEl) totalEl.textContent = formatPrice(subtotal + shipping);
  }

  function openCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("cartDrawerBackdrop");
    if (drawer) drawer.classList.add("open");
    if (backdrop) backdrop.classList.add("open");
  }
  function closeCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("cartDrawerBackdrop");
    if (drawer) drawer.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
  }

  function wireCartUI() {
    const cartBtn = document.getElementById("cartOpenBtn");
    const closeCartBtn = document.getElementById("cartCloseBtn");
    const backdrop = document.getElementById("cartDrawerBackdrop");
    const checkoutBtn = document.getElementById("cartCheckoutBtn");
    if (cartBtn) cartBtn.addEventListener("click", openCartDrawer);
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartDrawer);
    if (backdrop) backdrop.addEventListener("click", closeCartDrawer);
    if (checkoutBtn) checkoutBtn.addEventListener("click", () => {
      closeCartDrawer();
      openCartCheckout();
    });
    loadCartFromStorage();
    renderCartBadge();
    renderCartDrawer();
  }

  // ---------------- Anonymous behavior tracking (owner-only visibility) ----------------
  // Logs interactions like page views, product views, searches, and clicks
  // so the store owner can see them in admin.html. No names, phone numbers,
  // or addresses are ever included here — see customer_events RLS in
  // supabase-setup.sql, which blocks anyone but the signed-in admin from
  // reading this table at all.
  const sessionId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  function trackEvent(eventType, detail) {
    try {
      window.supabaseClient
        .from("customer_events")
        .insert([{ event_type: eventType, event_detail: detail || null, session_id: sessionId }])
        .then(() => {}, () => {});
    } catch (e) { /* never let tracking break the site */ }
  }
  trackEvent("page_view", document.title);
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

  function discountPct(price, mrp) {
    const p = Number(price), m = Number(mrp);
    if (!m || m <= p) return 0;
    return Math.round(((m - p) / m) * 100);
  }

  function ribbonClass(badge) {
    const b = (badge || "").toLowerCase();
    if (b === "new") return "new";
    if (b === "sale" || b === "limited stock") return "sale";
    return "";
  }

  // Wire every WhatsApp entry point on the page to the configured number
  function formatWhatsAppNumber(raw) {
    const digits = String(raw || "").replace(/[^0-9]/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
      return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return digits ? `+${digits}` : "";
  }

  function wireWhatsAppLinks() {
    const base = window.WHATSAPP_NUMBER
      ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to know more about your jewellery collection.")}`
      : "#";
    ["headerWa", "ctaWa", "footerWa", "floatWa"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.href = base;
        el.addEventListener("click", () => trackEvent("whatsapp_click", id));
      }
    });

    const displayNumber = formatWhatsAppNumber(window.WHATSAPP_NUMBER);
    const footerNum = document.getElementById("footerWaNumber");
    if (footerNum) {
      footerNum.textContent = displayNumber || "Add your WhatsApp number in config.js";
      footerNum.href = base;
    }
    const ctaNum = document.getElementById("ctaWaNumber");
    if (ctaNum && displayNumber) {
      ctaNum.textContent = `or message us directly on ${displayNumber}`;
    }
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
        if (activeCategory !== "All") trackEvent("filter_category", activeCategory);
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

    grid.innerHTML = items.map((p, i) => {
      const off = discountPct(p.price, p.original_price);
      return `
      <article class="tag-card" data-id="${p.id}" style="animation-delay:${Math.min(i, 10) * 40}ms">
        <span class="punch"></span>
        ${p.badge ? `<span class="ribbon ${ribbonClass(p.badge)}">${escapeHtml(p.badge)}</span>` : ""}
        <div class="thumb">
          ${p.image_url
            ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">`
            : `<div class="ph">no image yet</div>`}
          <div class="quickview">Tap to view</div>
        </div>
        <div class="info">
          <div class="cat">${escapeHtml(p.category || "Uncategorised")}</div>
          <h3>${escapeHtml(p.name)}</h3>
          <div class="price-row">
            <span class="price">${formatPrice(p.price)}</span>
            ${off > 0 ? `<span class="mrp">${formatPrice(p.original_price)}</span><span class="off">${off}% off</span>` : ""}
          </div>
          <div class="actions">
            <button class="btn-buy" data-buy="${p.id}">Buy Now</button>
            <button class="btn-cart-add" data-cart="${p.id}" aria-label="Add to cart" title="Add to cart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
    }).join("");

    grid.querySelectorAll(".tag-card").forEach((card) => {
      card.addEventListener("click", () => {
        const p = allProducts.find((x) => String(x.id) === card.dataset.id);
        if (p) openModal(p);
      });
    });
    grid.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const p = allProducts.find((x) => String(x.id) === btn.dataset.buy);
        if (p) openCheckout(p);
      });
    });
    grid.querySelectorAll("[data-cart]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const p = allProducts.find((x) => String(x.id) === btn.dataset.cart);
        if (p) addToCart(p);
      });
    });
  }

  const STYLE_PHRASES = [
    "Stunning together", "Looks beautiful paired", "A perfect match",
    "Styled to perfection", "Effortlessly elegant together", "Complements this beautifully"
  ];

  function relatedProductsHtml(p) {
    // Prefer a cross-category pairing ("complete the look" — e.g. a necklace
    // shown with a kurti), falling back to the same category, then anything,
    // so this stays useful even with just one category in the catalog.
    let pool = allProducts.filter((x) => String(x.id) !== String(p.id) && x.category && p.category && x.category !== p.category);
    if (!pool.length) pool = allProducts.filter((x) => String(x.id) !== String(p.id) && x.category === p.category);
    if (!pool.length) pool = allProducts.filter((x) => String(x.id) !== String(p.id));

    const related = shuffleArray(pool).slice(0, 4);
    if (!related.length) return "";

    return `
      <div class="related-products">
        <div class="related-label">✦ Complete the look</div>
        <div class="related-row">
          ${related.map((r) => {
            const phrase = STYLE_PHRASES[Math.floor(Math.random() * STYLE_PHRASES.length)];
            return `
            <div class="related-item" data-id="${r.id}">
              <div class="related-thumb">
                ${r.image_url ? `<img src="${escapeHtml(r.image_url)}" alt="${escapeHtml(r.name)}">` : `<div class="ph" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:.6rem;">no image</div>`}
              </div>
              <span class="related-name">${escapeHtml(r.name)}</span>
              <span class="related-phrase">${phrase}</span>
            </div>
          `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function openModal(p) {
    trackEvent("view_product", p.name);
    const off = discountPct(p.price, p.original_price);
    const waMsg = encodeURIComponent(`Hi! I'm interested in "${p.name}" (${formatPrice(p.price)}). Is it available?`);
    const waLink = window.WHATSAPP_NUMBER
      ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${waMsg}`
      : "#";

    modalBody.innerHTML = `
      <div class="modal-image">
        ${p.image_url
          ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}">`
          : `<div class="thumb"><div class="ph">no image yet</div></div>`}
        ${p.badge ? `<span class="modal-badge ${ribbonClass(p.badge)}">${escapeHtml(p.badge)}</span>` : ""}
      </div>
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <div class="cat">${escapeHtml(p.category || "Uncategorised")}</div>
        <h2>${escapeHtml(p.name)}</h2>
        <div class="price-row">
          <span class="price">${formatPrice(p.price)}</span>
          ${off > 0 ? `<span class="mrp">${formatPrice(p.original_price)}</span><span class="off">${off}% off</span>` : ""}
        </div>
        <p class="desc">${escapeHtml(p.description || "No description added yet.")}</p>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button class="btn gold" id="modalBuyNow"><span class="shine"></span>Buy Now</button>
          <button class="btn ghost" id="modalAddCart"><span class="shine"></span>Add to Cart</button>
          <a class="btn ghost" href="${waLink}" target="_blank" rel="noopener"><span class="shine"></span>Enquire on WhatsApp</a>
        </div>
        ${relatedProductsHtml(p)}
      </div>
    `;
    modalBody.querySelector(".close").addEventListener("click", closeModal);
    modalBody.querySelector("#modalBuyNow").addEventListener("click", () => {
      closeModal();
      openCheckout(p);
    });
    modalBody.querySelector("#modalAddCart").addEventListener("click", () => {
      addToCart(p);
    });
    const enquireLink = modalBody.querySelector("a.btn.ghost");
    if (enquireLink) enquireLink.addEventListener("click", () => trackEvent("whatsapp_click", "product_enquiry: " + p.name));
    modalBody.querySelectorAll(".related-item").forEach((el) => {
      el.addEventListener("click", () => {
        const rp = allProducts.find((x) => String(x.id) === el.dataset.id);
        if (rp) openModal(rp);
      });
    });
    modalBackdrop.classList.add("open");
  }

  function closeModal() {
    modalBackdrop.classList.remove("open");
    modalBody.innerHTML = "";
  }
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ---------------- Checkout / Buy Now ----------------
  const checkoutBackdrop = document.getElementById("checkoutBackdrop");
  const checkoutBody = document.getElementById("checkoutBody");

  function closeCheckout() {
    checkoutBackdrop.classList.remove("open");
    checkoutBody.innerHTML = "";
  }
  checkoutBackdrop.addEventListener("click", (e) => {
    if (e.target === checkoutBackdrop) closeCheckout();
  });

  function openCheckout(p) {
    trackEvent("buy_now_click", p.name);
    const initialShipping = calcShipping(p.price);
    checkoutBody.innerHTML = `
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <h2>Complete your order</h2>
        <div class="co-product">
          ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}">` : ""}
          <div>
            <div class="name">${escapeHtml(p.name)}</div>
            <div class="price">${formatPrice(p.price)}</div>
          </div>
        </div>
        <form id="checkoutForm">
          <div class="row2">
            <div class="field">
              <label>Full name</label>
              <input type="text" id="coName" required>
            </div>
            <div class="field">
              <label>Quantity</label>
              <input type="number" id="coQty" min="1" value="1" required>
            </div>
          </div>
          <div class="field">
            <label>WhatsApp number</label>
            <input type="tel" id="coPhone" placeholder="10-digit mobile number" required>
          </div>
          <div class="field">
            <label>Delivery address</label>
            <textarea id="coAddress" required placeholder="House no, street, city, state, PIN code"></textarea>
          </div>
          <div class="cart-cost-breakdown">
            <div><span>Subtotal</span><span id="coSubtotalLabel">${formatPrice(p.price)}</span></div>
            <div><span>Shipping</span><span id="coShippingLabel">${initialShipping > 0 ? formatPrice(initialShipping) : "Free"}</span></div>
            <div class="total-row"><span>Total</span><span id="coTotalLabel">${formatPrice(p.price + initialShipping)}</span></div>
          </div>
          <button class="btn gold" type="submit" style="width:100%; justify-content:center; margin-top:14px;"><span class="shine"></span>Pay Now</button>
          <div class="msg" id="checkoutMsg"></div>
        </form>
      </div>
    `;
    checkoutBody.querySelector(".close").addEventListener("click", closeCheckout);

    const qtyInput = checkoutBody.querySelector("#coQty");
    const subtotalLabel = checkoutBody.querySelector("#coSubtotalLabel");
    const shippingLabel = checkoutBody.querySelector("#coShippingLabel");
    const totalLabel = checkoutBody.querySelector("#coTotalLabel");
    qtyInput.addEventListener("input", () => {
      const q = parseInt(qtyInput.value, 10) || 1;
      const sub = p.price * q;
      const ship = calcShipping(sub);
      subtotalLabel.textContent = formatPrice(sub);
      shippingLabel.textContent = ship > 0 ? formatPrice(ship) : "Free";
      totalLabel.textContent = formatPrice(sub + ship);
    });

    checkoutBody.querySelector("#checkoutForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = checkoutBody.querySelector("#checkoutMsg");
      const name = checkoutBody.querySelector("#coName").value.trim();
      const phone = checkoutBody.querySelector("#coPhone").value.trim();
      const qty = parseInt(checkoutBody.querySelector("#coQty").value, 10) || 1;
      const address = checkoutBody.querySelector("#coAddress").value.trim();
      const shipping = calcShipping(p.price * qty);

      if (!name || !phone || !address) {
        msg.textContent = "Please fill in all fields.";
        msg.className = "msg error";
        return;
      }

      msg.textContent = "Saving your order…";
      msg.className = "msg";

      const { data: orderRow, error } = await window.supabaseClient
        .from("orders")
        .insert([{
          product_id: p.id,
          product_name: p.name,
          unit_price: p.price,
          quantity: qty,
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          status: "Pending",
          payment_status: "Unpaid",
          shipping_fee: shipping
        }])
        .select()
        .single();

      if (error) {
        msg.textContent = "Couldn't place the order: " + error.message;
        msg.className = "msg error";
        return;
      }

      const totalAmount = p.price * qty + shipping;
      startRazorpayPayment(orderRow, p, name, phone, qty, totalAmount, msg);
    });

    checkoutBackdrop.classList.add("open");
  }

  function shortOrderId(id) {
    return String(id).slice(0, 8).toUpperCase();
  }

  // ---------------- Cart checkout (multi-item) ----------------
  function openCartCheckout() {
    if (!cart.length) return;
    trackEvent("cart_checkout_open", String(cart.length));

    const subtotal = cartSubtotal();
    const shipping = calcShipping(subtotal);
    const total = subtotal + shipping;

    checkoutBody.innerHTML = `
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <h2>Complete your order</h2>
        <div class="cart-summary-list">
          ${cart.map((item) => `
            <div class="cart-summary-item">
              ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}">` : `<div class="ph" style="width:52px;height:52px;background:#EADFC6;"></div>`}
              <div class="csi-info">
                <div class="name">${escapeHtml(item.name)}</div>
                <div class="meta">${formatPrice(item.price)} × ${item.qty}</div>
              </div>
              <div class="csi-total">${formatPrice(item.price * item.qty)}</div>
            </div>
          `).join("")}
        </div>
        <div class="cart-cost-breakdown">
          <div><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
          <div><span>Shipping</span><span>${shipping > 0 ? formatPrice(shipping) : "Free"}</span></div>
          <div class="total-row"><span>Total</span><span>${formatPrice(total)}</span></div>
        </div>
        <form id="cartCheckoutForm">
          <div class="field">
            <label>Full name</label>
            <input type="text" id="ccName" required>
          </div>
          <div class="field">
            <label>WhatsApp number</label>
            <input type="tel" id="ccPhone" placeholder="10-digit mobile number" required>
          </div>
          <div class="field">
            <label>Delivery address</label>
            <textarea id="ccAddress" required placeholder="House no, street, city, state, PIN code"></textarea>
          </div>
          <button class="btn gold" type="submit" style="width:100%; justify-content:center;"><span class="shine"></span>Pay Now — ${formatPrice(total)}</button>
          <div class="msg" id="cartCheckoutMsg"></div>
        </form>
      </div>
    `;
    checkoutBody.querySelector(".close").addEventListener("click", closeCheckout);

    checkoutBody.querySelector("#cartCheckoutForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = checkoutBody.querySelector("#cartCheckoutMsg");
      const name = checkoutBody.querySelector("#ccName").value.trim();
      const phone = checkoutBody.querySelector("#ccPhone").value.trim();
      const address = checkoutBody.querySelector("#ccAddress").value.trim();

      if (!name || !phone || !address) {
        msg.textContent = "Please fill in all fields.";
        msg.className = "msg error";
        return;
      }

      msg.textContent = "Saving your order…";
      msg.className = "msg";

      const groupId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
      const rows = cart.map((item, i) => ({
        product_id: item.id,
        product_name: item.name,
        unit_price: item.price,
        quantity: item.qty,
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        status: "Pending",
        payment_status: "Unpaid",
        order_group_id: groupId,
        // Store the whole cart's shipping fee once, on the first line only,
        // so it isn't double-counted when summing shipping across orders —
        // but it's still shown in full to the customer above, before payment.
        shipping_fee: i === 0 ? shipping : 0
      }));

      const { data: orderRows, error } = await window.supabaseClient
        .from("orders")
        .insert(rows)
        .select();

      if (error) {
        msg.textContent = "Couldn't place the order: " + error.message;
        msg.className = "msg error";
        return;
      }

      clearCart();
      startCartRazorpayPayment(orderRows, name, phone, total, msg);
    });

    checkoutBackdrop.classList.add("open");
  }

  function showCartWhatsAppFallback(orderRows, name, phone, address, note) {
    const orderCode = shortOrderId(orderRows[0].id);
    const itemLines = orderRows.map((o) => `${o.product_name} × ${o.quantity} — ${formatPrice(o.unit_price)}`).join("\n");
    const waText = encodeURIComponent(
      `Hi! I just placed order #${orderCode} on the website:\n\n${itemLines}\n\n` +
      `Name: ${name}\nWhatsApp number: ${phone}\nAddress: ${address || ""}\n\nPlease help me complete payment / confirm my order. Thank you!`
    );
    const waLink = window.WHATSAPP_NUMBER ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${waText}` : "#";
    checkoutBody.innerHTML = `
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <div class="checkout-success">
          <div class="tick" style="background:var(--gold-deep)">!</div>
          <h2>Order saved — payment not completed</h2>
          <div class="order-code">Order #${orderCode}</div>
          <p>${note} Your order (${orderRows.length} item${orderRows.length === 1 ? "" : "s"}) is saved. You can retry payment, or message us on WhatsApp to sort it out directly.</p>
          <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
            <button class="btn gold" id="retryCartPayBtn"><span class="shine"></span>Retry payment</button>
            <a class="btn ghost" href="${waLink}" target="_blank" rel="noopener"><span class="shine"></span>Message us on WhatsApp</a>
          </div>
        </div>
      </div>
    `;
    checkoutBody.querySelector(".close").addEventListener("click", closeCheckout);
    checkoutBody.querySelector("#retryCartPayBtn").addEventListener("click", () => {
      const msg = document.createElement("div");
      const total = orderRows.reduce((s, o) => s + Number(o.unit_price) * Number(o.quantity) + Number(o.shipping_fee || 0), 0);
      startCartRazorpayPayment(orderRows, name, phone, total, msg);
    });
  }

  function showCartPaymentSubmitted(orderRows, razorpayPaymentId) {
    const orderCode = shortOrderId(orderRows[0].id);
    const waText = encodeURIComponent(
      `Hi! I just paid for order #${orderCode} (${orderRows.length} item${orderRows.length === 1 ? "" : "s"}).\n` +
      `Razorpay payment ID: ${razorpayPaymentId}\nLooking forward to it!`
    );
    const waLink = window.WHATSAPP_NUMBER ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${waText}` : "#";
    checkoutBody.innerHTML = `
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <div class="checkout-success">
          <div class="tick">✓</div>
          <h2>Payment submitted!</h2>
          <div class="order-code">Order #${orderCode}</div>
          <p>Thanks — your payment for ${orderRows.length} item${orderRows.length === 1 ? "" : "s"} went through on Razorpay. We'll confirm it on our end and get your order packed shortly. Tap below to send us your payment ID directly so we can confirm it faster.</p>
          <a class="btn gold" href="${waLink}" target="_blank" rel="noopener"><span class="shine"></span>Send payment ID on WhatsApp</a>
        </div>
      </div>
    `;
    checkoutBody.querySelector(".close").addEventListener("click", closeCheckout);
  }

  function startCartRazorpayPayment(orderRows, name, phone, totalAmount, msgEl) {
    if (msgEl) {
      msgEl.textContent = "Opening secure payment…";
      msgEl.className = "msg";
    }
    const address = orderRows[0] ? orderRows[0].customer_address : "";

    if (!window.Razorpay || !window.RAZORPAY_KEY_ID || window.RAZORPAY_KEY_ID.includes("XXXX")) {
      console.error("[Razorpay] Not ready:", {
        razorpayScriptLoaded: !!window.Razorpay,
        keyConfigured: window.RAZORPAY_KEY_ID
      });
      showCartWhatsAppFallback(orderRows, name, phone, address,
        "Online payment isn't set up on this site yet, so we couldn't open the payment window.");
      return;
    }

    const rzp = new window.Razorpay({
      key: window.RAZORPAY_KEY_ID,
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      name: "Style OF Life",
      description: `${orderRows.length} item${orderRows.length === 1 ? "" : "s"}`,
      prefill: { name, contact: phone },
      notes: { order_group_id: orderRows[0] ? orderRows[0].order_group_id : "", items: orderRows.length },
      theme: { color: "#7E2130" },
      handler: function (response) {
        showCartPaymentSubmitted(orderRows, response.razorpay_payment_id);
      },
      modal: {
        ondismiss: function () {
          showCartWhatsAppFallback(orderRows, name, phone, address,
            "Looks like the payment window was closed before completing.");
        }
      }
    });

    rzp.on("payment.failed", function (resp) {
      console.error("[Razorpay] payment.failed:", resp && resp.error);
      showCartWhatsAppFallback(orderRows, name, phone, address,
        "The payment attempt didn't go through.");
    });

    rzp.open();
  }

  function showWhatsAppFallback(orderRow, p, name, phone, address, qty, note) {
    const orderCode = shortOrderId(orderRow.id);
    const waText = encodeURIComponent(
      `Hi! I just placed order #${orderCode} on the website:\n\n` +
      `Product: ${p.name}\nQty: ${qty}\nPrice: ${formatPrice(p.price)} each\n\n` +
      `Name: ${name}\nWhatsApp number: ${phone}\nAddress: ${address || ""}\n\nPlease help me complete payment / confirm my order. Thank you!`
    );
    const waLink = window.WHATSAPP_NUMBER ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${waText}` : "#";
    checkoutBody.innerHTML = `
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <div class="checkout-success">
          <div class="tick" style="background:var(--gold-deep)">!</div>
          <h2>Order saved — payment not completed</h2>
          <div class="order-code">Order #${orderCode}</div>
          <p>${note} Your order for <strong>${escapeHtml(p.name)}</strong> is saved. You can retry payment, or message us on WhatsApp to sort it out directly.</p>
          <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
            <button class="btn gold" id="retryPayBtn"><span class="shine"></span>Retry payment</button>
            <a class="btn ghost" href="${waLink}" target="_blank" rel="noopener"><span class="shine"></span>Message us on WhatsApp</a>
          </div>
        </div>
      </div>
    `;
    checkoutBody.querySelector(".close").addEventListener("click", closeCheckout);
    checkoutBody.querySelector("#retryPayBtn").addEventListener("click", () => {
      const msg = document.createElement("div");
      const total = p.price * qty + Number(orderRow.shipping_fee || 0);
      startRazorpayPayment(orderRow, p, name, phone, qty, total, msg);
    });
  }

  function showPaymentSubmitted(orderRow, p, qty, razorpayPaymentId) {
    const orderCode = shortOrderId(orderRow.id);
    const waText = encodeURIComponent(
      `Hi! I just paid for order #${orderCode} — ${p.name} x${qty}.\n` +
      `Razorpay payment ID: ${razorpayPaymentId}\n` +
      `Looking forward to it!`
    );
    const waLink = window.WHATSAPP_NUMBER ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${waText}` : "#";
    checkoutBody.innerHTML = `
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <div class="checkout-success">
          <div class="tick">✓</div>
          <h2>Payment submitted!</h2>
          <div class="order-code">Order #${orderCode}</div>
          <p>Thanks — your payment for <strong>${escapeHtml(p.name)}</strong> went through on Razorpay. We'll confirm it on our end and get your order packed shortly. Tap below to send us your payment ID directly so we can confirm it faster.</p>
          <a class="btn gold" href="${waLink}" target="_blank" rel="noopener"><span class="shine"></span>Send payment ID on WhatsApp</a>
        </div>
      </div>
    `;
    checkoutBody.querySelector(".close").addEventListener("click", closeCheckout);
  }

  function startRazorpayPayment(orderRow, p, name, phone, qty, totalAmount, msgEl) {
    if (msgEl) {
      msgEl.textContent = "Opening secure payment…";
      msgEl.className = "msg";
    }

    if (!window.Razorpay || !window.RAZORPAY_KEY_ID || window.RAZORPAY_KEY_ID.includes("XXXX")) {
      console.error("[Razorpay] Not ready:", {
        razorpayScriptLoaded: !!window.Razorpay,
        keyConfigured: window.RAZORPAY_KEY_ID
      });
      showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
        "Online payment isn't set up on this site yet, so we couldn't open the payment window.");
      return;
    }

    // No backend involved: Razorpay Checkout opens directly with the amount,
    // using only the public Key ID (safe to expose, like a Stripe publishable key).
    // Because there's no server here to verify the payment signature, a paid
    // order is NOT marked "Paid" automatically — the admin panel's Payment
    // Status dropdown confirms it manually against the Razorpay Dashboard.
    const rzp = new window.Razorpay({
      key: window.RAZORPAY_KEY_ID,
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      name: "Style OF Life",
      description: `${p.name} × ${qty}`,
      prefill: { name, contact: phone },
      notes: { order_id: orderRow.id, product: p.name, quantity: qty },
      theme: { color: "#7E2130" },
      handler: function (response) {
        showPaymentSubmitted(orderRow, p, qty, response.razorpay_payment_id);
      },
      modal: {
        ondismiss: function () {
          showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
            "Looks like the payment window was closed before completing.");
        }
      }
    });

    rzp.on("payment.failed", function (resp) {
      console.error("[Razorpay] payment.failed:", resp && resp.error);
      showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
        "The payment attempt didn't go through.");
    });

    rzp.open();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCheckout();
  });

  let searchTrackTimer = null;
  searchBox.addEventListener("input", (e) => {
    activeSearch = e.target.value;
    renderGrid();
    clearTimeout(searchTrackTimer);
    const term = e.target.value.trim();
    if (term) {
      searchTrackTimer = setTimeout(() => trackEvent("search", term), 900);
    }
  });

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let showroomPickIds = null; // fixed for this page load so it doesn't jump around while browsing

  function renderShowroom() {
    const stage = document.getElementById("showroomStage");
    const content = document.getElementById("showroomContent");
    if (!stage || !content) return;

    if (!allProducts.length) {
      content.innerHTML = `<div class="showroom-empty">Add your first pieces in the admin panel — they'll take their place here automatically.</div>`;
      return;
    }

    let picks;
    if (showroomPickIds) {
      // Keep the same random picks stable across live product updates during this visit,
      // falling back gracefully if one of them got removed/sold out.
      picks = showroomPickIds
        .map((id) => allProducts.find((p) => String(p.id) === id))
        .filter(Boolean);
      const missing = 7 - picks.length;
      if (missing > 0) {
        const extra = shuffleArray(allProducts.filter((p) => !picks.includes(p))).slice(0, missing);
        picks = picks.concat(extra);
      }
    } else {
      picks = shuffleArray(allProducts).slice(0, 7);
      showroomPickIds = picks.map((p) => String(p.id));
    }

    const center = picks[0];
    const orbit = picks.slice(1, 7);

    const centerHtml = `
      <div class="showroom-center" data-id="${center.id}">
        ${center.image_url ? `<img src="${escapeHtml(center.image_url)}" alt="${escapeHtml(center.name)}">` : ""}
        <div class="tag">${escapeHtml(center.name)}</div>
      </div>
    `;
    const orbitHtml = orbit.map((p, i) => `
      <div class="showroom-item" data-id="${p.id}" data-pos="${i + 1}">
        ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}">` : ""}
      </div>
    `).join("");

    content.innerHTML = centerHtml + orbitHtml;

    content.querySelectorAll("[data-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const prod = allProducts.find((x) => String(x.id) === el.dataset.id);
        if (prod) openModal(prod);
      });
    });

    // Re-trigger the settle-into-place animation for the freshly rendered items
    stage.classList.remove("in-view");
    if (showroomObserved) {
      requestAnimationFrame(() => stage.classList.add("in-view"));
    }
  }

  let showroomObserved = false;
  function wireShowroomReveal() {
    const stage = document.getElementById("showroomStage");
    if (!stage) return;
    if (!("IntersectionObserver" in window)) {
      showroomObserved = true;
      stage.classList.add("in-view");
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showroomObserved = true;
          stage.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    io.observe(stage);
  }

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
    renderShowroom();
    renderProductStructuredData();
  }

  // Structured data helps search engines show rich results (price,
  // availability, images) for the live catalog. Rebuilt every time
  // products load or change, using real data — never placeholder text.
  function renderProductStructuredData() {
    let script = document.getElementById("productStructuredData");
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "productStructuredData";
      document.head.appendChild(script);
    }
    const items = allProducts.slice(0, 40).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": p.name,
        "description": p.description || undefined,
        "image": p.image_url || undefined,
        "category": p.category || undefined,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": p.price,
          "availability": "https://schema.org/InStock"
        }
      }
    }));
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": items
    });
  }

  // Live updates: new / edited / removed products from the admin
  // panel appear here immediately, no page refresh needed.
  window.supabaseClient
    .channel("public:products")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
      loadProducts();
    })
    .subscribe();

  function wireFaq() {
    document.querySelectorAll(".faq-item").forEach((item) => {
      const q = item.querySelector(".faq-q");
      const a = item.querySelector(".faq-a");
      if (!q || !a) return;
      q.addEventListener("click", () => {
        const willOpen = !item.classList.contains("open");
        document.querySelectorAll(".faq-item.open").forEach((other) => {
          if (other !== item) {
            other.classList.remove("open");
            other.querySelector(".faq-a").style.maxHeight = null;
          }
        });
        item.classList.toggle("open", willOpen);
        a.style.maxHeight = willOpen ? a.scrollHeight + "px" : null;
      });
    });
  }

  function wireScrollFx() {
    const bar = document.getElementById("scrollProgress");
    const header = document.querySelector(".site-header");
    function onScroll() {
      const h = document.documentElement;
      const scrolled = h.scrollTop || document.body.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + "%";
      if (header) header.classList.toggle("scrolled", scrolled > 8);
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function wireReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    els.forEach((el) => io.observe(el));
  }

  function wireCountUp() {
    const badges = document.querySelectorAll(".stat-badge b[data-count]");
    if (!badges.length) return;
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimal || "0", 10);
      const suffix = el.dataset.suffix || "";
      const duration = 1200;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = val.toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) {
      badges.forEach(animate);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    badges.forEach((b) => io.observe(b));
  }

  function hidePageLoader() {
    const loader = document.getElementById("pageLoader");
    if (!loader) return;
    setTimeout(() => loader.classList.add("hide"), 350);
  }

  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  function wireMagneticButtons() {
    if (isTouchDevice) return;
    let raf = null;
    let pending = null;

    document.addEventListener("mousemove", (e) => {
      const btn = e.target.closest(".btn");
      pending = { btn, x: e.clientX, y: e.clientY };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (!pending || !pending.btn) return;
        const rect = pending.btn.getBoundingClientRect();
        const relX = pending.x - rect.left - rect.width / 2;
        const relY = pending.y - rect.top - rect.height / 2;
        pending.btn.style.transform = `translate(${relX * 0.16}px, ${relY * 0.32}px)`;
      });
    });

    document.addEventListener("mouseout", (e) => {
      const btn = e.target.closest(".btn");
      if (btn && (!e.relatedTarget || !btn.contains(e.relatedTarget))) {
        btn.style.transform = "";
      }
    });
  }

  function wireTilt(container, maxTilt) {
    if (isTouchDevice || !container) return;
    container.addEventListener("mousemove", (e) => {
      const card = e.target.closest(".tag-card, .why-card");
      if (!card || !container.contains(card)) return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotY = (px - 0.5) * maxTilt * 2;
      const rotX = (0.5 - py) * maxTilt * 2;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px) scale(1.02)`;
    });
    container.addEventListener("mouseleave", (e) => {
      const card = e.target.closest && e.target.closest(".tag-card, .why-card");
      if (card) card.style.transform = "";
    }, true);
    container.addEventListener("mouseout", (e) => {
      const card = e.target.closest(".tag-card, .why-card");
      if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
        card.style.transform = "";
      }
    });
  }

  function wireParallax() {
    if (isTouchDevice) return;
    const glow = document.querySelector(".showroom-glow");
    const mini = document.querySelector(".mini-hero");
    document.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (glow) glow.style.transform = `translateY(${y * 0.08}px) rotate(${y * 0.02}deg)`;
      if (mini) mini.style.backgroundPositionY = `${y * 0.15}px`;
    }, { passive: true });
  }

  function splitWords(el) {
    if (!el || el.dataset.split) return;
    el.dataset.split = "1";
    const html = el.innerHTML;
    const wrapper = document.createElement("span");
    wrapper.innerHTML = html;
    // Walk child nodes, wrapping plain-text words while preserving inner tags like <em>
    function wrapTextNode(node) {
      const words = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach((w) => {
        if (/^\s+$/.test(w) || w === "") {
          frag.appendChild(document.createTextNode(w));
        } else {
          const outer = document.createElement("span");
          outer.className = "word";
          const inner = document.createElement("span");
          inner.className = "word-inner";
          inner.textContent = w;
          outer.appendChild(inner);
          frag.appendChild(outer);
        }
      });
      node.replaceWith(frag);
    }
    Array.from(wrapper.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        wrapTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach((inner) => {
          if (inner.nodeType === Node.TEXT_NODE) wrapTextNode(inner);
        });
      }
    });
    el.innerHTML = "";
    el.classList.add("split-words");
    el.appendChild(wrapper);
    el.querySelectorAll(".word-inner").forEach((span, i) => {
      span.style.transitionDelay = `${i * 45}ms`;
    });
  }

  function wireHeroTextReveal() {
    const h1 = document.getElementById("miniHeroHeading");
    if (!h1) return;
    splitWords(h1);
    requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add("run-in")));
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  wireCartUI();
  wireWhatsAppLinks();
  wireFaq();
  wireScrollFx();
  wireReveals();
  wireCountUp();
  wireShowroomReveal();
  wireMagneticButtons();
  wireParallax();
  wireHeroTextReveal();
  wireTilt(document.getElementById("tray"), 7);
  wireTilt(document.querySelector(".why-grid"), 5);
  loadProducts();
  window.addEventListener("load", hidePageLoader);
  setTimeout(hidePageLoader, 2500); // fallback in case 'load' is slow (e.g. fonts)
})();
