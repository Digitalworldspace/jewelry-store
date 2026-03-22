// js/analytics.js - Server-Side Visitor Tracking (Works Across All Browsers)

// Generate or get persistent visitor ID
function getVisitorId() {
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
        visitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitorId', visitorId);
    }
    return visitorId;
}

// Track page view to server
async function trackPageView(pageName) {
    const visitorId = getVisitorId();
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=trackVisit&visitorId=${visitorId}&page=${pageName}&date=${today}&userAgent=${encodeURIComponent(navigator.userAgent)}&referrer=${encodeURIComponent(document.referrer)}&t=${Date.now()}`);
        const result = await response.json();
        console.log('✅ Page view tracked:', pageName);
        return result;
    } catch (error) {
        console.error('Failed to track visit:', error);
        storeOfflineVisit(visitorId, pageName, today);
    }
}

// Store offline visits
function storeOfflineVisit(visitorId, page, date) {
    let offlineVisits = JSON.parse(localStorage.getItem('offlineVisits') || '[]');
    offlineVisits.push({ visitorId, page, date, timestamp: Date.now() });
    localStorage.setItem('offlineVisits', JSON.stringify(offlineVisits));
}

// Sync offline visits when online
async function syncOfflineVisits() {
    const offlineVisits = JSON.parse(localStorage.getItem('offlineVisits') || '[]');
    if (offlineVisits.length === 0) return;
    
    for (const visit of offlineVisits) {
        try {
            await fetch(`${CONFIG.API_URL}?action=trackVisit&visitorId=${visit.visitorId}&page=${visit.page}&date=${visit.date}&offline=true`);
        } catch (e) {}
    }
    localStorage.setItem('offlineVisits', '[]');
    console.log('✅ Synced', offlineVisits.length, 'offline visits');
}

// Get analytics data
async function getAnalytics(days = 30) {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAnalytics&days=${days}&t=${Date.now()}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to get analytics:', error);
        return { dailyVisits: [], totalVisitors: 0, pageViews: {}, topPages: [] };
    }
}

// Get real-time active users
async function getActiveUsers() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getActiveUsers&t=${Date.now()}`);
        return await response.json();
    } catch (error) {
        return { activeUsers: 0 };
    }
}

// Track time spent on page
let pageStartTime = Date.now();

async function trackTimeSpent() {
    const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000);
    if (timeSpent > 5) {
        const visitorId = getVisitorId();
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        try {
            await fetch(`${CONFIG.API_URL}?action=trackTime&visitorId=${visitorId}&page=${pageName}&time=${timeSpent}`);
        } catch (e) {}
    }
}

// Initialize tracking
document.addEventListener('DOMContentLoaded', () => {
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    trackPageView(pageName);
    syncOfflineVisits();
    
    window.addEventListener('beforeunload', () => {
        trackTimeSpent();
    });
});

// Track when page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        trackPageView(pageName);
        pageStartTime = Date.now();
    } else {
        trackTimeSpent();
    }
});
