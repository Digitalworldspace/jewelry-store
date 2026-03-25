// generate-sitemap.js
// Run this script to auto-generate sitemap.xml from your Supabase products
// Save this file and run: node generate-sitemap.js

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = "https://tbopyyocuvlsjvtdogcp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRib3B5eW9jdXZsc2p2dGRvZ2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzYxNzcsImV4cCI6MjA4OTYxMjE3N30.TfEtU1NBHCGnZqZzm4LuI1iw22lSPav0OrUskhDw5wc";

const options = {
    hostname: 'tbopyyocuvlsjvtdogcp.supabase.co',
    path: '/rest/v1/products?select=id,name,updated_at',
    method: 'GET',
    headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const products = JSON.parse(data);
        
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        
        // Static pages
        sitemap += `    <url>\n`;
        sitemap += `        <loc>https://styleoflife987-hub.github.io/jewelry-store/</loc>\n`;
        sitemap += `        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
        sitemap += `    </url>\n`;
        
        sitemap += `    <url>\n`;
        sitemap += `        <loc>https://styleoflife987-hub.github.io/jewelry-store/index.html</loc>\n`;
        sitemap += `        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
        sitemap += `    </url>\n`;
        
        sitemap += `    <url>\n`;
        sitemap += `        <loc>https://styleoflife987-hub.github.io/jewelry-store/track.html</loc>\n`;
        sitemap += `        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
        sitemap += `    </url>\n`;
        
        // Dynamic product pages
        products.forEach(product => {
            const slug = product.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
            sitemap += `    <url>\n`;
            sitemap += `        <loc>https://styleoflife987-hub.github.io/jewelry-store/#${slug}</loc>\n`;
            sitemap += `        <lastmod>${product.updated_at ? product.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>\n`;
            sitemap += `    </url>\n`;
        });
        
        sitemap += `</urlset>`;
        
        fs.writeFileSync('sitemap.xml', sitemap);
        console.log(`✅ Sitemap generated with ${products.length + 3} URLs`);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.end();
