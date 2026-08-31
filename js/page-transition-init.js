'use strict';

(function() {
    try {
        if (sessionStorage.getItem('page_transition_entering') === '1') {
            document.documentElement.classList.add('page-transition-entering');
            window.setTimeout(function() {
                document.documentElement.classList.remove('page-transition-entering');
                try {
                    sessionStorage.removeItem('page_transition_entering');
                } catch (_error) {}
            }, 2000);
        }
    } catch (_error) {}
}());
