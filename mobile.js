// Mobile detection and PWA setup
(function() {
    console.log('mobile.js loaded');

    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Check if running as standalone app (added to home screen)
    const isStandalone = window.navigator.standalone || 
                        window.matchMedia('(display-mode: standalone)').matches ||
                        document.referrer.includes('android-app://');
    
    console.log('Is mobile:', isMobile);
    console.log('Is standalone:', isStandalone);

    // ALWAYS show prompt on mobile if not standalone (removed localStorage check)
    if (isMobile && !isStandalone) {
        // Show the prompt every time
        showInstallPrompt();
    } else if (isStandalone) {
        // Make it feel like a native app
        makeStandaloneApp();
    }

    function showInstallPrompt() {
        // Detect iOS vs Android
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);

        let instructions = '';
        
        if (isIOS) {
            instructions = `
                <div class="install-step">
                    <div class="step-number">1</div>
                    <p>Tap the <strong>Share</strong> button at the bottom of Safari</p>
                    <div class="icon">⬆️</div>
                </div>
                <div class="install-step">
                    <div class="step-number">2</div>
                    <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                    <div class="icon">➕</div>
                </div>
                <div class="install-step">
                    <div class="step-number">3</div>
                    <p>Tap <strong>"Add"</strong> in the top right</p>
                    <div class="icon">✓</div>
                </div>
            `;
        } else if (isAndroid) {
            instructions = `
                <div class="install-step">
                    <div class="step-number">1</div>
                    <p>Tap the <strong>Menu</strong> button (three dots)</p>
                    <div class="icon">⋮</div>
                </div>
                <div class="install-step">
                    <div class="step-number">2</div>
                    <p>Tap <strong>"Add to Home screen"</strong></p>
                    <div class="icon">➕</div>
                </div>
                <div class="install-step">
                    <div class="step-number">3</div>
                    <p>Tap <strong>"Add"</strong> to confirm</p>
                    <div class="icon">✓</div>
                </div>
            `;
        }

        const overlay = document.createElement('div');
        overlay.id = 'pwa-install-overlay';
        overlay.innerHTML = `
            <div class="pwa-install-modal">
                <div class="pwa-logo">🤠</div>
                <h1>Install RODEO</h1>
                <p class="pwa-subtitle">Add to your home screen for a better experience!</p>
                
                <div class="install-instructions">
                    ${instructions}
                </div>

                <button class="pwa-skip-btn" onclick="dismissInstallPrompt()">Skip for now</button>
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
                background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .pwa-install-modal {
                background: white;
                border-radius: 30px;
                padding: 40px 30px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 0 0 6px #000, 0 25px 80px rgba(0, 0, 0, 0.5);
                text-align: center;
            }

            .pwa-logo {
                font-size: 5rem;
                margin-bottom: 20px;
                animation: bounce 1s ease infinite;
            }

            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            .pwa-install-modal h1 {
                font-size: 2.5rem;
                font-weight: 900;
                color: #000;
                margin-bottom: 10px;
                text-transform: uppercase;
            }

            .pwa-subtitle {
                font-size: 1.2rem;
                color: #666;
                margin-bottom: 30px;
                font-weight: 600;
            }

            .install-instructions {
                text-align: left;
                margin: 30px 0;
            }

            .install-step {
                display: flex;
                align-items: center;
                gap: 20px;
                padding: 20px;
                background: rgba(255, 59, 48, 0.05);
                border: 4px solid #000;
                border-radius: 15px;
                margin-bottom: 15px;
            }

            .step-number {
                width: 40px;
                height: 40px;
                background: #FF3B30;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 900;
                font-size: 1.5rem;
                border: 3px solid #000;
                flex-shrink: 0;
            }

            .install-step p {
                flex: 1;
                font-size: 1rem;
                font-weight: 700;
                color: #000;
                margin: 0;
            }

            .install-step .icon {
                font-size: 2rem;
                flex-shrink: 0;
            }

            .pwa-skip-btn {
                margin-top: 20px;
                padding: 8px 20px;
                background: transparent;
                border: none;
                font-size: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                color: #999;
                text-decoration: underline;
            }

            .pwa-skip-btn:active {
                opacity: 0.5;
            }
        `;
        document.head.appendChild(style);

        // Expose dismiss function globally - just removes overlay, doesn't save to localStorage
        window.dismissInstallPrompt = function() {
            overlay.remove();
        };
    }

    function makeStandaloneApp() {
        console.log('Making standalone app experience...');

        // Add meta tags for iOS app feel
        const meta = document.createElement('meta');
        meta.name = 'apple-mobile-web-app-capable';
        meta.content = 'yes';
        document.head.appendChild(meta);

        const statusBar = document.createElement('meta');
        statusBar.name = 'apple-mobile-web-app-status-bar-style';
        statusBar.content = 'black-translucent';
        document.head.appendChild(statusBar);

        // Disable zoom, text selection, callouts
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }

        // Add CSS for native app feel
        const style = document.createElement('style');
        style.textContent = `
            /* Disable text selection */
            * {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
            }

            /* Allow text selection only in inputs */
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
            }

            /* Remove ugly iOS highlights */
            button:focus, 
            input:focus,
            a:focus {
                outline: none;
                -webkit-tap-highlight-color: transparent;
            }

            /* Safe area for notched phones */
            body {
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
                padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);
            }

            /* Prevent rubber band scrolling on iOS */
            body {
                overscroll-behavior: none;
            }

            /* Make buttons feel more responsive */
            .btn:active,
            button:active {
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);

        // Prevent accidental zoom
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

        console.log('Standalone app experience applied!');
    }

    // Expose function to check if standalone
    window.isStandaloneApp = function() {
        return isStandalone;
    };

})();
