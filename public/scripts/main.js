/**
 * MyRecruiter - Main JavaScript
 * Vanilla JS for all interactive elements
 */

// ========================================
// Constants
// ========================================
const SCROLL_THRESHOLD = 50;
const SWIPE_THRESHOLD = 50;
const ANIMATION_DURATION = 1500;
const FADE_IN_THRESHOLD = 0.1;
const SETUP_ANIMATION_THRESHOLD = 0.2;

document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // Header Scroll Effect
    // ========================================
    const header = document.getElementById('header');
    const logoDefault = document.getElementById('logo-default');
    const logoScrolled = document.getElementById('logo-scrolled');

    function handleScroll() {
        const isScrolled = window.scrollY > SCROLL_THRESHOLD;

        if (isScrolled) {
            header?.classList.add('scrolled');
            logoDefault?.classList.add('hidden');
            logoScrolled?.classList.remove('hidden');
        } else {
            header?.classList.remove('scrolled');
            logoDefault?.classList.remove('hidden');
            logoScrolled?.classList.add('hidden');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    // ========================================
    // Mobile Menu with Focus Trapping
    // ========================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    /**
     * Closes the mobile menu and restores focus
     */
    function closeMobileMenu() {
        mobileMenuBtn?.classList.remove('open');
        mobileMenu?.classList.remove('open');
        mobileMenuBtn?.setAttribute('aria-expanded', 'false');
        mobileMenuBtn?.focus();
    }

    /**
     * Opens the mobile menu and sets up focus trapping
     */
    function openMobileMenu() {
        mobileMenuBtn?.classList.add('open');
        mobileMenu?.classList.add('open');
        mobileMenuBtn?.setAttribute('aria-expanded', 'true');

        // Focus first link in menu
        const firstLink = mobileMenu?.querySelector('a');
        firstLink?.focus();
    }

    if (mobileMenuBtn && mobileMenu) {
        // Set initial ARIA state
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-controls', 'mobile-menu');

        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = mobileMenuBtn.classList.contains('open');
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        // Close menu when clicking nav links
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenuBtn.classList.contains('open')) {
                closeMobileMenu();
            }
        });

        // Focus trapping within mobile menu
        mobileMenu.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            const focusableElements = mobileMenu.querySelectorAll(
                'a[href], button:not([disabled])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
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
                faqItem?.classList.toggle('open');
            }
        });
    });

    // ========================================
    // Pricing Toggle with ARIA
    // ========================================
    const billingMonthly = document.getElementById('billing-monthly');
    const billingAnnual = document.getElementById('billing-annual');
    const standardPrice = document.getElementById('standard-price');
    const premiumPrice = document.getElementById('premium-price');
    const standardNote = document.getElementById('standard-billing-note');
    const premiumNote = document.getElementById('premium-billing-note');
    const standardCta = document.getElementById('standard-cta');
    const premiumCtaSave = document.getElementById('premium-cta-save');
    const billingMessage = document.getElementById('billing-message');

    /**
     * Updates pricing display and ARIA states based on billing period
     * @param {boolean} isAnnual - Whether annual billing is selected
     */
    function setPricing(isAnnual) {
        // Update ARIA states
        billingMonthly?.setAttribute('aria-checked', (!isAnnual).toString());
        billingAnnual?.setAttribute('aria-checked', isAnnual.toString());

        if (isAnnual) {
            if (standardPrice) standardPrice.textContent = '120';
            if (premiumPrice) premiumPrice.textContent = '240';
            standardNote?.classList.remove('hidden');
            premiumNote?.classList.remove('hidden');
            if (standardCta) standardCta.textContent = 'Get Started — Save 20%';
            premiumCtaSave?.classList.remove('hidden');
            if (billingMessage) billingMessage.textContent = 'Billed annually. Switch to monthly anytime.';
            // Annual active
            billingAnnual?.classList.add('bg-emerald-500', 'text-white');
            billingAnnual?.classList.remove('text-slate-600', 'hover:text-slate-900');
            // Monthly inactive
            billingMonthly?.classList.remove('bg-emerald-500', 'text-white');
            billingMonthly?.classList.add('text-slate-600', 'hover:text-slate-900');
        } else {
            if (standardPrice) standardPrice.textContent = '150';
            if (premiumPrice) premiumPrice.textContent = '300';
            standardNote?.classList.add('hidden');
            premiumNote?.classList.add('hidden');
            if (standardCta) standardCta.textContent = 'Get Started';
            premiumCtaSave?.classList.add('hidden');
            if (billingMessage) billingMessage.textContent = 'Billed monthly. Switch to annual anytime.';
            // Monthly active
            billingMonthly?.classList.add('bg-emerald-500', 'text-white');
            billingMonthly?.classList.remove('text-slate-600', 'hover:text-slate-900');
            // Annual inactive
            billingAnnual?.classList.remove('bg-emerald-500', 'text-white');
            billingAnnual?.classList.add('text-slate-600', 'hover:text-slate-900');
        }
    }

    if (billingMonthly && billingAnnual) {
        // Set initial ARIA states
        billingMonthly.setAttribute('role', 'radio');
        billingMonthly.setAttribute('aria-checked', 'true');
        billingAnnual.setAttribute('role', 'radio');
        billingAnnual.setAttribute('aria-checked', 'false');

        billingMonthly.addEventListener('click', () => setPricing(false));
        billingAnnual.addEventListener('click', () => setPricing(true));

        // Keyboard navigation for radio group
        [billingMonthly, billingAnnual].forEach(btn => {
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const isMonthlyFocused = document.activeElement === billingMonthly;
                    if (isMonthlyFocused) {
                        billingAnnual.focus();
                        setPricing(true);
                    } else {
                        billingMonthly.focus();
                        setPricing(false);
                    }
                }
            });
        });
    }

    // ========================================
    // Stripe Checkout
    // ========================================
    const checkoutBtns = document.querySelectorAll('.checkout-btn');
    let isAnnualBilling = false;

    // Track billing state for checkout
    if (billingMonthly && billingAnnual) {
        billingMonthly.addEventListener('click', () => { isAnnualBilling = false; });
        billingAnnual.addEventListener('click', () => { isAnnualBilling = true; });
    }

    checkoutBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const plan = isAnnualBilling
                ? btn.dataset.planAnnual
                : btn.dataset.planMonthly;

            // Disable button and show loading state
            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Redirecting...';

            try {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan }),
                });

                const data = await response.json();

                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error(data.error || 'Failed to create checkout');
                }
            } catch (error) {
                console.error('Checkout error:', error);
                btn.innerHTML = originalText;
                btn.disabled = false;
                alert('Something went wrong. Please try again.');
            }
        });
    });

    // ========================================
    // Dashboard Carousel with Keyboard Navigation
    // ========================================
    const carouselTabs = document.querySelectorAll('.carousel-tab');
    const carouselSlides = document.querySelectorAll('.carousel-slide');
    const carouselIndicators = document.querySelectorAll('[data-indicator]');
    const carouselContainer = document.getElementById('carousel-slides');
    const slideCount = carouselSlides.length || 3;
    let activeTab = 0;
    let touchStartX = null;

    /**
     * Sets the active carousel slide and updates all related UI
     * @param {number} index - The slide index to activate
     */
    function setActiveSlide(index) {
        activeTab = index;

        // Update tabs
        carouselTabs.forEach((tab, i) => {
            const isActive = i === index;
            tab.setAttribute('aria-selected', isActive.toString());
            tab.setAttribute('tabindex', isActive ? '0' : '-1');

            if (isActive) {
                tab.classList.add('bg-emerald-500', 'text-white', 'shadow-lg', 'shadow-emerald-500/25');
                tab.classList.remove('bg-slate-800', 'text-slate-400', 'hover:bg-slate-700', 'hover:text-white');
            } else {
                tab.classList.remove('bg-emerald-500', 'text-white', 'shadow-lg', 'shadow-emerald-500/25');
                tab.classList.add('bg-slate-800', 'text-slate-400', 'hover:bg-slate-700', 'hover:text-white');
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
                slide.setAttribute('aria-hidden', 'false');
                animateCountersInSlide(slide);
            } else {
                slide.classList.add('hidden');
                slide.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // Set up carousel tabs with ARIA
    carouselTabs.forEach((tab, i) => {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        tab.setAttribute('tabindex', i === 0 ? '0' : '-1');

        tab.addEventListener('click', () => setActiveSlide(i));

        // Keyboard navigation for tabs
        tab.addEventListener('keydown', (e) => {
            let newIndex = activeTab;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                newIndex = (activeTab - 1 + slideCount) % slideCount;
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                newIndex = (activeTab + 1) % slideCount;
            } else if (e.key === 'Home') {
                e.preventDefault();
                newIndex = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                newIndex = slideCount - 1;
            }

            if (newIndex !== activeTab) {
                setActiveSlide(newIndex);
                carouselTabs[newIndex]?.focus();
            }
        });
    });

    // Set up slides with ARIA
    carouselSlides.forEach((slide, i) => {
        slide.setAttribute('role', 'tabpanel');
        slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
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

            if (Math.abs(diff) > SWIPE_THRESHOLD) {
                if (diff > 0) {
                    // Swipe left - next slide
                    setActiveSlide((activeTab + 1) % slideCount);
                } else {
                    // Swipe right - previous slide
                    setActiveSlide((activeTab - 1 + slideCount) % slideCount);
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

    /**
     * Animates a numerical counter from 0 to target value
     * @param {HTMLElement} element - The element to animate
     * @param {number} target - The target number
     * @param {number} duration - Animation duration in ms
     * @param {number} decimals - Number of decimal places
     */
    function animateCounter(element, target, duration = ANIMATION_DURATION, decimals = 0) {
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

    /**
     * Animates all counters within a slide element
     * @param {HTMLElement} slide - The slide containing counters
     */
    function animateCountersInSlide(slide) {
        const counters = slide.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = parseFloat(counter.dataset.target);
            const decimals = parseInt(counter.dataset.decimals) || 0;

            // Validate target value
            if (isNaN(target) || target < 0) {
                console.warn('Invalid counter target:', counter.dataset.target);
                return;
            }

            counter.textContent = '0';
            animateCounter(counter, target, ANIMATION_DURATION, decimals);
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
    }, { threshold: FADE_IN_THRESHOLD });

    fadeElements.forEach(el => fadeObserver.observe(el));

    // ========================================
    // Setup Section - Pulsing Dots Animation
    // ========================================
    const setupSection = document.getElementById('setup');
    const setupDots = document.querySelectorAll('.setup-dot');

    if (setupSection && setupDots.length > 0) {
        const setupObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Start animation on all dots with their respective delays
                    setupDots.forEach(dot => {
                        const delay = dot.dataset.delay || '0s';
                        dot.style.animation = `sequentialPulse 11s infinite`;
                        dot.style.animationDelay = delay;
                    });
                    // Unobserve after triggering (only trigger once per page load)
                    setupObserver.unobserve(entry.target);
                }
            });
        }, { threshold: SETUP_ANIMATION_THRESHOLD });

        setupObserver.observe(setupSection);
    }
});
