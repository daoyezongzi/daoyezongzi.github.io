'use strict';

(function() {
    const SITE_INFO_PATH = '/site-info.json';
    const WIDGET_SELECTOR = '.widget[data-type="site-info"]';
    const LEFT_COLUMN_SELECTOR = '.column-left';
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

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        const menu = document.createElement('div');
        menu.className = 'menu';
        const menuLabel = document.createElement('h3');
        menuLabel.className = 'menu-label';
        menuLabel.textContent = TEXT.menuLabel;
        const list = document.createElement('ul');
        list.className = 'menu-list site-info-list';

        function addRow(label, field, initialValue) {
            const item = document.createElement('li');
            const labelElement = document.createElement('span');
            labelElement.className = 'site-info-label';
            labelElement.textContent = label;
            const separator = document.createElement('span');
            separator.className = 'site-info-separator';
            separator.textContent = ':';
            const valueElement = document.createElement('span');
            valueElement.className = 'site-info-value';
            valueElement.dataset.field = field;
            valueElement.textContent = initialValue;
            item.appendChild(labelElement);
            item.appendChild(separator);
            item.appendChild(valueElement);
            list.appendChild(item);
        }

        addRow(TEXT.postCount, 'post_count', '0');
        addRow(TEXT.wordCount, 'word_count', '0');
        addRow(TEXT.visitorCount, 'visitor_count', '-');
        addRow(TEXT.lastUpdatedAt, 'last_updated_at', '-');
        menu.appendChild(menuLabel);
        menu.appendChild(list);
        cardContent.appendChild(menu);
        card.appendChild(cardContent);
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

        fetchSiteInfo().then(applySiteInfo);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteInfoWidget, { once: true });
    } else {
        initSiteInfoWidget();
    }

    document.addEventListener('pjax:complete', initSiteInfoWidget);
})();
