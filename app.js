let cart = [];

/* =====================
   LOAD PRODUCTS FROM DB
===================== */
async function loadProducts(){

    const res = await fetch("database.json");
    const data = await res.json();

    let html = "";

    data.products.forEach(p=>{
        html += `
        <div class="card">
            <h3>${p.name}</h3>
            <p>₹${p.price}</p>
            <button class="btn" onclick='addToCart(${JSON.stringify(p)})'>
                Add to Cart
            </button>
        </div>`;
    });

    document.getElementById("products").innerHTML = html;
}

/* =====================
   ADD TO CART
===================== */
function addToCart(product){
    cart.push(product);
    renderCart();
}

/* =====================
   CART RENDER
===================== */
function renderCart(){

    let html = "<h2 style='text-align:center;'>Cart 🛍️</h2>";
    let total = 0;

    cart.forEach((c,i)=>{
        total += c.price;

        html += `
        <div class="card">
            <p>${c.name}</p>
            <p>₹${c.price}</p>
            <button class="btn" onclick="removeItem(${i})">Remove</button>
        </div>`;
    });

    html += `<h3 style="text-align:center;">Total: ₹${total}</h3>`;
    html += `<div style="text-align:center;">
                <button class="btn" onclick="checkout()">Checkout</button>
             </div>`;

    document.getElementById("cart").innerHTML = html;
}

/* =====================
   REMOVE ITEM
===================== */
function removeItem(i){
    cart.splice(i,1);
    renderCart();
}

/* =====================
   CHECKOUT (FAKE BACKEND CALL)
===================== */
function checkout(){

    const order = {
        items: cart,
        total: cart.reduce((s,i)=>s+i.price,0),
        orderId: "SOL" + Math.floor(Math.random()*999999)
    };

    alert("Order Placed 💎\nID: " + order.orderId + "\nTotal: ₹" + order.total);

    console.log(order);

    cart = [];
    renderCart();
}
