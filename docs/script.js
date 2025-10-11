// 🦊 Nox Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll effect to navigation
    const nav = document.querySelector('.nav');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            nav.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            nav.style.background = 'rgba(10, 10, 15, 0.9)';
        }
        
        lastScrollY = currentScrollY;
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards and pricing cards
    const animatedElements = document.querySelectorAll('.feature-card, .pricing-card, .install-step');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add sparkle effect to fox on hover
    const foxMain = document.querySelector('.fox-main');
    if (foxMain) {
        foxMain.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(10deg)';
            this.style.filter = 'drop-shadow(0 0 50px rgba(255, 107, 53, 0.8))';
        });

        foxMain.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
            this.style.filter = 'drop-shadow(0 0 30px rgba(255, 107, 53, 0.5))';
        });
    }

    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.innerHTML;
        heroTitle.innerHTML = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                heroTitle.innerHTML += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 500);
    }

    // Add click effect to buttons
    const buttons = document.querySelectorAll('.primary-button, .secondary-button, .pricing-button, .cta-button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.3)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.pointerEvents = 'none';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            hero.style.transform = `translateY(${parallax}px)`;
        });
    }

    // Add counter animation for stats
    const stats = document.querySelectorAll('.stat-number');
    const animateCounter = (element, target) => {
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 20);
    };

    // Observe stats for counter animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target.textContent;
                if (target.includes('K')) {
                    animateCounter(entry.target, 100);
                    entry.target.textContent = '100K+';
                } else if (target === '4') {
                    animateCounter(entry.target, 4);
                } else if (target.includes('%')) {
                    animateCounter(entry.target, 100);
                    entry.target.textContent = '100%';
                }
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => {
        statsObserver.observe(stat);
    });

    // Add installation command copy functionality
    const codeBlocks = document.querySelectorAll('code');
    codeBlocks.forEach(code => {
        code.style.cursor = 'pointer';
        code.title = 'Click to copy';
        
        code.addEventListener('click', function() {
            navigator.clipboard.writeText(this.textContent).then(() => {
                const originalText = this.textContent;
                this.textContent = 'Copied! ✅';
                this.style.color = '#10b981';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.color = '';
                }, 2000);
            });
        });
    });

    // Add mobile menu toggle (for future mobile menu)
    const createMobileMenu = () => {
        const nav = document.querySelector('.nav-container');
        const menuButton = document.createElement('button');
        menuButton.innerHTML = '☰';
        menuButton.className = 'mobile-menu-button';
        menuButton.style.display = 'none';
        menuButton.style.background = 'none';
        menuButton.style.border = 'none';
        menuButton.style.color = 'white';
        menuButton.style.fontSize = '1.5rem';
        menuButton.style.cursor = 'pointer';
        
        // Add mobile styles
        const mobileStyle = document.createElement('style');
        mobileStyle.textContent = `
            @media (max-width: 768px) {
                .mobile-menu-button {
                    display: block !important;
                }
                .nav-links {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(mobileStyle);
        
        nav.appendChild(menuButton);
    };

    createMobileMenu();

    // Add Easter egg - Konami code for special fox animation
    let konamiCode = [];
    const konamiSequence = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];

    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            // Special fox animation
            const fox = document.querySelector('.fox-main');
            if (fox) {
                fox.style.animation = 'foxParty 2s ease-in-out';
                fox.style.fontSize = '12rem';
                
                // Add party sparkles
                for (let i = 0; i < 10; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.textContent = '🎉';
                    sparkle.style.position = 'absolute';
                    sparkle.style.fontSize = '2rem';
                    sparkle.style.left = Math.random() * window.innerWidth + 'px';
                    sparkle.style.top = Math.random() * window.innerHeight + 'px';
                    sparkle.style.animation = 'sparkleParty 3s ease-out forwards';
                    sparkle.style.pointerEvents = 'none';
                    document.body.appendChild(sparkle);
                    
                    setTimeout(() => sparkle.remove(), 3000);
                }
                
                setTimeout(() => {
                    fox.style.animation = '';
                    fox.style.fontSize = '';
                }, 2000);
            }
            
            konamiCode = [];
        }
    });

    // Add party animations
    const partyStyle = document.createElement('style');
    partyStyle.textContent = `
        @keyframes foxParty {
            0% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(90deg) scale(1.2); }
            50% { transform: rotate(180deg) scale(1.5); }
            75% { transform: rotate(270deg) scale(1.2); }
            100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes sparkleParty {
            0% { 
                opacity: 1; 
                transform: translateY(0) rotate(0deg) scale(1); 
            }
            100% { 
                opacity: 0; 
                transform: translateY(-200px) rotate(360deg) scale(0); 
            }
        }
    `;
    document.head.appendChild(partyStyle);

    console.log('🦊 Nox landing page loaded! Try the Konami code for a surprise...');
});
