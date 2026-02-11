// mobile.js - Full iOS Safari native web app experience
(function() {
    console.log('mobile.js loaded');

    const isMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Add native webapp class
    document.documentElement.classList.add("native-webapp");

    const style = document.createElement("style");
    style.textContent = `
        /* Fullscreen layout with safe areas */
        html.native-webapp, html.native-webapp body {
            height: 100%;
            margin: 0;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
            background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            scroll-behavior: smooth;
        }

        /* Headers and footers match app background */
        html.native-webapp header,
        html.native-webapp footer {
            background: inherit;
            color: white;
            box-shadow: none;
        }

        /* Disable selection & highlight globally */
        html.native-webapp * {
            -webkit-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
        }

        /* Enable selection for inputs only */
        html.native-webapp input,
        html.native-webapp textarea {
            -webkit-user-select: text;
            user-select: text;
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

        /* Optional: subtle modal blur effect */
        .modal-backdrop {
            backdrop-filter: blur(8px);
            background: rgba(0,0,0,0.3);
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

    // ---------------------------
    // Optional: smooth navigation transitions
    // ---------------------------
    document.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', e => {
            // Simple fade transition effect
            const href = a.getAttribute('href');
            if (href && href.startsWith('/')) {
                e.preventDefault();
                document.body.style.transition = 'opacity 0.3s ease';
                document.body.style.opacity = 0;
                setTimeout(() => window.location.href = href, 300);
            }
        });
    });

    console.log('iOS Safari native web app mode applied!');
})();