// mobile.js - Full Working Standalone + Install Overlay
(function () {

    console.log('mobile.js loaded');

    // Detect mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Detect if running as standalone app
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    console.log('Is mobile:', isMobile);
    console.log('Is standalone:', isStandalone);

    if (!isMobile) return; // do nothing on desktop

    if (!isStandalone) {
        showInstallOverlay();
    } else {
        enableStandaloneMode();
    }

    // ---------------------------
    // Fullscreen install overlay
    // ---------------------------
    function showInstallOverlay() {

        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        const overlay = document.createElement('div');
        overlay.id = "install-overlay";

        overlay.innerHTML = `
            <div class="install-box">
                <h1>Add RODEO to Home Screen</h1>
                <p>For the best playing experience.</p>
                
                ${isIOS ? `
                    <ol>
                        <li>Tap the Share button (⬆️)</li>
                        <li>Select "Add to Home Screen"</li>
                        <li>Tap "Add"</li>
                    </ol>
                ` : `
                    <ol>
                        <li>Tap the 3-dot menu</li>
                        <li>Select "Add to Home screen"</li>
                        <li>Tap "Add"</li>
                    </ol>
                `}

                <button id="skipInstall">Skip</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add overlay styles
        const style = document.createElement('style');
        style.textContent = `
            #install-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                padding: 20px;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .install-box {
                background: white;
                border-radius: 30px;
                padding: 40px 30px;
                max-width: 500px;
                width: 100%;
                text-align: center;
                box-shadow: 0 0 0 6px #000, 0 25px 80px rgba(0,0,0,0.5);
            }

            .install-box h1 {
                font-size: 2.5rem;
                font-weight: 900;
                color: #000;
                margin-bottom: 10px;
                text-transform: uppercase;
            }

            .install-box p {
                font-size: 1.2rem;
                font-weight: 600;
                color: #666;
                margin-bottom: 30px;
            }

            .install-box ol {
                text-align: left;
                margin: 20px 0;
                padding-left: 20px;
            }

            .install-box li {
                margin-bottom: 10px;
                font-weight: 700;
                font-size: 1rem;
                color: #000;
            }

            #skipInstall {
                margin-top: 20px;
                padding: 8px 20px;
                background: transparent;
                border: none;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                color: #999;
                text-decoration: underline;
            }

            #skipInstall:active {
                opacity: 0.5;
            }
        `;
        document.head.appendChild(style);

        // Skip button removes overlay
        document.getElementById("skipInstall").onclick = () => {
            overlay.remove();
        };
    }

    // ---------------------------
    // Apply standalone (native app) feel
    // ---------------------------
    function enableStandaloneMode() {

        console.log('Standalone mode detected');

        document.documentElement.classList.add("standalone");

        const style = document.createElement("style");
        style.textContent = `
            html.standalone,
            html.standalone body {
                height: 100%;
                overscroll-behavior: none;
                -webkit-overflow-scrolling: touch;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
                color: white;
                margin: 0;
            }

            html.standalone header,
            html.standalone footer {
                background: inherit;
                color: white;
            }

            html.standalone * {
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                -webkit-user-select: none;
            }

            html.standalone input,
            html.standalone textarea {
                user-select: text;
                -webkit-user-select: text;
                color: black;
            }

            button, a {
                touch-action: manipulation;
            }

            /* Optional: make scroll smooth */
            html.standalone {
                scroll-behavior: smooth;
            }
        `;
        document.head.appendChild(style);

        // Prevent accidental double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (e) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // ---------------------------
    // Safe database write helper
    // ---------------------------
    // Example usage:
    // writeSafe('rooms/224546/hostId', hostId);

    window.writeSafe = function (path, value) {
        if (value === undefined) {
            console.error(`Cannot write undefined to ${path}`);
            return;
        }
        try {
            // Example: if using Firebase
            if (typeof db !== 'undefined') {
                db.ref(path).set(value);
            }
        } catch (e) {
            console.error('Database write failed:', e);
        }
    };

})();
