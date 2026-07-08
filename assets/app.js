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
  function wireWhatsAppLinks() {
    const base = window.WHATSAPP_NUMBER
      ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to know more about your jewellery collection.")}`
      : "#";
    ["headerWa", "ctaWa", "footerWa", "floatWa"].forEach((id) => {
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
  }

  function openModal(p) {
    const off = discountPct(p.price, p.original_price);
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
        <div class="price-row">
          <span class="price">${formatPrice(p.price)}</span>
          ${off > 0 ? `<span class="mrp">${formatPrice(p.original_price)}</span><span class="off">${off}% off</span>` : ""}
        </div>
        <p class="desc">${escapeHtml(p.description || "No description added yet.")}</p>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button class="btn gold" id="modalBuyNow"><span class="shine"></span>Buy Now</button>
          <a class="btn ghost" href="${waLink}" target="_blank" rel="noopener"><span class="shine"></span>Enquire on WhatsApp</a>
        </div>
      </div>
    `;
    modalBody.querySelector(".close").addEventListener("click", closeModal);
    modalBody.querySelector("#modalBuyNow").addEventListener("click", () => {
      closeModal();
      openCheckout(p);
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
          <div class="field">
            <label>Full name</label>
            <input type="text" id="coName" required>
          </div>
          <div class="row2">
            <div class="field">
              <label>Phone number</label>
              <input type="tel" id="coPhone" required>
            </div>
            <div class="field">
              <label>Quantity</label>
              <input type="number" id="coQty" min="1" value="1" required>
            </div>
          </div>
          <div class="field">
            <label>Delivery address</label>
            <textarea id="coAddress" required placeholder="House no, street, city, state, PIN code"></textarea>
          </div>
          <button class="btn gold" type="submit" style="width:100%; justify-content:center;"><span class="shine"></span>Pay Now — <span id="coTotalLabel">${formatPrice(p.price)}</span></button>
          <div class="msg" id="checkoutMsg"></div>
        </form>
      </div>
    `;
    checkoutBody.querySelector(".close").addEventListener("click", closeCheckout);

    const qtyInput = checkoutBody.querySelector("#coQty");
    const totalLabel = checkoutBody.querySelector("#coTotalLabel");
    qtyInput.addEventListener("input", () => {
      const q = parseInt(qtyInput.value, 10) || 1;
      totalLabel.textContent = formatPrice(p.price * q);
    });

    checkoutBody.querySelector("#checkoutForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = checkoutBody.querySelector("#checkoutMsg");
      const name = checkoutBody.querySelector("#coName").value.trim();
      const phone = checkoutBody.querySelector("#coPhone").value.trim();
      const qty = parseInt(checkoutBody.querySelector("#coQty").value, 10) || 1;
      const address = checkoutBody.querySelector("#coAddress").value.trim();

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
          payment_status: "Unpaid"
        }])
        .select()
        .single();

      if (error) {
        msg.textContent = "Couldn't place the order: " + error.message;
        msg.className = "msg error";
        return;
      }

      const totalAmount = p.price * qty;
      startRazorpayPayment(orderRow, p, name, phone, qty, totalAmount, msg);
    });

    checkoutBackdrop.classList.add("open");
  }

  function showWhatsAppFallback(orderRow, p, name, phone, address, qty, note) {
    const waText = encodeURIComponent(
      `Hi! I just placed an order on the website:\n\n` +
      `Product: ${p.name}\nQty: ${qty}\nPrice: ${formatPrice(p.price)} each\n\n` +
      `Name: ${name}\nPhone: ${phone}\nAddress: ${address || ""}\n\nPlease help me complete payment / confirm my order. Thank you!`
    );
    const waLink = window.WHATSAPP_NUMBER ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${waText}` : "#";
    checkoutBody.innerHTML = `
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <div class="checkout-success">
          <div class="tick" style="background:var(--gold-deep)">!</div>
          <h2>Order saved — payment not completed</h2>
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
      startRazorpayPayment(orderRow, p, name, phone, qty, p.price * qty, msg);
    });
  }

  function showPaidSuccess(p, qty) {
    const waText = encodeURIComponent(`Hi! I just paid for my order — ${p.name} x${qty}. Looking forward to it!`);
    const waLink = window.WHATSAPP_NUMBER ? `https://wa.me/${window.WHATSAPP_NUMBER}?text=${waText}` : "#";
    checkoutBody.innerHTML = `
      <div class="modal-body">
        <button class="close" aria-label="Close">&times;</button>
        <div class="checkout-success">
          <div class="tick">✓</div>
          <h2>Payment successful!</h2>
          <p>Your order for <strong>${escapeHtml(p.name)}</strong> is confirmed and paid. We'll get it packed and shipped — feel free to say hi on WhatsApp for delivery updates.</p>
          <a class="btn gold" href="${waLink}" target="_blank" rel="noopener"><span class="shine"></span>Message us on WhatsApp</a>
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
      showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
        "Online payment isn't set up on this site yet, so we couldn't open the payment window.");
      return;
    }

    window.supabaseClient.functions
      .invoke("create-razorpay-order", {
        body: { order_id: orderRow.id, amount: totalAmount, name, phone }
      })
      .then(({ data, error }) => {
        if (error || !data || data.error) {
          showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
            "We couldn't start the payment right now.");
          return;
        }

        const rzp = new window.Razorpay({
          key: window.RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          order_id: data.id,
          name: "Style OF Life",
          description: `${p.name} × ${qty}`,
          prefill: { name, contact: phone },
          theme: { color: "#7E2130" },
          handler: function (response) {
            window.supabaseClient.functions
              .invoke("verify-razorpay-payment", {
                body: {
                  order_id: orderRow.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }
              })
              .then(({ data: verifyData }) => {
                if (verifyData && verifyData.verified) {
                  showPaidSuccess(p, qty);
                } else {
                  showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
                    "We received a payment response but couldn't verify it.");
                }
              })
              .catch(() => {
                showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
                  "We received a payment response but couldn't verify it.");
              });
          },
          modal: {
            ondismiss: function () {
              showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
                "Looks like the payment window was closed before completing.");
            }
          }
        });

        rzp.on("payment.failed", function () {
          showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
            "The payment attempt didn't go through.");
        });

        rzp.open();
      })
      .catch(() => {
        showWhatsAppFallback(orderRow, p, name, phone, orderRow.customer_address, qty,
          "We couldn't start the payment right now.");
      });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCheckout();
  });

  searchBox.addEventListener("input", (e) => {
    activeSearch = e.target.value;
    renderGrid();
  });

  function renderShowroom() {
    const stage = document.getElementById("showroomStage");
    const content = document.getElementById("showroomContent");
    if (!stage || !content) return;

    if (!allProducts.length) {
      content.innerHTML = `<div class="showroom-empty">Add your first pieces in the admin panel — they'll take their place here automatically.</div>`;
      return;
    }

    const picks = allProducts.slice(0, 7);
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
