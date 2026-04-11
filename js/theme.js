/* ===========================
   THEME SWITCHER
   js/theme.js
   =========================== */
(function () {
    const THEME_KEY = 'rc_theme';
    const THEMES = {
        dark: 'css/theme-dark.css',
        light: 'css/theme-light.css',
        amber: 'css/theme-amber.css'
    };

    function applyTheme(theme) {
        if (!THEMES[theme]) theme = 'dark';
        // Update stylesheet
        const sheet = document.getElementById('theme-stylesheet');
        if (sheet) sheet.href = THEMES[theme];
        // Save preference
        localStorage.setItem(THEME_KEY, theme);
        // Update all toggle UIs
        updateUI(theme);
    }

    function updateUI(theme) {
        // Dropdown items
        document.querySelectorAll('.theme-option').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === theme);
        });
        // Theme pills
        document.querySelectorAll('.theme-pill').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === theme);
        });
    }

    function getSavedTheme() {
        return localStorage.getItem(THEME_KEY) || 'dark';
    }

    // Init on DOM ready
    document.addEventListener('DOMContentLoaded', function () {
        applyTheme(getSavedTheme());

        // Dropdown option clicks
        document.addEventListener('click', function (e) {
            const option = e.target.closest('.theme-option');
            if (option && option.dataset.theme) {
                e.preventDefault();
                applyTheme(option.dataset.theme);
            }
            const pill = e.target.closest('.theme-pill');
            if (pill && pill.dataset.theme) {
                e.preventDefault();
                applyTheme(pill.dataset.theme);
            }
        });
    });

    // Expose globally
    window.applyTheme = applyTheme;
})();