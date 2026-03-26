// js/config.js
const CONFIG = {
    SITE_NAME: "Style Of Life Jewelry",
    CURRENCY: "₹",
    DEFAULT_CATEGORY: "Jewelry",

    // IMPORTANT: Replace with your Google Apps Script Web App URL
    API_URL: "https://script.google.com/macros/s/AKfycbwCSWHfY18rKz_lNrZ7030S8OHJ-cjhEcTgW8MDYefpvqYJUzzl5rusDALMSOgkBmME/exec",
    
    // CORRECTED - Using the same Supabase URL across all files
    SUPABASE_URL: "https://qlrhgzsgoowzjcgmramp.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscmhnenNnb293empjZ21yYW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTY2NzAsImV4cCI6MjA4OTkzMjY3MH0.j5HXJCaESTQcdAIiI0oM5U9qnQcWEHZ1EusrkyaexUs",
    
    // Admin credentials - CHANGE THESE IN PRODUCTION
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "StyleOfLife@2026"
};

// Make CONFIG globally available
window.CONFIG = CONFIG;
