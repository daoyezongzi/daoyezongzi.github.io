'use strict';

(function() {
    const TRANSITION_MS = 220;
    const READY_CLASS = 'page-transition-ready';
    const LEAVING_CLASS = 'page-transition-leaving';

    function markReady() {
        document.body.classList.add(READY_CLASS);
        document.body.classList.remove(LEAVING_CLASS);
    }

    function isInternalNavigableLink(anchor) {
        if (!anchor) {
            return false;
        }
        if (anchor.target && anchor.target.toLowerCase() === '_blank') {
            return false;
        }
        if (anchor.hasAttribute('download')) {
            return false;
        }

        const hrefAttr = anchor.getAttribute('href');
        if (!hrefAttr ||
            hrefAttr.startsWith('#') ||
            hrefAttr.startsWith('javascript:') ||
            hrefAttr.startsWith('mailto:') ||
            hrefAttr.startsWith('tel:')) {
            return false;
        }

        let nextUrl;
        try {
            nextUrl = new URL(anchor.href, window.location.href);
        } catch (error) {
            return false;
        }

        if (nextUrl.origin !== window.location.origin) {
            return false;
        }
        if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) {
            return false;
        }

        return true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', markReady, { once: true });
    } else {
        markReady();
    }

    window.addEventListener('pageshow', markReady);

    document.addEventListener('click', function(event) {
        if (event.defaultPrevented || event.button !== 0) {
            return;
        }
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const anchor = event.target.closest('a');
        if (!isInternalNavigableLink(anchor)) {
            return;
        }

        event.preventDefault();
        document.body.classList.add(LEAVING_CLASS);
        window.setTimeout(function() {
            window.location.href = anchor.href;
        }, TRANSITION_MS);
    });
})();
