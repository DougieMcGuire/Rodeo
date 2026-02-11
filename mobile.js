// mobile.js - Fullscreen native iOS web app, fixed zoom & keyboard issues
(function() {
    console.log('mobile.js loaded');

    const isMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Add class to apply full native-webapp styles
    document.documentElement.classList.add("native-webapp");

    const style = document.createElement("style");
    style.textContent = `
        /* Fullscreen layout with safe areas, no Safari header/footer */
        html.native-webapp, html.native-webapp body {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
            background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            scroll-behavior: smooth;
            position: fixed;
            top: 0;
            left: 0;
            overflow: hidden;
        }

        /* Remove default Safari header/footer space */
        html.native-webapp header,
        html.native-webapp footer {
            display: none;
        }

        /* Text selection disabled globally */
        html.native-webapp * {
            -webkit-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
        }

        /* Enable selection for inputs */
        html.native-webapp input,
        html.native-webapp textarea {
            -webkit-user-select: text;
            user-select: text;
            color: black;
            font-size: 16px; /* Prevent zoom when typing */
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

        /* Smooth scroll content areas */
        .scrollable {
            -webkit-overflow-scrolling: touch;
            overflow-y: auto;
        }

        /* Hide scrollbars */
        ::-webkit-scrollbar {
            display: none;
        }

        /* Prevent overscroll rubber-band */
        body, html {
            overscroll-behavior: none;
        }

        /* Prevent keyboard from zooming in */
        input, textarea, select {
            font-size: 16px !important;
        }
    `;
    document.head.appendChild(style);

    // ---------------------------
    // Prevent accidental zoom
    // ---------------------------
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, false);

    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('gestureend', e => e.preventDefault());

    console.log('iOS Safari native fullscreen mode applied!');
})();