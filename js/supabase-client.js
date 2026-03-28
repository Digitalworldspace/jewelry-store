<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Management - Style Of Life</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="js/config.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root { 
            --primary: #d4af37; 
            --primary-dark: #b8962e;
            --dark: #1a1a1a; 
            --darker: #0a0a0a; 
            --light: #ffffff; 
            --gray-100: #f8f9fa; 
            --gray-200: #e9ecef; 
            --gray-600: #6c757d;
            --danger: #dc3545; 
            --success: #28a745;
            --info: #17a2b8;
        }
        body { font-family: 'Inter', sans-serif; background: var(--gray-100); }
        
        .admin-header {
            background: var(--darker);
            padding: 15px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .logo { font-size: 24px; font-weight: 600; color: var(--primary); }
        .logo span { background: var(--primary); color: var(--darker); padding: 4px 8px; border-radius: 4px; }
        .admin-nav a {
            color: #aaa;
            text-decoration: none;
            margin-left: 20px;
            padding: 8px 15px;
            border-radius: 6px;
        }
        .admin-nav a:hover, .admin-nav a.active { background: rgba(212,175,55,0.1); color: var(--primary); }
        .logout-btn {
            background: transparent;
            border: 1px solid var(--danger);
            color: var(--danger);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
        }
        
        .container { max-width: 1400px; margin: 40px auto; padding: 0 20px; }
        h1 { color: var(--primary); margin-bottom: 30px; }
        
        .toolbar { display: flex; justify-content: flex-end; margin-bottom: 30px; gap: 15px; }
        .btn { background: var(--primary); color: var(--dark); padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .btn-secondary { background: var(--gray-600); color: white; }
        
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
        }
        
        .product-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid var(--gray-200);
            transition: all 0.3s;
        }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        
        .product-image {
            width: 100%;
            height: 220px;
            object-fit: cover;
        }
        
        .product-info { padding: 20px; }
        .product-name { font-size: 18px; font-weight: 600; margin-bottom: 5px; }
        .product-sku { font-size: 12px; color: var(--gray-600); margin-bottom: 8px; }
        .product-price { font-size: 22px; font-weight: 700; color: var(--primary); margin: 10px 0; }
        .product-stock { font-size: 13px; margin-bottom: 15px; }
        .in-stock { color: var(--success); }
        .low-stock { color: #ff9800; }
        .out-of-stock { color: var(--danger); }
        
        .card-actions { display: flex; gap: 10px; margin-top: 15px; }
        .edit-btn, .delete-btn { flex: 1; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
        .edit-btn { background: var(--info); color: white; }
        .delete-btn { background: var(--danger); color: white; }
        
        .empty-state { text-align: center; padding: 60px; color: var(--gray-600); }
        .loading { text-align: center; padding: 60px; }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--gray-200);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 15px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        footer { background: var(--darker); color: white; text-align: center; padding: 30px; margin-top: 60px; }
        
        @media (max-width: 768px) {
            .admin-header { flex-direction: column; gap: 15px; padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="admin-header">
        <div class="logo">STYLE OF LIFE <span>ADMIN</span></div>
        <div class="admin-nav">
            <a href="admin.html">Dashboard</a>
            <a href="admin-products.html" class="active">Products</a>
            <a href="admin-orders.html">Orders</a>
        </div>
        <button class="logout-btn" onclick="logout()">Logout</button>
    </div>

    <div class="container">
        <h1>Product Management</h1>
        <div class="toolbar">
            <button class="btn" onclick="window.location.href='admin-add-product.html'">+ Add New Product</button>
            <button class="btn btn-secondary" onclick="loadProducts()">🔄 Refresh</button>
        </div>
        
        <div id="productsGrid" class="product-grid">
            <div class="loading"><div class="spinner"></div><p>Loading products...</p></div>
        </div>
    </div>

    <footer><p>© 2026 STYLE OF LIFE</p></footer>

    <script type="importmap">
        { "imports": { "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2" } }
    </script>
    <script type="module">
        import { createClient } from '@supabase/supabase-js';
        
        // Check admin authentication
        if (!sessionStorage.getItem('adminLoggedIn')) {
            window.location.href = 'login.html';
        }
        
        const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        
        async function loadProducts() {
            const grid = document.getElementById('productsGrid');
            grid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading products...</p></div>';
            
            try {
                console.log('Fetching products from Supabase...');
                console.log('Supabase URL:', CONFIG.SUPABASE_URL);
                
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('id');
                
                if (error) {
                    console.error('Supabase error:', error);
                    grid.innerHTML = `<div class="empty-state">❌ Error: ${error.message}<br><br>Please check your Supabase connection.</div>`;
                    return;
                }
                
                console.log('Products loaded:', data?.length || 0);
                
                if (!data || data.length === 0) {
                    grid.innerHTML = '<div class="empty-state">✨ No products yet. Click "Add New Product" to get started.</div>';
                    return;
                }
                
                let html = '';
                for (const p of data) {
                    const mainImage = p.images && p.images[0] ? p.images[0] : 'https://via.placeholder.com/300x220?text=No+Image';
                    const stockClass = p.stock <= 0 ? 'out-of-stock' : (p.stock < 10 ? 'low-stock' : 'in-stock');
                    const stockText = p.stock <= 0 ? 'Out of Stock' : (p.stock < 10 ? `⚠️ Only ${p.stock} left` : `✅ In Stock (${p.stock})`);
                    
                    html += `
                        <div class="product-card">
                            <img class="product-image" src="${mainImage}" alt="${escapeHtml(p.name)}" onerror="this.src='https://via.placeholder.com/300x220?text=No+Image'">
                            <div class="product-info">
                                <div class="product-name">${escapeHtml(p.name)}</div>
                                <div class="product-sku">${p.sku} | ${p.category || 'Jewelry'}</div>
                                <div class="product-price">₹${(p.price || 0).toLocaleString()}</div>
                                <div class="product-stock ${stockClass}">${stockText}</div>
                                <div class="card-actions">
                                    <button class="edit-btn" onclick="editProduct(${p.id})">✏️ Edit</button>
                                    <button class="delete-btn" onclick="deleteProduct(${p.id})">🗑️ Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
                }
                grid.innerHTML = html;
                
            } catch (error) {
                console.error('Error loading products:', error);
                grid.innerHTML = `<div class="empty-state">❌ Error loading products: ${error.message}<br><br>Check console for details.</div>`;
            }
        }
        
        window.editProduct = async function(id) {
            const { data } = await supabase.from('products').select('*').eq('id', id);
            const product = data?.[0];
            if (!product) return;
            
            const newName = prompt('Edit product name:', product.name);
            if (newName && newName !== product.name) {
                const { error } = await supabase.from('products').update({ name: newName }).eq('id', id);
                if (error) {
                    alert('Error: ' + error.message);
                } else {
                    alert('✅ Product updated');
                    loadProducts();
                }
            }
        };
        
        window.deleteProduct = async function(id) {
            if (!confirm('Delete this product? This action cannot be undone.')) return;
            
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) {
                alert('Error: ' + error.message);
            } else {
                alert('✅ Product deleted');
                loadProducts();
            }
        };
        
        window.logout = function() {
            sessionStorage.removeItem('adminLoggedIn');
            window.location.href = 'login.html';
        };
        
        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }
        
        // Test Supabase connection first
        async function testConnection() {
            try {
                console.log('Testing Supabase connection...');
                const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
                if (error) {
                    console.error('Connection test failed:', error);
                } else {
                    console.log('✅ Supabase connection successful!');
                }
            } catch (e) {
                console.error('Connection test error:', e);
            }
        }
        
        testConnection();
        loadProducts();
    </script>
</body>
</html>
