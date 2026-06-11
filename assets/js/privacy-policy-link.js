/**
 * Privacy Policy Link Handler
 * Ensures footer privacy policy links are properly connected
 */

(function() {
  function setupPrivacyLinks() {
    // Find all privacy policy links
    const privacyLinks = document.querySelectorAll('a[href*="privacy"], a[data-privacy], .privacy-link');
    
    privacyLinks.forEach(link => {
      // Set correct href if not already set
      if (!link.getAttribute('href') || link.getAttribute('href').includes('#')) {
        link.setAttribute('href', '/privacy-policy.html');
      }
      
      // Add attributes for accessibility
      link.setAttribute('title', 'Privacy Policy - SecDelta');
      if (!link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', 'View our Privacy Policy');
      }
    });

    // Also handle dynamically added content
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(function(node) {
            if (node.querySelectorAll) {
              const newLinks = node.querySelectorAll('a[href*="privacy"], a[data-privacy]');
              newLinks.forEach(link => {
                if (!link.getAttribute('href') || link.getAttribute('href').includes('#')) {
                  link.setAttribute('href', '/privacy-policy.html');
                }
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPrivacyLinks);
  } else {
    setupPrivacyLinks();
  }
})();
