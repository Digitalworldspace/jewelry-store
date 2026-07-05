const express = require("express");
const app = express();

app.use(express.static("public"));
app.use(express.json());

// PRODUCTS DATABASE (simple memory)
let products = [
    { id: 1, name: "Royal Necklace", price: 499 },
    { id: 2, name: "Diamond Ring", price: 299 },
    { id: 3, name: "Gold Earrings", price: 199 },
    { id: 4, name: "Luxury Bracelet", price: 399 }
];

// GET PRODUCTS
app.get("/products", (req, res) => {
    res.json(products);
});

// CHECKOUT API
app.post("/checkout", (req, res) => {
    const cart = req.body.cart || [];

    let total = cart.reduce((sum, item) => sum + item.price, 0);

    res.json({
        success: true,
        message: "Order placed successfully 💎",
        total: total
    });
});

// ADMIN ADD PRODUCT
app.post("/admin/add-product", (req, res) => {
    const { name, price } = req.body;

    if (!name || !price) {
        return res.json({ success: false, message: "Invalid data" });
    }

    const newProduct = {
        id: products.length + 1,
        name,
        price: Number(price)
    };

    products.push(newProduct);

    res.json({
        success: true,
        message: "Product added successfully",
        product: newProduct
    });
});

// SERVER START
app.listen(3000, () => {
    console.log("Style OF Life running on http://localhost:3000");
});
