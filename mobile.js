// ================= MOBILE.JS FOR MOBILE SPA =================
(function() {
    console.log('===== MOBILE.JS LOADED =====');

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    // ---------- INSTALL PROMPT ON INDEX ONLY ----------
    const isIndexPage = window.location.pathname === '/' || window.location.pathname.endsWith('/') || window.location.pathname.includes('index.html');
    
    if (isMobile && isIndexPage) {
        showInstallPrompt();
        // After 1 second, redirect to mobile.html to start SPA
        setTimeout(() => {
            console.log('Redirecting to mobile.html for SPA...');
            window.location.href = 'mobile.html';
        }, 1000);
    }

    // ---------- SPA MOBILE.HTML LOGIC ----------
    if (isMobile && window.location.pathname.includes('mobile.html')) {
        enableIframeSPA();
    }

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
                         class="tutorial-gif">
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:99999; }
            .pwa-banner { background:white; border-radius:20px; padding:30px 20px; max-width:400px; width:100%; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.3); position:relative; }
            .install-title{font-size:1.3rem;font-weight:900;margin:0 0 5px 0;}
            .install-subtitle{font-size:0.9rem;color:#666;margin:0 0 20px 0;}
            .gif-container{border-radius:15px;overflow:hidden;border:4px solid #000;}
            .tutorial-gif{width:100%;height:auto;display:block;}
            .dismiss-btn{position:absolute;top:10px;right:10px;width:40px;height:40px;font-size:2rem;border-radius:50%;border:none;background:rgba(0,0,0,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;}
            .dismiss-btn:hover{background:rgba(0,0,0,0.2);}
            .dismiss-btn:active{opacity:0.5;transform:scale(0.95);}
        `;
        document.head.appendChild(style);

        overlay.addEventListener('click', (e) => { if(e.target===overlay)dismissInstallPrompt(); });
        window.dismissInstallPrompt = function(){ overlay.remove(); console.log('Install prompt dismissed'); };
    }

    // ---------- IFRAME SPA LOGIC ----------
    function enableIframeSPA() {
        console.log('Enabling mobile SPA iframe...');

        // Fullscreen background + prevent zoom
        let style = document.createElement('style');
        style.textContent = `
            html, body { margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at center,#ff0000 0%,#8b0000 100%);}
            *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
            input,textarea{user-select:text;font-size:16px;}
            iframe#app-iframe{position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:999999;}
        `;
        document.head.appendChild(style);

        // Create iframe
        let iframe = document.createElement('iframe');
        iframe.id = 'app-iframe';
        document.body.appendChild(iframe);

        // Navigation interception
        function loadInIframe(url) {
            console.log('Loading in iframe:', url);
            iframe.src = url;
            window.history.pushState({page:url}, '', '?page='+encodeURIComponent(url));
        }

        // Intercept all clicks
        document.addEventListener('click', function(e){
            const target = e.target.closest('a, button');
            if(!target) return;
            let href = target.getAttribute('href');
            const onclick = target.getAttribute('onclick');
            if(onclick && onclick.includes('window.location')){
                const match = onclick.match(/['"`]([^'"`]+)['"`]/);
                if(match){ e.preventDefault(); loadInIframe(match[1]); }
            } else if(href && !href.startsWith('javascript:') && !href.startsWith('#')){
                e.preventDefault(); loadInIframe(href);
            }
        }, true);

        // Override window.location.href
        Object.defineProperty(window.location,'href',{set:url=>loadInIframe(url),get:()=>window.location.toString()});

        // Back button
        window.addEventListener('popstate', function(e){
            if(!e.state || !e.state.page){ iframe.src=''; } else { iframe.src=e.state.page; }
        });
    }

})();