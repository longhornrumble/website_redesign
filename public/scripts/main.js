/**
 * MyRecruiter - Main JavaScript
 * Vanilla JS for all interactive elements
 * Replaces React state management with ~100 lines of code
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // Header Scroll Effect
    // ========================================
    const header = document.getElementById('header');
    const logoDefault = document.getElementById('logo-default');
    const logoScrolled = document.getElementById('logo-scrolled');

    function handleScroll() {
        const isScrolled = window.scrollY > 50;

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

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    // ========================================
    // Mobile Menu
    // ========================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });

        // Close menu when clicking nav links
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('open');
                mobileMenu.classList.remove('open');
            });
        });
    }

    // ========================================
    // FAQ Accordion (Mobile Only)
    // ========================================
    const faqBtns = document.querySelectorAll('.faq-btn');

    faqBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Only toggle on mobile
            if (window.innerWidth < 768) {
                const faqItem = btn.closest('.faq-item');
                faqItem.classList.toggle('open');
            }
        });
    });

    // ========================================
    // Pricing Toggle
    // ========================================
    const billingMonthly = document.getElementById('billing-monthly');
    const billingAnnual = document.getElementById('billing-annual');
    const standardPrice = document.getElementById('standard-price');
    const premiumPrice = document.getElementById('premium-price');
    const standardNote = document.getElementById('standard-billing-note');
    const premiumNote = document.getElementById('premium-billing-note');
    const standardCta = document.getElementById('standard-cta');
    const premiumCta = document.getElementById('premium-cta');
    const billingMessage = document.getElementById('billing-message');

    function setPricing(isAnnual) {
        if (isAnnual) {
            standardPrice.textContent = '120';
            premiumPrice.textContent = '240';
            standardNote.classList.remove('hidden');
            premiumNote.classList.remove('hidden');
            if (standardCta) standardCta.textContent = 'Get Started — Save 20%';
            if (premiumCta) premiumCta.textContent = 'Start your 48-hour setup — Save 20%';
            if (billingMessage) billingMessage.textContent = 'Billed annually. Switch to monthly anytime.';
            // Annual active
            billingAnnual.classList.add('bg-emerald-500', 'text-white');
            billingAnnual.classList.remove('text-slate-600', 'hover:text-slate-900');
            // Monthly inactive
            billingMonthly.classList.remove('bg-emerald-500', 'text-white');
            billingMonthly.classList.add('text-slate-600', 'hover:text-slate-900');
        } else {
            standardPrice.textContent = '150';
            premiumPrice.textContent = '300';
            standardNote.classList.add('hidden');
            premiumNote.classList.add('hidden');
            if (standardCta) standardCta.textContent = 'Get Started';
            if (premiumCta) premiumCta.textContent = 'Start your 48-hour setup';
            if (billingMessage) billingMessage.textContent = 'Billed monthly. Switch to annual anytime.';
            // Monthly active
            billingMonthly.classList.add('bg-emerald-500', 'text-white');
            billingMonthly.classList.remove('text-slate-600', 'hover:text-slate-900');
            // Annual inactive
            billingAnnual.classList.remove('bg-emerald-500', 'text-white');
            billingAnnual.classList.add('text-slate-600', 'hover:text-slate-900');
        }
    }

    if (billingMonthly && billingAnnual) {
        billingMonthly.addEventListener('click', () => setPricing(false));
        billingAnnual.addEventListener('click', () => setPricing(true));
    }

    // ========================================
    // Dashboard Carousel
    // ========================================
    const carouselTabs = document.querySelectorAll('.carousel-tab');
    const carouselSlides = document.querySelectorAll('.carousel-slide');
    const carouselIndicators = document.querySelectorAll('[data-indicator]');
    const carouselContainer = document.getElementById('carousel-slides');
    let activeTab = 0;
    let touchStartX = null;

    function setActiveSlide(index) {
        activeTab = index;

        // Update tabs
        carouselTabs.forEach((tab, i) => {
            if (i === index) {
                tab.classList.add('bg-emerald-500', 'text-white', 'shadow-lg', 'shadow-emerald-500/25');
                tab.classList.remove('bg-slate-800', 'text-slate-400');
            } else {
                tab.classList.remove('bg-emerald-500', 'text-white', 'shadow-lg', 'shadow-emerald-500/25');
                tab.classList.add('bg-slate-800', 'text-slate-400');
            }
        });

        // Update indicators
        carouselIndicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.classList.add('w-8', 'bg-emerald-500');
                indicator.classList.remove('w-2', 'bg-slate-700');
            } else {
                indicator.classList.remove('w-8', 'bg-emerald-500');
                indicator.classList.add('w-2', 'bg-slate-700');
            }
        });

        // Update slides
        carouselSlides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.remove('hidden');
                // Trigger counter animations
                animateCountersInSlide(slide);
            } else {
                slide.classList.add('hidden');
            }
        });
    }

    carouselTabs.forEach((tab, i) => {
        tab.addEventListener('click', () => setActiveSlide(i));
    });

    // Swipe gesture support
    if (carouselContainer) {
        carouselContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        carouselContainer.addEventListener('touchend', (e) => {
            if (!touchStartX) return;

            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    // Swipe left - next slide
                    setActiveSlide((activeTab + 1) % 3);
                } else {
                    // Swipe right - previous slide
                    setActiveSlide((activeTab - 1 + 3) % 3);
                }
                // Scroll to slide eyebrow
                setTimeout(() => {
                    document.getElementById('slide-eyebrow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            }
            touchStartX = null;
        });
    }

    // ========================================
    // Animated Counters
    // ========================================
    function animateCounter(element, target, duration = 1500, decimals = 0) {
        let start = 0;
        const increment = target / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = decimals > 0 ? target.toFixed(decimals) : Math.floor(target).toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = decimals > 0 ? start.toFixed(decimals) : Math.floor(start).toLocaleString();
            }
        }, 16);
    }

    function animateCountersInSlide(slide) {
        const counters = slide.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = parseFloat(counter.dataset.target);
            const decimals = parseInt(counter.dataset.decimals) || 0;
            counter.textContent = '0';
            animateCounter(counter, target, 1500, decimals);
        });
    }

    // Animate counters on first visible slide
    if (carouselSlides.length > 0) {
        animateCountersInSlide(carouselSlides[0]);
    }

    // ========================================
    // Fade In Animation (IntersectionObserver)
    // ========================================
    const fadeElements = document.querySelectorAll('.fade-in');

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Get delay from style attribute if set
                const delay = entry.target.style.transitionDelay || '0ms';
                const delayMs = parseInt(delay);

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delayMs);
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => fadeObserver.observe(el));
});
