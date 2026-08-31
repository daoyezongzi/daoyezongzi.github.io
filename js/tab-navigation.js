'use strict';

(function() {
    function switchTab() {
        const hash = window.location.hash;
        if (!hash || hash === '#') {
            return;
        }

        const tab = Array.from(document.querySelectorAll('.tabs a'))
            .find(function(menu) { return menu.getAttribute('href') === hash; });
        if (!tab || !tab.parentElement || !tab.parentElement.parentElement) {
            return;
        }

        const tabMenuContainer = tab.parentElement.parentElement;
        Array.from(tabMenuContainer.children).forEach(function(menu) {
            menu.classList.remove('is-active');
        });
        Array.from(tabMenuContainer.querySelectorAll('a'))
            .map(function(menu) {
                const href = menu.getAttribute('href');
                return href && href.startsWith('#')
                    ? document.getElementById(href.substring(1))
                    : null;
            })
            .filter(Boolean)
            .forEach(function(content) { content.classList.add('is-hidden'); });

        tab.parentElement.classList.add('is-active');
        const activeTab = document.getElementById(hash.substring(1));
        if (activeTab) {
            activeTab.classList.remove('is-hidden');
        }
    }

    switchTab();
    window.addEventListener('hashchange', switchTab, false);
}());
