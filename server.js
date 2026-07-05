const express = require("express");
const app = express();
const path = require("path");

app.use(express.static("public"));
app.use(express.json());

// Dummy product database
let products = [
    { id: 1, name: "Royal Necklace", price: 499 },
    { id: 2, name: "Diamond Ring", price: 299 },
    { id: 3, name: "Gold Plated Earrings", price: 199 },
    { id: 4, name: "Luxury Bracelet", price: 399 }
];

// API route
app.get("/products", (req, res) => {
    res.json(products);
});

// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
