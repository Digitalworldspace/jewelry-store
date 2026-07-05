const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

/* ======================
   DB HELPERS
====================== */
function getDB(){
    return JSON.parse(fs.readFileSync("./db.json","utf-8"));
}

function saveDB(data){
    fs.writeFileSync("./db.json", JSON.stringify(data,null,2));
}

/* ======================
   CORS (frontend access)
====================== */
app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
});

/* ======================
   PRODUCTS API
====================== */
app.get("/products",(req,res)=>{
    const db = getDB();
    res.json(db.products);
});

/* ======================
   ADMIN LOGIN
====================== */
const ADMIN = {
    user:"admin",
    pass:"1234"
};

/* ======================
   ADMIN LOGIN API
====================== */
app.post("/admin/login",(req,res)=>{

    const {user,pass} = req.body;

    if(user === ADMIN.user && pass === ADMIN.pass){
        res.json({success:true});
    } else {
        res.json({success:false});
    }
});

/* ======================
   ADD PRODUCT (ADMIN)
====================== */
app.post("/admin/add-product",(req,res)=>{

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
   DELETE PRODUCT
====================== */
app.post("/admin/delete-product",(req,res)=>{

    const db = getDB();

    db.products = db.products.filter(p => p.id !== req.body.id);

    saveDB(db);

    res.json({message:"Deleted"});
});

/* ======================
   ORDER SYSTEM
====================== */
app.post("/order",(req,res)=>{

    const db = getDB();

    const order = {
        id: Date.now(),
        items: req.body.items,
        total: req.body.total,
        date: new Date()
    };

    db.orders.push(order);
    saveDB(db);

    res.json({
        message:"Order placed successfully 💎",
        orderId: order.id
    });
});

/* ======================
   GET ORDERS (ADMIN)
====================== */
app.get("/orders",(req,res)=>{
    const db = getDB();
    res.json(db.orders);
});

/* ======================
   START SERVER
====================== */
app.listen(3000,()=>{
    console.log("🚀 Style OF Life E-commerce running on 3000");
});
