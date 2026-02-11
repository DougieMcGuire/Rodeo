// Mobile detection and PWA setup
(function() {
    console.log('mobile.js loaded');

    // Clear any old localStorage data from previous version
    localStorage.removeItem('pwa-prompt-dismissed');

    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Check if running as standalone app (added to home screen)
    const isStandalone = window.navigator.standalone || 
                        window.matchMedia('(display-mode: standalone)').matches ||
                        document.referrer.includes('android-app://');
    
    console.log('Is mobile:', isMobile);
    console.log('Is standalone:', isStandalone);

    // ALWAYS optimize for mobile (browser or standalone)
    if (isMobile) {
        optimizeForMobile();
    }

    // Show install prompt on home screen only if not standalone
    if (isMobile && !isStandalone && window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        // Only show on index.html (home screen)
        setTimeout(() => {
            showInstallPrompt();
        }, 500); // Small delay so page loads first
    }

    // Extra optimizations for standalone mode
    if (isStandalone) {
        makeStandaloneApp();
    }

    function showInstallPrompt() {
        // Detect iOS vs Android
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);

        let instructions = '';
        
        if (isIOS) {
            instructions = `
                <div class="quick-steps">
                    <p class="step-text">1. Tap <span class="share-icon">⬆️</span> at the bottom</p>
                    <p class="step-text">2. Select "Add to Home Screen"</p>
                </div>
            `;
        } else if (isAndroid) {
            instructions = `
                <div class="quick-steps">
                    <p class="step-text">1. Tap <span class="menu-icon">⋮</span> menu</p>
                    <p class="step-text">2. Select "Add to Home screen"</p>
                </div>
            `;
        }

        const overlay = document.createElement('div');
        overlay.id = 'pwa-install-overlay';
        overlay.innerHTML = `
            <div class="pwa-banner">
                <div class="banner-content">
                    <div class="banner-icon">🤠</div>
                    <div class="banner-text">
                        <h3>Install RODEO</h3>
                        <p>Quick 2-tap install for full-screen play</p>
                    </div>
                </div>
                <div class="banner-instructions">
                    ${instructions}
                </div>
                <button class="dismiss-btn" onclick="dismissInstallPrompt()">×</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 99999;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                animation: fadeIn 0.3s ease;
                padding-bottom: env(safe-area-inset-bottom);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .pwa-banner {
                background: white;
                border-radius: 20px 20px 0 0;
                padding: 25px 20px;
                width: 100%;
                max-width: 500px;
                box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                position: relative;
            }

            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }

            .banner-content {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 20px;
            }

            .banner-icon {
                font-size: 3rem;
            }

            .banner-text h3 {
                font-size: 1.5rem;
                font-weight: 900;
                color: #000;
                margin: 0 0 5px 0;
            }

            .banner-text p {
                font-size: 0.9rem;
                color: #666;
                margin: 0;
            }

            .banner-instructions {
                background: rgba(255, 59, 48, 0.05);
                padding: 15px;
                border-radius: 12px;
                border: 2px solid #FF3B30;
            }

            .quick-steps {
                margin: 0;
            }

            .step-text {
                font-size: 1rem;
                font-weight: 700;
                color: #000;
                margin: 8px 0;
            }

            .share-icon, .menu-icon {
                display: inline-block;
                font-size: 1.3rem;
                background: #FF3B30;
                color: white;
                padding: 2px 8px;
                border-radius: 6px;
                margin: 0 3px;
            }

            .dismiss-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: transparent;
                border: none;
                font-size: 2rem;
                color: #999;
                cursor: pointer;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dismiss-btn:active {
                opacity: 0.5;
            }
        `;
        document.head.appendChild(style);

        // Auto-dismiss on tap outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                dismissInstallPrompt();
            }
        });

        // Expose dismiss function globally
        window.dismissInstallPrompt = function() {
            overlay.remove();
        };
    }

    function optimizeForMobile() {
        console.log('Optimizing for mobile...');

        // Update viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

        // Add mobile-optimized styles
        const style = document.createElement('style');
        style.id = 'mobile-optimizations';
        style.textContent = `
            /* Prevent text selection (except inputs) */
            * {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
            }

            /* Allow text selection in inputs */
            input, textarea {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
            }

            /* Prevent zoom on double tap */
            button, a, .btn {
                touch-action: manipulation;
            }

            /* Smooth scrolling */
            html {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
            }

            /* Remove ugly iOS highlights */
            button:focus, 
            input:focus,
            a:focus,
            select:focus {
                outline: none;
                -webkit-tap-highlight-color: transparent;
            }

            /* Prevent rubber band scrolling */
            body {
                overscroll-behavior: none;
                position: relative;
            }

            /* Make buttons feel more responsive */
            .btn:active,
            button:active {
                transform: scale(0.98);
                transition: transform 0.1s;
            }

            /* Fix iOS input zoom */
            input, select, textarea {
                font-size: 16px !important;
            }

            /* Better mobile spacing */
            @media (max-width: 600px) {
                .container {
                    padding: 15px;
                }
                
                .btn {
                    min-height: 48px;
                    font-size: 1.1rem;
                }
            }

            /* Prevent text inflation on mobile */
            body {
                -webkit-text-size-adjust: 100%;
                text-size-adjust: 100%;
            }
        `;
        document.head.appendChild(style);

        // Prevent accidental zoom gestures
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });

        document.addEventListener('gesturechange', function(e) {
            e.preventDefault();
        });

        document.addEventListener('gestureend', function(e) {
            e.preventDefault();
        });

        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        console.log('Mobile optimizations applied!');
    }

    function makeStandaloneApp() {
        console.log('Applying standalone app enhancements...');

        // Add PWA meta tags
        const meta = document.createElement('meta');
        meta.name = 'apple-mobile-web-app-capable';
        meta.content = 'yes';
        document.head.appendChild(meta);

        const statusBar = document.createElement('meta');
        statusBar.name = 'apple-mobile-web-app-status-bar-style';
        statusBar.content = 'black-translucent';
        document.head.appendChild(statusBar);

        // Add standalone-specific styles
        const style = document.createElement('style');
        style.textContent = `
            /* Safe area for notched phones */
            body {
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
                padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);
            }

            /* Full screen experience */
            html, body {
                width: 100%;
                height: 100%;
                overflow-x: hidden;
            }

            /* Hide scrollbars in standalone */
            ::-webkit-scrollbar {
                display: none;
            }

            body {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `;
        document.head.appendChild(style);

        console.log('Standalone app mode activated!');
    }

    // Expose function to check if standalone
    window.isStandaloneApp = function() {
        return isStandalone;
    };

    // Expose function to check if mobile
    window.isMobileDevice = function() {
        return isMobile;
    };

})();