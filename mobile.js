// ================= MOBILE.JS FULL STANDALONE + INSTALL PROMPT =================
(function() {
    console.log('===== MOBILE.JS FULL APP ILLUSION MODE =====');

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    // ---------- MOBILE + STANDALONE STYLES ----------
    if (isMobile) optimizeForMobile();
    if (isStandalone) makeStandaloneApp();

    // ---------- INSTALL PROMPT ----------
    const isIndexPage = window.location.pathname === '/' || window.location.pathname.endsWith('/') || window.location.pathname.includes('index.html');
    if (!isStandalone && isIndexPage) showInstallPrompt();

    // ---------- APP ILLUSION NAVIGATION ----------
    let iframe = null;

    function createIframe() {
        if (iframe) return;
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
        const container = document.querySelector('.container');
        if (container) container.style.display = 'none';
    }

    function loadInIframe(url) {
        console.log('Loading in iframe:', url);
        createIframe();
        iframe.src = url;
        window.history.pushState({ page: url }, '', '?page=' + encodeURIComponent(url));
    }

    document.addEventListener('click', function(e) {
        const target = e.target.closest('a, button');
        if (!target) return;

        let href = target.getAttribute('href');
        const onclick = target.getAttribute('onclick');

        if (onclick && onclick.includes('window.location')) {
            const match = onclick.match(/['"`]([^'"`]+)['"`]/);
            if (match) {
                e.preventDefault();
                loadInIframe(match[1]);
            }
        } else if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
            e.preventDefault();
            loadInIframe(href);
        }
    }, true);

    const originalHref = window.location.href;
    Object.defineProperty(window.location, 'href', {
        set(url) { loadInIframe(url); },
        get() { return window.location.toString(); }
    });

    window.addEventListener('popstate', function(e) {
        if (!e.state || !e.state.page) {
            if (iframe) {
                iframe.remove();
                iframe = null;
                const container = document.querySelector('.container');
                if (container) container.style.display = '';
            }
        } else {
            if (iframe) iframe.src = e.state.page;
            else loadInIframe(e.state.page);
        }
    });

    // ---------- INSTALL PROMPT FUNCTION ----------
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

        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
                padding: 20px;
            }
            @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }

            .pwa-banner {
                background: white;
                border-radius: 20px;
                padding: 30px 20px;
                width: 100%;
                max-width: 400px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                animation: slideUp 0.3s ease;
                position: relative;
                text-align: center;
            }
            @keyframes slideUp { from{transform:translateY(50px);opacity:0;} to{transform:translateY(0);opacity:1;} }

            .install-title { font-size:1.3rem; font-weight:900; margin:0 0 5px 0; padding-right:30px; }
            .install-subtitle { font-size:0.9rem; color:#666; margin:0 0 20px 0; }

            .gif-container { background:white; border-radius:15px; overflow:hidden; border:4px solid #000; box-shadow:0 4px 15px rgba(0,0,0,0.1); }
            .tutorial-gif { width:100%; height:auto; display:block; }

            .dismiss-btn {
                position:absolute; top:10px; right:10px; width:40px; height:40px; border:none;
                font-size:2rem; cursor:pointer; border-radius:50%; line-height:1;
                background: rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center;
                transition: all 0.2s;
            }
            .dismiss-btn:hover { background: rgba(0,0,0,0.2); }
            .dismiss-btn:active { opacity:0.5; transform: scale(0.95); }
        `;
        document.head.appendChild(style);

        overlay.addEventListener('click', (e) => { if (e.target === overlay) dismissInstallPrompt(); });
        window.dismissInstallPrompt = function() { overlay.remove(); console.log('Install prompt dismissed'); };
    }

    // ---------- MOBILE OPTIMIZATIONS ----------
    function optimizeForMobile() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) { viewport = document.createElement('meta'); viewport.name='viewport'; document.head.appendChild(viewport); }
        viewport.content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

        let style = document.createElement('style');
        style.textContent=`
            html,body{height:100%;width:100%;margin:0;padding:0;overflow:hidden;background:radial-gradient(circle at center,#ff0000 0%,#8b0000 100%);}
            *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
            input,textarea{user-select:text;font-size:16px;}
        `;
        document.head.appendChild(style);

        // Prevent zoom / pinch
        document.addEventListener('touchstart',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
        document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
        document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
        document.addEventListener('gesturechange',e=>e.preventDefault(),{passive:false});
        document.addEventListener('gestureend',e=>e.preventDefault(),{passive:false});
        let lastTouchEnd=0;
        document.addEventListener('touchend',e=>{const now=Date.now();if(now-lastTouchEnd<=300)e.preventDefault();lastTouchEnd=now;},false);
    }

    // ---------- STANDALONE OPTIMIZATIONS ----------
    function makeStandaloneApp() {
        const metas=[
            {name:'apple-mobile-web-app-capable',content:'yes'},
            {name:'apple-mobile-web-app-status-bar-style',content:'black-translucent'},
            {name:'theme-color',content:'#8b0000'}
        ];
        metas.forEach(m=>{let tag=document.querySelector(`meta[name="${m.name}"]`);if(!tag){tag=document.createElement('meta');tag.name=m.name;document.head.appendChild(tag);}tag.content=m.content;});
    }

    // ---------- EXPOSE GLOBAL FLAGS ----------
    window.isStandaloneApp = () => isStandalone;
    window.isMobileDevice = () => isMobile;

})();