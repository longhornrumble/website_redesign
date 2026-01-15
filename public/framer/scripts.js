// MyRecruiter Header/Footer Scripts for Framer
(function() {
    const header = document.getElementById('mr-header');
    const logoDefault = document.getElementById('mr-logo-default');
    const logoScrolled = document.getElementById('mr-logo-scrolled');
    const menuBtn = document.getElementById('mr-mobile-menu-btn');
    const mobileMenu = document.getElementById('mr-mobile-menu');
    let isScrolled = false;

    function handleScroll() {
        const shouldBeScrolled = window.scrollY > 50;
        if (shouldBeScrolled !== isScrolled) {
            isScrolled = shouldBeScrolled;
            if (isScrolled) {
                header.classList.add('scrolled');
                logoDefault.classList.add('hidden');
                logoScrolled.classList.remove('hidden');
            } else {
                header.classList.remove('scrolled');
                logoDefault.classList.remove('hidden');
                logoScrolled.classList.add('hidden');
            }
        }
    }

    function toggleMenu() {
        const isOpen = menuBtn.classList.contains('open');
        if (isOpen) {
            menuBtn.classList.remove('open');
            mobileMenu.classList.remove('open');
        } else {
            menuBtn.classList.add('open');
            mobileMenu.classList.add('open');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    if (menuBtn) menuBtn.addEventListener('click', toggleMenu);

    document.querySelectorAll('.mr-mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('open');
            mobileMenu.classList.remove('open');
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuBtn.classList.contains('open')) {
            menuBtn.classList.remove('open');
            mobileMenu.classList.remove('open');
        }
    });
})();
