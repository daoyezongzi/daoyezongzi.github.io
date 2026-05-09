'use strict';

(function() {
    const categoryPostCache = new Map();
    const POST_LIST_FADE_MS = 500;

    function getDirectChildByTag(element, tagName) {
        const targetTag = tagName.toUpperCase();
        for (let i = 0; i < element.children.length; i += 1) {
            const child = element.children[i];
            if (child.tagName === targetTag) {
                return child;
            }
        }
        return null;
    }

    function getDirectAnchor(element) {
        for (let i = 0; i < element.children.length; i += 1) {
            const child = element.children[i];
            if (child.tagName === 'A') {
                return child;
            }
        }
        return null;
    }

    function getDirectPostList(element) {
        for (let i = 0; i < element.children.length; i += 1) {
            const child = element.children[i];
            if (child.tagName === 'UL' && child.classList.contains('category-post-list')) {
                return child;
            }
        }
        return null;
    }

    function removeDirectSubCategoryList(element) {
        const child = getDirectChildByTag(element, 'ul');
        if (child && !child.classList.contains('category-post-list')) {
            child.remove();
        }
    }

    function clearHideTimer(postList) {
        if (postList.__hideTimerId) {
            window.clearTimeout(postList.__hideTimerId);
            postList.__hideTimerId = null;
        }
    }

    function expandPostList(postList) {
        clearHideTimer(postList);
        postList.hidden = false;
        postList.setAttribute('aria-hidden', 'false');
        postList.classList.remove('is-hiding');
        requestAnimationFrame(function() {
            postList.classList.add('is-visible');
        });
    }

    function collapsePostList(postList) {
        clearHideTimer(postList);
        postList.setAttribute('aria-hidden', 'true');
        postList.classList.remove('is-visible');
        postList.classList.add('is-hiding');
        postList.__hideTimerId = window.setTimeout(function() {
            postList.hidden = true;
            postList.classList.remove('is-hiding');
            postList.__hideTimerId = null;
        }, POST_LIST_FADE_MS);
    }

    function setExpandedState(node, anchor, expanded) {
        const postList = getDirectPostList(node);
        node.classList.toggle('is-expanded', expanded);
        node.classList.toggle('is-collapsed', !expanded);
        anchor.setAttribute('aria-expanded', String(expanded));
        if (postList) {
            if (expanded) {
                expandPostList(postList);
            } else {
                collapsePostList(postList);
            }
        }
    }

    function normalizePostList(posts) {
        const unique = new Map();
        posts.forEach(function(post) {
            if (!post || typeof post.href !== 'string' || typeof post.title !== 'string') {
                return;
            }
            const href = post.href.trim();
            const title = post.title.trim();
            if (!href || !title || unique.has(href)) {
                return;
            }
            unique.set(href, { href: href, title: title });
        });
        return Array.from(unique.values());
    }

    function parseCategoryPosts(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const anchors = doc.querySelectorAll('.column-main article .title a');
        const posts = [];
        anchors.forEach(function(anchor) {
            posts.push({
                href: anchor.getAttribute('href') || '',
                title: anchor.textContent || ''
            });
        });
        return normalizePostList(posts);
    }

    async function fetchCategoryPosts(categoryUrl) {
        const resolvedUrl = new URL(categoryUrl, window.location.href).toString();
        if (!categoryPostCache.has(resolvedUrl)) {
            const request = fetch(resolvedUrl, { credentials: 'same-origin' })
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('Failed to load category page: ' + response.status);
                    }
                    return response.text();
                })
                .then(parseCategoryPosts)
                .catch(function() {
                    return [];
                });
            categoryPostCache.set(resolvedUrl, request);
        }
        return categoryPostCache.get(resolvedUrl);
    }

    function createPostList(posts) {
        const postList = document.createElement('ul');
        postList.className = 'category-post-list';

        if (!posts.length) {
            const item = document.createElement('li');
            item.className = 'category-post-item is-empty';
            item.textContent = '暂无文章';
            postList.appendChild(item);
            return postList;
        }

        posts.forEach(function(post) {
            const item = document.createElement('li');
            item.className = 'category-post-item';

            const link = document.createElement('a');
            link.href = post.href;
            link.textContent = post.title;

            item.appendChild(link);
            postList.appendChild(item);
        });

        return postList;
    }

    async function onCategoryClick(event, node, anchor) {
        if (event.defaultPrevented || event.button !== 0) {
            return;
        }
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        event.preventDefault();

        if (node.classList.contains('is-loading')) {
            return;
        }

        const existingPostList = getDirectPostList(node);
        if (existingPostList) {
            const expanded = node.classList.contains('is-expanded');
            setExpandedState(node, anchor, !expanded);
            return;
        }

        node.classList.add('is-loading');
        const posts = await fetchCategoryPosts(anchor.href);
        const postList = createPostList(posts);
        postList.hidden = true;
        node.appendChild(postList);
        node.classList.remove('is-loading');
        setExpandedState(node, anchor, true);
    }

    function setupCategoryNode(node) {
        const anchor = getDirectAnchor(node);
        if (!anchor) {
            return;
        }

        removeDirectSubCategoryList(node);
        node.classList.add('category-title-node', 'is-collapsed');
        anchor.setAttribute('aria-expanded', 'false');

        if (anchor.dataset.categoryTitleBound === '1') {
            return;
        }

        anchor.dataset.categoryTitleBound = '1';
        anchor.addEventListener('click', function(event) {
            onCategoryClick(event, node, anchor);
        });
    }

    function initCategoryTitleList() {
        const roots = document.querySelectorAll('.widget[data-type="categories"] .menu-list');
        roots.forEach(function(root) {
            for (let i = 0; i < root.children.length; i += 1) {
                const node = root.children[i];
                if (node.tagName === 'LI') {
                    setupCategoryNode(node);
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCategoryTitleList, { once: true });
    } else {
        initCategoryTitleList();
    }

    document.addEventListener('pjax:complete', initCategoryTitleList);
})();
