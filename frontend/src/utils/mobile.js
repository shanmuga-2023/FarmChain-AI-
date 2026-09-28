// mobile.js
// Handles mobile-specific UI logic (hamburger menu, sidebar toggle, etc.)

export function initMobileUI() {
  const setupMobileNavigation = () => {
    // Only apply if the screen is mobile sized or if we want to ensure the DOM is ready
    const header = document.querySelector('.dashboard-header') || document.querySelector('.app-header') || document.querySelector('.topbar');
    const sidebar = document.querySelector('.saas-sidebar') || document.querySelector('.sidebar') || document.querySelector('.desktop-sidebar');
    
    if (header && sidebar) {
      // Check if hamburger already exists
      if (!document.querySelector('.hamburger-btn')) {
        const hamburgerBtn = document.createElement('button');
        hamburgerBtn.className = 'hamburger-btn';
        hamburgerBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>';
        hamburgerBtn.setAttribute('aria-label', 'Toggle navigation menu');
        
        // Find a place to insert the hamburger button
        // Usually at the start of the header
        header.insertBefore(hamburgerBtn, header.firstChild);
        
        // Add overlay if it doesn't exist
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'sidebar-overlay';
          // Insert after sidebar
          sidebar.parentNode.insertBefore(overlay, sidebar.nextSibling);
        }

        const toggleSidebar = () => {
          sidebar.classList.toggle('active');
          document.body.classList.toggle('mobile-drawer-open');
        };

        hamburgerBtn.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', () => {
          sidebar.classList.remove('active');
          document.body.classList.remove('mobile-drawer-open');
        });

        // Add close button inside sidebar if there isn't one
        const sidebarHeader = sidebar.querySelector('.sidebar-header');
        if (sidebarHeader && !sidebarHeader.querySelector('.sidebar-close-btn')) {
          const closeBtn = document.createElement('button');
          closeBtn.className = 'sidebar-close-btn';
          closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
          closeBtn.style.cssText = 'background:transparent; border:none; color:var(--text-primary); cursor:pointer; margin-left:auto; display:none; align-items:center; justify-content:center;';
          
          // Show close button only on mobile (handled in css)
          const style = document.createElement('style');
          style.textContent = `@media(max-width:768px) { .sidebar-close-btn { display:block !important; } }`;
          document.head.appendChild(style);

          closeBtn.addEventListener('click', toggleSidebar);
          sidebarHeader.appendChild(closeBtn);
        }

        // Close sidebar on link click (for SPA navigation)
        const links = sidebar.querySelectorAll('a, button[data-route]');
        links.forEach(link => {
          link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
              sidebar.classList.remove('active');
              document.body.classList.remove('mobile-drawer-open');
            }
          });
        });
      }
    }
  };

  // Run immediately and also on DOM mutations (since the router might re-render the page)
  setupMobileNavigation();
  
  const observer = new MutationObserver((mutations) => {
    // Only re-run if a header or sidebar might have been added
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        setupMobileNavigation();
        break;
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
