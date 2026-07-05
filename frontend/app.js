const API = "http://localhost:3000";

let cart = [];

/* LOAD PRODUCTS */
async function loadProducts(){

    const res = await fetch(API + "/products");
    const data = await res.json();

    let html = "";

    data.forEach(p=>{
        html += `
        <div class="card">
            <h3>${p.name}</h3>
            <p>₹${p.price}</p>
            <button class="btn" onclick='add(${JSON.stringify(p)})'>
                Add
            </button>
        </div>`;
    });

    document.getElementById("products").innerHTML = html;
}

/* ADD TO CART */
function add(p){
    cart.push(p);
    renderCart();
}

/* CART */
function renderCart(){

    let total = 0;
    let html = "";

    cart.forEach(c=>{
        total += c.price;
        html += `<div class="card">${c.name} - ₹${c.price}</div>`;
    });

    html += `<h3>Total: ₹${total}</h3>`;
    html += `<button class="btn" onclick="order(${total})">Buy Now</button>`;

    document.getElementById("cart").innerHTML = html;
}

/* ORDER */
async function order(total){

    const res = await fetch(API + "/order",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({items:cart,total})
    });

    const data = await res.json();

    alert("Order Placed 💎 ID: " + data.orderId);

    cart = [];
    renderCart();
}

loadProducts();
