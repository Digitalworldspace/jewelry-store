// js/analytics.js - Visitor Tracking
function getVisitorId() {
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
        visitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitorId', visitorId);
    }
    return visitorId;
}

async function trackPageView(pageName) {
    const visitorId = getVisitorId();
    const today = new Date().toISOString().split('T')[0];
    
    try {
        await fetch(`${CONFIG.API_URL}?action=trackVisit&visitorId=${visitorId}&page=${pageName}&date=${today}&userAgent=${encodeURIComponent(navigator.userAgent)}&t=${Date.now()}`);
    } catch (error) {
        console.log('Analytics offline');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    trackPageView(pageName);
});
