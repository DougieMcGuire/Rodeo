// mobile.js - True fullscreen iOS Safari webapp with dynamic zoom correction
(function() {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isIOS) return;

    console.log('iOS native-webapp init');

    // Create/overwrite viewport meta
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = "viewport";
        document.head.appendChild(viewport);
    }
    viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

    // Add class for native styles
    document.documentElement.classList.add('native-webapp');

    // ------------------ Styles ------------------
    const style = document.createElement('style');
    style.textContent = `
        html.native-webapp, body.native-webapp {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            position: fixed;
            top: 0;
            left: 0;
            overflow: hidden;
            background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            scroll-behavior: smooth;
        }

        /* Hide headers/footers */
        header, footer {
            display: none !important;
        }

        /* Disable text selection globally */
        * {
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
            -webkit-touch-callout: none !important;
        }

        /* Enable text selection for inputs only and prevent zoom */
        input, textarea, select {
            -webkit-user-select: text !important;
            user-select: text !important;
            font-size: 16px !important; /* prevents zoom on focus */
            color: black;
        }

        /* Buttons and links feedback */
        button, a {
            touch-action: manipulation;
            transition: transform 0.1s ease, opacity 0.1s ease;
        }
        button:active, a:active {
            opacity: 0.8;
            transform: scale(0.97);
        }

        /* Scrollable content */
        .scrollable {
            -webkit-overflow-scrolling: touch;
            overflow-y: auto;
        }

        /* Hide scrollbars */
        ::-webkit-scrollbar { display: none; }
    `;
    document.head.appendChild(style);

    // ------------------ Disable zoom gestures ------------------
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('gestureend', e => e.preventDefault());

    let lastTouchEnd = 0;
    document.addEventListener('touchend', e => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    });

    // ------------------ Dynamic fullscreen & zoom fix ------------------
    function fixViewport() {
        const currentZoom = window.innerWidth / screen.width;
        if (currentZoom !== 1) {
            // Reset viewport to maintain zoom 1
            viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
        }

        // Force body and html to fill screen
        document.documentElement.style.width = screen.width + "px";
        document.documentElement.style.height = screen.height + "px";
        document.body.style.width = screen.width + "px";
        document.body.style.height = screen.height + "px";
    }

    // Run on load
    fixViewport();

    // Run continuously in case of zooming, orientation change, keyboard focus
    window.addEventListener('resize', fixViewport);
    window.addEventListener('orientationchange', fixViewport);
    window.addEventListener('focusin', fixViewport); // input focus
    window.addEventListener('focusout', fixViewport);

    console.log('iOS Safari fullscreen + fixed zoom enforced!');
})();