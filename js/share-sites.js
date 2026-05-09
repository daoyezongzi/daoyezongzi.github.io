'use strict';

(function() {
    const shareSites = ['weibo', 'qq', 'wechat', 'qzone', 'linkedin', 'facebook', 'twitter', 'google'];
    const maxRetries = 20;
    const retryDelayMs = 250;

    function setDataSites() {
        const containers = document.querySelectorAll('.social-share');
        if (!containers.length) {
            return false;
        }

        containers.forEach(function(container) {
            container.setAttribute('data-sites', shareSites.join(','));
        });
        return true;
    }

    function initShareSitesWithRetry(retryCount) {
        const hasShareContainer = setDataSites();
        if (!hasShareContainer) {
            return;
        }

        if (typeof window.socialShare === 'function') {
            document.querySelectorAll('.social-share').forEach(function(container) {
                container.innerHTML = '';
            });
            window.socialShare('.social-share', { sites: shareSites });
            return;
        }

        if (retryCount < maxRetries) {
            window.setTimeout(function() {
                initShareSitesWithRetry(retryCount + 1);
            }, retryDelayMs);
        }
    }

    function applyShareSites() {
        initShareSitesWithRetry(0);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyShareSites, { once: true });
    } else {
        applyShareSites();
    }

    document.addEventListener('pjax:complete', applyShareSites);
})();
