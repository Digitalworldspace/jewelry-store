// js/auth.js
import { signUp, signIn, signOut, getCurrentUser } from './supabase-client.js';

// Check if user is logged in
export async function checkAuth() {
    const user = await getCurrentUser();
    if (user) {
        updateUIForLoggedInUser(user);
    } else {
        updateUIForLoggedOutUser();
    }
    return user;
}

// Update UI based on login status
function updateUIForLoggedInUser(user) {
    const loginLinks = document.querySelectorAll('.login-link');
    const logoutLinks = document.querySelectorAll('.logout-link');
    const userMenu = document.querySelectorAll('.user-menu');
    const userName = document.querySelectorAll('.user-name');
    
    loginLinks.forEach(link => link.style.display = 'none');
    logoutLinks.forEach(link => link.style.display = 'inline-block');
    userMenu.forEach(menu => menu.style.display = 'inline-block');
    userName.forEach(name => {
        if (name) name.textContent = user.profile?.full_name || user.email;
    });
    
    // Store user in localStorage for quick access
    localStorage.setItem('user', JSON.stringify(user));
}

function updateUIForLoggedOutUser() {
    const loginLinks = document.querySelectorAll('.login-link');
    const logoutLinks = document.querySelectorAll('.logout-link');
    const userMenu = document.querySelectorAll('.user-menu');
    
    loginLinks.forEach(link => link.style.display = 'inline-block');
    logoutLinks.forEach(link => link.style.display = 'none');
    userMenu.forEach(menu => menu.style.display = 'none');
    
    localStorage.removeItem('user');
}

// Handle login form
export async function handleLogin(email, password) {
    const result = await signIn(email, password);
    if (result.success) {
        window.location.href = 'index.html';
    }
    return result;
}

// Handle registration
export async function handleRegister(email, password, userData) {
    const result = await signUp(email, password, userData);
    if (result.success) {
        window.location.href = 'login.html?registered=true';
    }
    return result;
}

// Handle logout
export async function handleLogout() {
    await signOut();
    window.location.href = 'index.html';
}

// Check if user is admin
export function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.email === 'admin@styleoflife.com' || user.role === 'admin';
}
