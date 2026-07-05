const API = "http://localhost:3000";

let cart = [];

/* ======================
   LOAD LIVE PRODUCTS
====================== */
async function loadProducts(){

    const res = await fetch(API + "/products");
    const data = await res.json();

    let html = "";

    data.forEach(p=>{
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

/* ======================
   ADD TO CART
====================== */
function addToCart(p){
    cart.push(p);
    renderCart();
}

/* ======================
   CART UI
====================== */
function renderCart(){

    let total = 0;
    let html = "<h2 style='text-align:center;'>Cart 🛍️</h2>";

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
                <button class="btn" onclick="checkout(${total})">Checkout</button>
             </div>`;

    document.getElementById("cart").innerHTML = html;
}

/* ======================
   REMOVE ITEM
====================== */
function removeItem(i){
    cart.splice(i,1);
    renderCart();
}

/* ======================
   CHECKOUT (LIVE API)
====================== */
async function checkout(total){

    const res = await fetch(API + "/checkout",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({total, cart})
    });

    const data = await res.json();

    alert(data.message + "\nOrder ID: " + data.orderId);

    cart = [];
    renderCart();
}

/* INIT */
loadProducts();
