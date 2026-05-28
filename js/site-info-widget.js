'use strict';

(function() {
    const SITE_INFO_PATH = '/site-info.json';
    const WIDGET_SELECTOR = '.widget[data-type="site-info"]';
    const LEFT_COLUMN_SELECTOR = '.column-left';
    const BUSUANZI_SCRIPT_SRC = 'https://cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js';
    const TEXT = {
        menuLabel: '\u7f51\u7ad9\u4fe1\u606f',
        postCount: '\u6587\u7ae0\u6570\u76ee',
        wordCount: '\u672c\u7ad9\u603b\u5b57\u6570',
        visitorCount: '\u672c\u7ad9\u8bbf\u5ba2\u91cf',
        lastUpdatedAt: '\u6700\u540e\u66f4\u65b0\u65f6\u95f4',
        justNow: '\u521a\u521a',
        minutesAgo: '\u5206\u949f\u524d',
        hoursAgo: '\u5c0f\u65f6\u524d',
        daysAgo: '\u5929\u524d',
        monthsAgo: '\u4e2a\u6708\u524d',
        yearsAgo: '\u5e74\u524d'
    };
    let cachedSiteInfo = null;
    let pendingRequest = null;

    function formatNumber(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return '0';
        }
        return numericValue.toLocaleString('zh-CN');
    }

    function formatRelativeTime(dateString) {
        if (!dateString) {
            return '-';
        }

        const targetDate = new Date(dateString);
        const targetTimestamp = targetDate.getTime();
        if (!Number.isFinite(targetTimestamp)) {
            return '-';
        }

        if (typeof window.moment === 'function') {
            return window.moment(targetDate).fromNow();
        }

        const diffMs = Date.now() - targetTimestamp;
        const absDiffMs = Math.abs(diffMs);
        const minuteMs = 60 * 1000;
        const hourMs = 60 * minuteMs;
        const dayMs = 24 * hourMs;
        const monthMs = 30 * dayMs;
        const yearMs = 365 * dayMs;

        if (absDiffMs < minuteMs) {
            return TEXT.justNow;
        }
        if (absDiffMs < hourMs) {
            return Math.floor(absDiffMs / minuteMs) + ' ' + TEXT.minutesAgo;
        }
        if (absDiffMs < dayMs) {
            return Math.floor(absDiffMs / hourMs) + ' ' + TEXT.hoursAgo;
        }
        if (absDiffMs < monthMs) {
            return Math.floor(absDiffMs / dayMs) + ' ' + TEXT.daysAgo;
        }
        if (absDiffMs < yearMs) {
            return Math.floor(absDiffMs / monthMs) + ' ' + TEXT.monthsAgo;
        }
        return Math.floor(absDiffMs / yearMs) + ' ' + TEXT.yearsAgo;
    }

    function createWidgetElement() {
        const card = document.createElement('div');
        card.className = 'card widget';
        card.dataset.type = 'site-info';
        card.innerHTML = '' +
            '<div class="card-content">' +
            '<div class="menu">' +
            '<h3 class="menu-label">' + TEXT.menuLabel + '</h3>' +
            '<ul class="menu-list site-info-list">' +
            '<li><span class="site-info-label">' + TEXT.postCount + '</span><span class="site-info-separator">:</span><span class="site-info-value" data-field="post_count">0</span></li>' +
            '<li><span class="site-info-label">' + TEXT.wordCount + '</span><span class="site-info-separator">:</span><span class="site-info-value" data-field="word_count">0</span></li>' +
            '<li><span class="site-info-label">' + TEXT.visitorCount + '</span><span class="site-info-separator">:</span><span class="site-info-value" id="busuanzi_site_uv">0</span></li>' +
            '<li><span class="site-info-label">' + TEXT.lastUpdatedAt + '</span><span class="site-info-separator">:</span><span class="site-info-value" data-field="last_updated_at">-</span></li>' +
            '</ul>' +
            '</div>' +
            '</div>';
        return card;
    }

    function ensureWidget() {
        const leftColumn = document.querySelector(LEFT_COLUMN_SELECTOR);
        if (!leftColumn) {
            return null;
        }

        let widget = leftColumn.querySelector(WIDGET_SELECTOR);
        if (!widget) {
            widget = createWidgetElement();
        }

        const tagsWidget = leftColumn.querySelector('.widget[data-type="tags"]');
        if (tagsWidget) {
            if (tagsWidget.nextElementSibling !== widget) {
                tagsWidget.insertAdjacentElement('afterend', widget);
            }
        } else if (leftColumn.lastElementChild !== widget) {
            leftColumn.appendChild(widget);
        }

        return widget;
    }

    function ensureBusuanziLoaded() {
        const existing = document.querySelector(
            'script[data-site-info-busuanzi="1"],script[src*="busuanzi.min.js"]'
        );
        if (existing) {
            return;
        }

        const script = document.createElement('script');
        script.src = BUSUANZI_SCRIPT_SRC;
        script.defer = true;
        script.setAttribute('data-site-info-busuanzi', '1');
        script.addEventListener('load', refreshBusuanziCounter);
        document.head.appendChild(script);
    }

    function refreshBusuanziCounter() {
        try {
            if (window.BUSUANZI && typeof window.BUSUANZI.fetch === 'function') {
                window.BUSUANZI.fetch();
            }
        } catch (_e) {}
    }

    function applySiteInfo(siteInfo) {
        const widget = ensureWidget();
        if (!widget) {
            return;
        }

        const postCountEl = widget.querySelector('[data-field="post_count"]');
        const wordCountEl = widget.querySelector('[data-field="word_count"]');
        const updatedAtEl = widget.querySelector('[data-field="last_updated_at"]');

        if (postCountEl) {
            postCountEl.textContent = formatNumber(siteInfo.post_count || 0);
        }
        if (wordCountEl) {
            wordCountEl.textContent = formatNumber(siteInfo.word_count || 0);
        }
        if (updatedAtEl) {
            updatedAtEl.textContent = formatRelativeTime(siteInfo.last_updated_at);
            if (siteInfo.last_updated_at) {
                updatedAtEl.setAttribute('title', new Date(siteInfo.last_updated_at).toLocaleString('zh-CN'));
            }
        }
    }

    function fetchSiteInfo() {
        if (cachedSiteInfo) {
            return Promise.resolve(cachedSiteInfo);
        }
        if (pendingRequest) {
            return pendingRequest;
        }

        pendingRequest = fetch(SITE_INFO_PATH, { credentials: 'same-origin' })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Failed to fetch site info: ' + response.status);
                }
                return response.json();
            })
            .then(function(data) {
                cachedSiteInfo = data || {};
                return cachedSiteInfo;
            })
            .catch(function() {
                return {};
            })
            .finally(function() {
                pendingRequest = null;
            });

        return pendingRequest;
    }

    function initSiteInfoWidget() {
        const widget = ensureWidget();
        if (!widget) {
            return;
        }

        ensureBusuanziLoaded();
        refreshBusuanziCounter();
        fetchSiteInfo().then(applySiteInfo);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteInfoWidget, { once: true });
    } else {
        initSiteInfoWidget();
    }

    document.addEventListener('pjax:complete', initSiteInfoWidget);
})();
