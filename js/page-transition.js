'use strict';

(function() {
    const TRANSITION_MS = 420;
    const READY_CLASS = 'page-transition-ready';
    const LEAVING_CLASS = 'page-transition-leaving';
    const ENTERING_CLASS = 'page-transition-entering';
    const ENTERING_FLAG_KEY = 'page_transition_entering';
    const prefetchRequestCache = new Map();
    let isNavigating = false;

    function setEnteringFlag() {
        try {
            sessionStorage.setItem(ENTERING_FLAG_KEY, '1');
        } catch (error) {}
    }

    function clearEnteringFlag() {
        try {
            sessionStorage.removeItem(ENTERING_FLAG_KEY);
        } catch (error) {}
    }

    function markReady() {
        const body = document.body;
        const root = document.documentElement;
        if (!body) {
            return;
        }

        body.classList.remove(LEAVING_CLASS);
        clearEnteringFlag();
        if (body.classList.contains(READY_CLASS)) {
            return;
        }

        window.requestAnimationFrame(function() {
            body.classList.add(READY_CLASS);
            root.classList.remove(ENTERING_CLASS);
        });
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

    function getResolvedUrl(href) {
        try {
            return new URL(href, window.location.href).toString();
        } catch (error) {
            return '';
        }
    }

    function prefetchPage(url) {
        if (!url || prefetchRequestCache.has(url) || typeof window.fetch !== 'function') {
            return;
        }

        const request = fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'force-cache'
        })
            .then(function() {
                return null;
            })
            .catch(function() {
                return null;
            });

        prefetchRequestCache.set(url, request);
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

        if (isNavigating) {
            event.preventDefault();
            return;
        }

        const nextUrl = getResolvedUrl(anchor.href);
        if (!nextUrl) {
            return;
        }

        event.preventDefault();
        isNavigating = true;
        setEnteringFlag();
        prefetchPage(nextUrl);
        document.body.classList.add(LEAVING_CLASS);
        window.setTimeout(function() {
            window.location.href = nextUrl;
        }, TRANSITION_MS);
    });
})();
