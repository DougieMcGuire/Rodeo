// Mobile.js - ONLY redirects to mobile.html, nothing else
(function() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isInIframe = window.self !== window.top;
    const isOnIndex = window.location.pathname === '/' || 
                     window.location.pathname.includes('index.html') ||
                     window.location.pathname.endsWith('/');
    
    // Only redirect if: mobile + on index.html + not in iframe
    if (isMobile && isOnIndex && !isInIframe) {
        window.location.replace('mobile.html');
    }
})();