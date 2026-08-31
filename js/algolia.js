/* global instantsearch, algoliasearch */
// eslint-disable-next-line no-unused-vars
function loadAlgolia(config, translation) {
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function safeUrl(value) {
    try {
      const parsed = new URL(String(value == null ? '' : value), window.location.href);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '#';
    } catch (error) {
      return '#';
    }
  }

  const search = instantsearch({
    indexName: config.indexName,
    searchClient: algoliasearch(config.applicationId, config.apiKey),
  });

  search.addWidgets([
    instantsearch.widgets.configure({
      attributesToSnippet: ['excerpt'],
    }),
  ]);

  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#algolia-input',
      placeholder: translation.hint,
      showReset: false,
      showSubmit: false,
      showLoadingIndicator: false,
      cssClasses: {
        root: 'searchbox-input-container',
        form: 'searchbox-input-container',
        input: 'searchbox-input',
      },
    }),
  );

  search.addWidget(
    instantsearch.widgets.poweredBy({
      container: '#algolia-poweredby',
    }),
  );

  search.addWidget(
    instantsearch.widgets.hits({
      container: '.searchbox-body',
      escapeHTML: true,
      cssClasses: {
        root: 'searchbox-result-container',
        emptyRoot: ['searchbox-result-item', 'disabled'],
      },
      templates: {
        empty: function (results) {
          return translation.no_result + ': ' + escapeHtml(results.query);
        },
        item: function (hit) {
          let title = instantsearch.highlight({ attribute: 'title', hit });
          let excerpt = instantsearch.highlight({ attribute: 'excerpt', hit });
          title = title ? title : translation.untitled;
          excerpt = excerpt
            .replace(new RegExp('<em>', 'ig'), '[algolia-highlight]')
            .replace(new RegExp('</em>', 'ig'), '[/algolia-highlight]')
            .replace(/(<([^>]+)>)/gi, '')
            .replace(/(\[algolia-highlight\])/gi, '<em>')
            .replace(/(\[\/algolia-highlight\])/gi, '</em>');
          excerpt = excerpt ? excerpt : translation.empty_preview;
          const safeLink = escapeHtml(safeUrl(hit.permalink));
          return `<section class="searchbox-result-section">
                        <a class="searchbox-result-item" href="${safeLink}">
                            <span class="searchbox-result-content">
                                <span class="searchbox-result-title">${title}</span>
                                <span class="searchbox-result-preview">${excerpt}</span>
                            </span>
                        </a>
                    </section>`;
        },
      },
    }),
  );

  search.addWidget(
    instantsearch.widgets.pagination({
      container: '.searchbox-footer',
      cssClasses: {
        list: 'searchbox-pagination',
        item: 'searchbox-pagination-item',
        link: 'searchbox-pagination-link',
        selectedItem: 'active',
        disabledItem: 'disabled',
      },
    }),
  );

  search.start();

  if (location.hash.trim() === '#algolia-search') {
    $('.searchbox').addClass('show');
  }

  $(document)
    .on('click', '.navbar-main .search', () => {
      $('.searchbox').toggleClass('show');
      $('.searchbox-input').focus();
    })
    .on('click', '.searchbox .searchbox-mask', () => {
      $('.searchbox').removeClass('show');
    })
    .on('click', '.searchbox-close', () => {
      $('.searchbox').removeClass('show');
    });
}
