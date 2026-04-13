// ===== THEME MANAGER =====
const ThemeManager = {
    themes: {
        light: {
            name: 'Light Theme',
            icon: '☀️',
            color: '#f8f5f0',
            dot: '#c8860a'
        },
        dark: {
            name: 'Dark Theme',
            icon: '🌙',
            color: '#0d0d1a',
            dot: '#e8a020'
        },
        industrial: {
            name: 'Industrial',
            icon: '⚙️',
            color: '#2a2a2a',
            dot: '#ff6b2b'
        }
    },

    current: 'light',
    $cssLink: null,

    init() {
        // Create theme link element with jQuery
        this.$cssLink = $('#theme-css');
        if (!this.$cssLink.length) {
            this.$cssLink = $('<link>')
                .attr({
                    rel: 'stylesheet',
                    id: 'theme-css'
                })
                .prependTo($('head'));
        }

        // Load saved theme
        const saved = localStorage.getItem('rehan-theme') || 'light';
        this.apply(saved, false);

        // Bind dropdown items with jQuery
        $(document).on('click', '[data-theme]', (e) => {
            e.preventDefault();
            this.apply($(e.currentTarget).data('theme'));
        });
    },

    apply(theme, animate = true) {
        if (!this.themes[theme]) return;
        this.current = theme;

        // Swap CSS
        this.$cssLink.attr('href', `css/theme-${theme}.css`);

        // Update localStorage
        localStorage.setItem('rehan-theme', theme);

        // Update active state in dropdown with jQuery
        $('[data-theme]').each(function () {
            $(this).toggleClass('active', $(this).data('theme') === theme);
        });

        // Update toggle button text
        const $toggle = $('#theme-toggle-btn');
        if ($toggle.length) {
            $toggle.html(`${this.themes[theme].icon} ${this.themes[theme].name} <i class="fas fa-chevron-down ms-1" style="font-size:0.7rem"></i>`);
        }

        // Flash transition overlay
        if (animate) {
            const $flash = $('<div>')
                .css({
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: this.themes[theme].color,
                    opacity: 0.4,
                    pointerEvents: 'none',
                    transition: 'opacity 0.5s ease'
                })
                .appendTo($('body'));

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    $flash.css('opacity', '0');
                    setTimeout(() => $flash.remove(), 500);
                });
            });
        }

        // Swap toggler icon brightness
        const $toggler = $('.navbar-toggler');
        if ($toggler.length) {
            $toggler.css('filter', theme === 'light' ? 'none' : 'invert(1)');
        }
    }
};

// ===== NAVBAR SCROLL =====
function initNavbarScroll() {
    const $navbar = $('.navbar');
    if (!$navbar.length) return;
    $(window).on('scroll', function () {
        $navbar.toggleClass('scrolled', $(window).scrollTop() > 50);
    });
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
    const $reveals = $('.reveal');
    if (!$reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                $(entry.target).addClass('revealed');
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    $reveals.each(function () {
        observer.observe(this);
    });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    $(document).on('click', 'a[href^="#"]', function (e) {
        const $target = $($(this).attr('href'));
        if ($target.length) {
            e.preventDefault();
            const offset = 80;
            const top = $target.offset().top - offset;
            $('html, body').animate({ scrollTop: top }, 'smooth');

            // Close mobile nav
            const $navCollapse = $('#mainNav');
            if ($navCollapse.length && $navCollapse.hasClass('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance($navCollapse[0]);
                if (bsCollapse) bsCollapse.hide();
            }
        }
    });
}

// ===== ACTIVE NAV ON SCROLL =====
function initActiveNav() {
    const $sections = $('section[id]');
    const $navLinks = $('.navbar-nav .nav-link[href^="#"]');

    $(window).on('scroll', function () {
        let current = '';
        $sections.each(function () {
            const top = $(this).offset().top - 120;
            if ($(window).scrollTop() >= top) {
                current = $(this).attr('id');
            }
        });

        $navLinks.each(function () {
            $(this).toggleClass('active', $(this).attr('href') === `#${current}`);
        });
    });
}

// ===== INIT =====
$(document).ready(function () {
    ThemeManager.init();
    initNavbarScroll();
    initScrollReveal();
    initSmoothScroll();
    initActiveNav();
});