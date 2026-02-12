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
    console.log('Current path:', window.location.pathname);
    console.log('Current href:', window.location.href);

    // ALWAYS optimize for mobile (browser or standalone)
    if (isMobile) {
        optimizeForMobile();
    }

    // Show install prompt ONLY on index.html if not standalone
    const isIndexPage = window.location.pathname === '/' || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname.includes('index.html');
    
    if (isMobile && !isStandalone && isIndexPage) {
        console.log('SHOWING INSTALL PROMPT NOW (index page)');
        setTimeout(() => {
            showInstallPrompt();
        }, 500);
    } else {
        console.log('NOT SHOWING PROMPT:');
        console.log('- isMobile:', isMobile);
        console.log('- isStandalone:', isStandalone);
        console.log('- isIndexPage:', isIndexPage);
    }

    // Extra optimizations for standalone mode
    if (isStandalone) {
        makeStandaloneApp();
        
        // Enable iframe navigation ONLY if we're on index.html
        const isIndexPage = window.location.pathname === '/' || 
                           window.location.pathname.includes('index.html') ||
                           window.location.pathname.endsWith('/');
        
        if (isIndexPage) {
            console.log('Enabling iframe navigation on index.html...');
            enableIframeMode();
        }
    }

    function enableIframeMode() {
        let iframe = null;
        
        // Check if we should load something in iframe on page load
        const urlParams = new URLSearchParams(window.location.search);
        const iframePage = urlParams.get('page');
        
        if (iframePage) {
            loadInIframe(decodeURIComponent(iframePage));
        }
        
        // Intercept ALL clicks
        document.addEventListener('click', function(e) {
            const target = e.target.closest('button, a');
            if (!target) return;
            
            // Get onclick attribute
            const onclick = target.getAttribute('onclick');
            if (onclick && onclick.includes('window.location')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Extract URL from onclick
                const match = onclick.match(/['"`]([^'"`]+)['"`]/);
                if (match) {
                    console.log('Intercepted onclick, loading:', match[1]);
                    loadInIframe(match[1]);
                }
                return false;
            }
            
            // Get href
            const href = target.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Intercepted href, loading:', href);
                loadInIframe(href);
                return false;
            }
        }, true);
        
        // Override window.location.href for JavaScript navigation
        const originalLocationHref = window.location.href;
        Object.defineProperty(window.location, 'href', {
            set: function(url) {
                console.log('Intercepted location.href:', url);
                if (url.includes('index.html') || url === '/') {
                    // Going to index, clear iframe
                    if (iframe) {
                        iframe.remove();
                        iframe = null;
                        document.querySelector('.container').style.display = '';
                    }
                } else {
                    loadInIframe(url);
                }
            },
            get: function() {
                return window.location.toString();
            }
        });
        
        function loadInIframe(url) {
            console.log('Loading in iframe:', url);
            
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.id = 'app-iframe';
                iframe.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: none;
                    z-index: 999999;
                    background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
                `;
                document.body.appendChild(iframe);
                
                // Hide main content
                document.querySelector('.container').style.display = 'none';
            }
            
            // Set src
            iframe.src = url;
            
            // Update URL without reload
            const newUrl = '?page=' + encodeURIComponent(url);
            window.history.pushState({}, '', newUrl);
        }
        
        // Handle back button
        window.addEventListener('popstate', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const page = urlParams.get('page');
            
            if (!page) {
                // Back to index
                if (iframe) {
                    iframe.remove();
                    iframe = null;
                    document.querySelector('.container').style.display = '';
                }
            } else {
                // Load different page in iframe
                if (iframe) {
                    iframe.src = decodeURIComponent(page);
                } else {
                    loadInIframe(decodeURIComponent(page));
                }
            }
        });
        
        console.log('Iframe mode enabled');
    }

    function showInstallPrompt() {
        console.log('Creating install prompt...');
        
        const overlay = document.createElement('div');
        overlay.id = 'pwa-install-overlay';
        overlay.innerHTML = `
            <div class="pwa-banner">
                <button class="dismiss-btn" onclick="dismissInstallPrompt()">×</button>
                <h3 class="install-title">Install the app for better experience!</h3>
                <p class="install-subtitle">(no download required)</p>
                <div class="gif-container">
                    <img src="assets/632FA4E9-04F8-470A-9538-E400B1F45AB1.gif" 
                         alt="Installation tutorial" 
                         class="tutorial-gif"
                         onerror="console.error('GIF failed to load'); this.style.display='none';"
                         onload="console.log('GIF loaded successfully');">
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        console.log('Overlay added to body');
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
                padding: 20px;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .pwa-banner {
                background: white;
                border-radius: 20px;
                padding: 30px 20px;
                width: 100%;
                max-width: 400px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                position: relative;
                text-align: center;
            }

            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .install-title {
                font-size: 1.3rem;
                font-weight: 900;
                color: #000;
                margin: 0 0 5px 0;
                padding-right: 30px;
            }

            .install-subtitle {
                font-size: 0.9rem;
                color: #666;
                margin: 0 0 20px 0;
            }

            .gif-container {
                background: white;
                border-radius: 15px;
                overflow: hidden;
                border: 4px solid #000;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }

            .tutorial-gif {
                width: 100%;
                height: auto;
                display: block;
            }

            .dismiss-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.1);
                border: none;
                font-size: 2rem;
                color: #000;
                cursor: pointer;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                line-height: 1;
                padding: 0;
                transition: all 0.2s;
            }

            .dismiss-btn:hover {
                background: rgba(0, 0, 0, 0.2);
            }

            .dismiss-btn:active {
                opacity: 0.5;
                transform: scale(0.95);
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
            console.log('Dismissing prompt');
            overlay.remove();
        };
        
        console.log('Install prompt created successfully');
    }

    function optimizeForMobile() {
        console.log('Optimizing for mobile...');

        // Update viewport meta tag - AGGRESSIVE zoom prevention
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

        // Add theme color to remove white bars
        let themeColor = document.querySelector('meta[name="theme-color"]');
        if (!themeColor) {
            themeColor = document.createElement('meta');
            themeColor.name = 'theme-color';
            document.head.appendChild(themeColor);
        }
        themeColor.content = '#8b0000'; // Dark red to match background

        // Add mobile-optimized styles
        const style = document.createElement('style');
        style.id = 'mobile-optimizations';
        style.textContent = `
            /* Remove white bars on mobile */
            html {
                background: #8b0000;
                min-height: 100%;
            }

            body {
                background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
                background-attachment: fixed;
                min-height: 100vh;
                min-height: -webkit-fill-available;
            }

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

            /* AGGRESSIVE zoom prevention */
            html {
                touch-action: pan-y;
                -ms-touch-action: pan-y;
            }

            body, .container, .game-screen, .lobby-screen {
                touch-action: pan-y;
                -ms-touch-action: pan-y;
            }

            /* Prevent zoom on double tap */
            button, a, .btn, input, select, textarea {
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

            /* Force layout to stay at 1x zoom */
            @viewport {
                width: device-width;
                zoom: 1;
                min-zoom: 1;
                max-zoom: 1;
                user-zoom: fixed;
            }
        `;
        document.head.appendChild(style);

        // AGGRESSIVE zoom prevention with event listeners
        let lastTouchDistance = 0;
        
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                // Multiple fingers = pinch
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) {
                // Pinch gesture
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent accidental zoom gestures
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('gesturechange', function(e) {
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('gestureend', function(e) {
            e.preventDefault();
        }, { passive: false });

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

        // Ensure ALL required meta tags are present
        const metaTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'theme-color', content: '#8b0000' }
        ];

        metaTags.forEach(tag => {
            let meta = document.querySelector(`meta[name="${tag.name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = tag.name;
                document.head.appendChild(meta);
            }
            meta.content = tag.content;
        });

        // Update viewport
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, minimal-ui';

        // Add standalone-specific styles
        const style = document.createElement('style');
        style.id = 'standalone-styles';
        style.textContent = `
            /* Safe area for notched phones */
            body {
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
                padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);
            }

            /* Full screen experience */
            html {
                height: 100%;
                height: -webkit-fill-available;
            }
            
            body {
                min-height: 100vh;
                min-height: -webkit-fill-available;
                width: 100%;
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

            /* Prevent pull-to-refresh */
            body {
                overscroll-behavior-y: contain;
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