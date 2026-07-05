const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

// allow frontend access (CORS simple)
app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
});

// READ DB
function getDB(){
    return JSON.parse(fs.readFileSync("./database.json","utf-8"));
}

// WRITE DB
function saveDB(data){
    fs.writeFileSync("./database.json", JSON.stringify(data,null,2));
}

/* ======================
   GET PRODUCTS (LIVE)
====================== */
app.get("/products",(req,res)=>{
    const db = getDB();
    res.json(db.products);
});

/* ======================
   ADD PRODUCT (ADMIN)
====================== */
app.post("/add-product",(req,res)=>{
    const db = getDB();

    const newProduct = {
        id: Date.now(),
        name: req.body.name,
        price: req.body.price
    };

    db.products.push(newProduct);
    saveDB(db);

    res.json({message:"Product added", product:newProduct});
});

/* ======================
   CHECKOUT ORDER
====================== */
app.post("/checkout",(req,res)=>{
    const order = req.body;

    res.json({
        message:"Order placed successfully 💎",
        orderId:"SOL"+Date.now(),
        total: order.total
    });
});

/* ======================
   START SERVER
====================== */
app.listen(3000,()=>{
    console.log("Backend running on http://localhost:3000");
});
