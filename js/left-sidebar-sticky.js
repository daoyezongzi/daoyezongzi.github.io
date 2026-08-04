(function() {
    const SIDEBAR_SELECTOR = '.column-left.is-sticky';
    const DESKTOP_QUERY = '(min-width: 769px)';
    const GAP_REM = 0.75;

    function getGapPx() {
        const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
        if (Number.isNaN(rootFontSize)) {
            return 12;
        }
        return rootFontSize * GAP_REM;
    }

    function updateLeftSidebarStickyTop() {
        const sidebar = document.querySelector(SIDEBAR_SELECTOR);
        if (!sidebar) {
            return;
        }

        if (!window.matchMedia(DESKTOP_QUERY).matches) {
            sidebar.style.removeProperty('--left-sidebar-sticky-top');
            return;
        }

        const gap = getGapPx();
        const sidebarHeight = sidebar.offsetHeight;
        const availableHeight = window.innerHeight - gap * 2;
        const stickyTop = sidebarHeight > availableHeight
            ? window.innerHeight - sidebarHeight - gap
            : gap;

        sidebar.style.setProperty('--left-sidebar-sticky-top', stickyTop + 'px');
    }

    function scheduleUpdate() {
        window.requestAnimationFrame(updateLeftSidebarStickyTop);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateLeftSidebarStickyTop);
    } else {
        updateLeftSidebarStickyTop();
    }

    window.addEventListener('load', updateLeftSidebarStickyTop);
    window.addEventListener('resize', scheduleUpdate);
}());
