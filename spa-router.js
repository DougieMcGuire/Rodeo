// SPA Router for Standalone Apps - prevents navigation and address bar
(function() {
    if (!window.isStandaloneApp || !window.isStandaloneApp()) {
        console.log('Not standalone, skipping SPA router');
        return;
    }

    console.log('SPA Router loading...');

    // Prevent ALL navigation
    window.addEventListener('beforeunload', (e) => {
        // This doesn't prevent navigation but at least we can track it
    });

    // Intercept ALL clicks
    document.addEventListener('click', (e) => {
        // Find if click was on a link or button that navigates
        const target = e.target.closest('a, button, [onclick]');
        if (!target) return;

        const href = target.getAttribute('href');
        const onclick = target.getAttribute('onclick');
        
        // Check if this will cause navigation
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            console.log('Intercepted navigation to:', href);
            loadPage(href);
            return false;
        }
        
        // Check onclick for window.location
        if (onclick && (onclick.includes('window.location') || onclick.includes('.href'))) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            console.log('Intercepted onclick navigation');
            // Try to extract URL from onclick
            const match = onclick.match(/['"]([^'"]+)['"]/);
            if (match) {
                loadPage(match[1]);
            }
            return false;
        }
    }, true); // Use capture phase

    // Override window.location.href
    const originalHref = Object.getOwnPropertyDescriptor(Location.prototype, 'href');
    Object.defineProperty(window.location, 'href', {
        set: function(url) {
            console.log('Intercepted window.location.href =', url);
            if (url.includes('index.html') || url === '/' || url.startsWith('#')) {
                originalHref.set.call(this, url);
            } else {
                loadPage(url);
            }
        },
        get: function() {
            return originalHref.get.call(this);
        }
    });

    // Create page container
    let pageContainer = document.getElementById('spa-container');
    if (!pageContainer) {
        pageContainer = document.createElement('div');
        pageContainer.id = 'spa-container';
        pageContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, #ff0000 0%, #8b0000 100%);
            z-index: 999998;
            display: none;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        `;
        document.body.appendChild(pageContainer);
    }

    async function loadPage(url) {
        console.log('Loading page:', url);
        
        // Show container
        pageContainer.style.display = 'block';
        pageContainer.innerHTML = '<div style="text-align:center;padding:50px;color:white;font-size:2rem;">Loading...</div>';
        
        // Hide original content
        const originalContent = document.querySelector('.container');
        if (originalContent) {
            originalContent.style.display = 'none';
        }

        try {
            // Fetch the page
            const response = await fetch(url);
            const html = await response.text();
            
            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract body content
            const newContent = doc.querySelector('.container') || doc.body;
            
            // Inject content
            pageContainer.innerHTML = newContent.innerHTML;
            
            // Execute any scripts in the new content
            const scripts = doc.querySelectorAll('script');
            scripts.forEach(script => {
                if (script.src) {
                    // External script
                    const newScript = document.createElement('script');
                    newScript.src = script.src;
                    document.head.appendChild(newScript);
                } else {
                    // Inline script
                    try {
                        eval(script.textContent);
                    } catch (e) {
                        console.error('Script error:', e);
                    }
                }
            });
            
            // Update URL without navigation
            window.history.pushState({}, '', url);
            
        } catch (error) {
            console.error('Failed to load page:', error);
            pageContainer.innerHTML = `
                <div style="text-align:center;padding:50px;color:white;">
                    <h2>Error Loading Page</h2>
                    <button onclick="location.reload()" style="padding:15px 30px;font-size:1.2rem;margin-top:20px;">Reload App</button>
                </div>
            `;
        }
    }

    // Handle back button
    window.addEventListener('popstate', () => {
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            // Going back to index
            pageContainer.style.display = 'none';
            const originalContent = document.querySelector('.container');
            if (originalContent) {
                originalContent.style.display = '';
            }
        } else {
            loadPage(window.location.pathname);
        }
    });

    console.log('SPA Router ready!');
})();