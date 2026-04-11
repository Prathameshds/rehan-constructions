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
    cssLink: null,

    init() {
        // Create theme link element
        this.cssLink = document.getElementById('theme-css');
        if (!this.cssLink) {
            this.cssLink = document.createElement('link');
            this.cssLink.rel = 'stylesheet';
            this.cssLink.id = 'theme-css';
            document.head.prepend(this.cssLink);
        }

        // Load saved theme
        const saved = localStorage.getItem('rehan-theme') || 'light';
        this.apply(saved, false);

        // Bind dropdown items
        document.querySelectorAll('[data-theme]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.apply(el.dataset.theme);
            });
        });
    },

    apply(theme, animate = true) {
        if (!this.themes[theme]) return;
        this.current = theme;

        // Swap CSS
        this.cssLink.href = `css/theme-${theme}.css`;

        // Update localStorage
        localStorage.setItem('rehan-theme', theme);

        // Update active state in dropdown
        document.querySelectorAll('[data-theme]').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === theme);
        });

        // Update toggle button text
        const toggle = document.getElementById('theme-toggle-btn');
        if (toggle) {
            toggle.innerHTML = `${this.themes[theme].icon} ${this.themes[theme].name} <i class="fas fa-chevron-down ms-1" style="font-size:0.7rem"></i>`;
        }

        // Flash transition overlay
        if (animate) {
            const flash = document.createElement('div');
            flash.style.cssText = `
        position:fixed; inset:0; z-index:9999;
        background:${this.themes[theme].color};
        opacity:0.4; pointer-events:none;
        transition: opacity 0.5s ease;
      `;
            document.body.appendChild(flash);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    flash.style.opacity = '0';
                    setTimeout(() => flash.remove(), 500);
                });
            });
        }

        // Swap toggler icon brightness
        const toggler = document.querySelector('.navbar-toggler');
        if (toggler) {
            toggler.style.filter = (theme === 'light') ? 'none' : 'invert(1)';
        }
    }
};

// ===== NAVBAR SCROLL =====
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    reveals.forEach(el => observer.observe(el));
}


// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });

                // Close mobile nav
                const navCollapse = document.getElementById('mainNav');
                if (navCollapse && navCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                    if (bsCollapse) bsCollapse.hide();
                }
            }
        });
    });
}

// ===== ACTIVE NAV ON SCROLL =====
function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(sec => {
            const top = sec.offsetTop - 120;
            if (window.scrollY >= top) current = sec.getAttribute('id');
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    initNavbarScroll();
    initScrollReveal();

    initSmoothScroll();
    initActiveNav();
});