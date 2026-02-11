// mobile.js - True fullscreen native iOS web app, fixed zoom
(function() {
    console.log('mobile.js loaded');

    const isMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Force viewport meta
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = "viewport";
        document.head.appendChild(viewport);
    }
    viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

    // Add native-webapp class
    document.documentElement.classList.add("native-webapp");

    // Apply full-screen, fixed layout styles
    const style = document.createElement('style');
    style.textContent = `
        html.native-webapp, html.native-webapp body {
            width: 100%;
            height: 100%;
            position: fixed;
            top: 0;
            left: 0;
            margin: 0;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            overflow: hidden;
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-text-size-adjust: 100%;
            zoom: 1;
        }

        /* Hide all headers and footers */
        html.native-webapp header,
        html.native-webapp footer {
            display: none !important;
        }

        /* Disable text selection and highlight globally */
        html.native-webapp * {
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
            -webkit-touch-callout: none !important;
        }

        /* Enable selection for inputs and force font-size 16px to prevent zoom */
        html.native-webapp input,
        html.native-webapp textarea,
        html.native-webapp select {
            -webkit-user-select: text !important;
            user-select: text !important;
            font-size: 16px !important;
            color: black;
        }

        /* Buttons and links feel native */
        button, a {
            touch-action: manipulation;
            transition: transform 0.1s ease, opacity 0.1s ease;
        }
        button:active, a:active {
            opacity: 0.8;
            transform: scale(0.97);
        }

        /* Scrollable content areas */
        .scrollable {
            -webkit-overflow-scrolling: touch;
            overflow-y: auto;
        }

        /* Hide scrollbars */
        ::-webkit-scrollbar {
            display: none;
        }
    `;
    document.head.appendChild(style);

    // ---------------------------
    // Prevent accidental zoom
    // ---------------------------
    let lastTouchEnd = 0;
    document.addEventListener('touchend', e => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, false);

    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('gestureend', e => e.preventDefault());

    // Lock scroll position and zoom permanently
    window.addEventListener('scroll', () => window.scrollTo(0,0));

    console.log('iOS Safari true fullscreen fixed zoom applied!');
})();