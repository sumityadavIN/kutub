// Simple Scroll Reveal & Menu
// Initialize Barba.js and GSAP
gsap.registerPlugin(ScrollTrigger);

// Initial Page Load Animation
function initPageLoad() {
    const tl = gsap.timeline();

    // Reveal Hero Title
    tl.to('.reveal-text span', {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: 'power4.out'
    })
        // Fade in video/image
        .to('.hero-video, .listing-hero-image img', {
            opacity: 1,
            duration: 1.5,
            ease: 'power2.out'
        }, '-=0.5')
        // Fade in other hero elements
        .to('.hero-meta, .listing-status, .listing-location, .maps-subtitle', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out'
        }, '-=1');
}

// Scroll Animations
function initScrollAnimations() {
    // Property Cards Stagger
    ScrollTrigger.batch('.prop-item', {
        start: 'top 85%',
        onEnter: batch => gsap.to(batch, {
            opacity: 1,
            y: 0,
            stagger: 0.15,
            duration: 0.8,
            ease: 'power2.out'
        })
    });

    // Generalized Fade Up
    gsap.utils.toArray('.fade-up, .about-text h2, .about-text p, .stat-item, .listing-details h2, .listing-details p, .map-card').forEach(el => {
        gsap.fromTo(el,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%'
                }
            }
        );
    });

    // Footer Stagger
    ScrollTrigger.create({
        trigger: 'footer',
        start: 'top 80%',
        onEnter: () => {
            gsap.fromTo('.footer-col',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, stagger: 0.1, duration: 0.6 }
            );
        }
    });
}

// Listing Data Loader (from JSON)
async function loadListings() {
    const propertyList = document.getElementById('property-list');
    if (!propertyList) return;

    try {
        const response = await fetch('listing/listings.json');
        const listings = await response.json();

        propertyList.innerHTML = '';
        listings.forEach((listing, index) => {
            const article = document.createElement('article');
            article.className = 'prop-item';
            // Start invisible for GSAP
            article.style.opacity = '0';
            article.style.transform = 'translateY(30px)';

            article.dataset.href = `listing/${listing.file}`;

            article.innerHTML = `
                <div class="prop-meta">
                    <span class="status${listing.status === 'UNDER CONSTRUCTION' ? ' under-construction' : ''}">${listing.status}</span>
                    <h3>${listing.title}</h3>
                    <p>${listing.location} • ${listing.type}</p>
                </div>
                <div class="prop-image">
                    <img src="${listing.image}" alt="${listing.title}"
                        onerror="this.src='https://placehold.co/1200x600/1a1a1a/D8C690?text=Image+Not+Found'">
                </div>
                <div class="prop-action">
                    <a href="listing/${listing.file}">View Details ↗</a>
                </div>
            `;
            // Make entire card clickable
            article.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') {
                    // Use Barba to navigate
                    barba.go(article.dataset.href);
                }
            });

            propertyList.appendChild(article);
        });

        // Re-init ScrollTrigger after DOM update
        ScrollTrigger.refresh();
        initScrollAnimations();

    } catch (error) {
        console.error('Failed to load listings:', error);
    }
}

// Maps Page Logic
function initMapsPage() {
    const mapCards = document.querySelectorAll('.map-card');
    const modal = document.getElementById('mapModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.modal-close');

    if (!mapCards.length) return;

    window.openMap = (card) => {
        const img = card.querySelector('img');
        modalImg.src = img.src;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        gsap.fromTo(modalImg, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
    };

    window.closeMap = () => {
        gsap.to(modalImg, {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    };

    // Pass event listeners
    mapCards.forEach(card => card.onclick = () => window.openMap(card));
    if (closeBtn) closeBtn.onclick = window.closeMap;
    if (modal) modal.onclick = window.closeMap;
}

// Barba.js Setup
barba.init({
    sync: true,
    transitions: [{
        name: 'fade-transition',
        async leave(data) {
            const done = this.async();
            // Curtain swipe down
            await gsap.to('.transition-curtain', {
                scaleY: 1,
                transformOrigin: 'top',
                duration: 0.5,
                ease: 'power4.inOut'
            });
            done();
        },
        async enter(data) {
            // Scroll to top
            window.scrollTo(0, 0);

            // Refresh logic based on page
            if (data.next.namespace === 'home') loadListings();
            if (data.next.namespace === 'maps') initMapsPage();

            // Curtain swipe up reveals new page
            await gsap.to('.transition-curtain', {
                scaleY: 0,
                transformOrigin: 'bottom',
                duration: 0.6,
                ease: 'power4.inOut',
                delay: 0.1
            });

            // Trigger entry animations
            initPageLoad();
            initScrollAnimations();
        }
    }]
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadListings();
    initMapsPage();
    initPageLoad();
    initScrollAnimations();
});

// Mobile Menu Toggle
document.querySelector('.menu-toggle').addEventListener('click', () => {
    const nav = document.querySelector('.desktop-nav');
    nav.classList.toggle('active');
});