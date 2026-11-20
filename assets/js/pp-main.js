

(function() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

document.addEventListener('DOMContentLoaded', function() {


  function initDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');

    if (!themeToggle && !themeToggleMobile) return;

    function getCurrentTheme() {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }

    function updateToggleButton() {
      const currentTheme = getCurrentTheme();
      const toggles = [themeToggle, themeToggleMobile].filter(Boolean);

      toggles.forEach(toggle => {
        const slider = toggle.querySelector('.theme-toggle-slider');

        if (slider) {
          slider.innerHTML = currentTheme === 'dark' ? '🌙' : '☀️';
        }

        toggle.setAttribute('aria-label',
          currentTheme === 'dark' ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'
        );
        toggle.setAttribute('aria-checked', currentTheme === 'dark' ? 'true' : 'false');
      });
    }

    function toggleTheme() {
      const currentTheme = getCurrentTheme();
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateToggleButton();

      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = newTheme === 'dark'
        ? 'Dunkler Modus aktiviert'
        : 'Heller Modus aktiviert';
      document.body.appendChild(announcement);

      setTimeout(() => announcement.remove(), 1000);
    }

    const toggles = [themeToggle, themeToggleMobile].filter(Boolean);

    toggles.forEach(toggle => {
      toggle.addEventListener('click', toggleTheme);

      toggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      });
    });

    updateToggleButton();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', function(e) {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateToggleButton();
      }
    });
  }

  initDarkMode();


  function initLanguageSwitcher() {
    const languageButton = document.getElementById('language-button');
    const languageButtonMobile = document.getElementById('language-button-mobile');
    const languageDropdown = document.getElementById('language-dropdown');
    const languageDropdownMobile = document.getElementById('language-dropdown-mobile');

    function toggleDropdown(button, dropdown) {
      if (!button || !dropdown) return;

      const isOpen = dropdown.classList.contains('active');

      document.querySelectorAll('.language-dropdown').forEach(d => {
        d.classList.remove('active');
      });

      if (!isOpen) {
        dropdown.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
      } else {
        button.setAttribute('aria-expanded', 'false');
      }
    }

    if (languageButton && languageDropdown) {
      languageButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown(languageButton, languageDropdown);
      });

      languageButton.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleDropdown(languageButton, languageDropdown);
        }
      });
    }

    if (languageButtonMobile && languageDropdownMobile) {
      languageButtonMobile.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown(languageButtonMobile, languageDropdownMobile);
      });

      languageButtonMobile.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleDropdown(languageButtonMobile, languageDropdownMobile);
        }
      });
    }

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.language-switcher')) {
        document.querySelectorAll('.language-dropdown').forEach(dropdown => {
          dropdown.classList.remove('active');
        });
        [languageButton, languageButtonMobile].forEach(btn => {
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.language-dropdown').forEach(dropdown => {
          dropdown.classList.remove('active');
        });
        [languageButton, languageButtonMobile].forEach(btn => {
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  initLanguageSwitcher();


  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');

      const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
      mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
    });

    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', function() {
        mobileMenu.classList.add('hidden');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }


  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');

      if (targetId === '#') {
        e.preventDefault();
        return;
      }

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault();

        const navHeight = document.querySelector('nav')?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });


  const nav = document.querySelector('.nav');

  if (nav) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
    });
  }


  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(element => {
    observer.observe(element);
  });


  document.querySelectorAll('a[href^="http"]').forEach(link => {
    if (!link.href.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });


  const testimonialTrack = document.getElementById('testimonial-track');
  const testimonialDots = document.querySelectorAll('.testimonial-dot');
  const prevButton = document.getElementById('prev-testimonial');
  const nextButton = document.getElementById('next-testimonial');

  if (testimonialTrack && testimonialDots.length > 0) {
    let currentIndex = 0;
    const totalTestimonials = testimonialDots.length;

    function updateCarousel(index) {
      currentIndex = index;
      const translateX = -currentIndex * 100;
      testimonialTrack.style.transform = `translateX(${translateX}%)`;

      testimonialDots.forEach((dot, i) => {
        if (i === currentIndex) {
          dot.classList.remove('bg-gray-300', 'hover:bg-gray-400');
          dot.classList.add('bg-purple-600');
        } else {
          dot.classList.remove('bg-purple-600');
          dot.classList.add('bg-gray-300', 'hover:bg-gray-400');
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function() {
        const nextIndex = (currentIndex + 1) % totalTestimonials;
        updateCarousel(nextIndex);
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', function() {
        const prevIndex = (currentIndex - 1 + totalTestimonials) % totalTestimonials;
        updateCarousel(prevIndex);
      });
    }

    testimonialDots.forEach((dot, index) => {
      dot.addEventListener('click', function() {
        updateCarousel(index);
      });
    });

    let autoAdvanceInterval = setInterval(function() {
      const nextIndex = (currentIndex + 1) % totalTestimonials;
      updateCarousel(nextIndex);
    }, 5000);

    const testimonialContainer = document.getElementById('testimonial-container');
    if (testimonialContainer) {
      testimonialContainer.addEventListener('mouseenter', function() {
        clearInterval(autoAdvanceInterval);
      });

      testimonialContainer.addEventListener('mouseleave', function() {
        autoAdvanceInterval = setInterval(function() {
          const nextIndex = (currentIndex + 1) % totalTestimonials;
          updateCarousel(nextIndex);
        }, 5000);
      });
    }

    let touchStartX = 0;
    let touchEndX = 0;

    if (testimonialContainer) {
      testimonialContainer.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
      });

      testimonialContainer.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      });

      function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
          const nextIndex = (currentIndex + 1) % totalTestimonials;
          updateCarousel(nextIndex);
        }
        if (touchEndX > touchStartX + 50) {
          const prevIndex = (currentIndex - 1 + totalTestimonials) % totalTestimonials;
          updateCarousel(prevIndex);
        }
      }
    }
  }


  function initBlogFilter() {
    const blogGrid = document.getElementById('blog-grid');
    const blogFilters = document.getElementById('blog-filters');
    const blogSearch = document.getElementById('blog-search');
    const noResults = document.getElementById('blog-no-results');

    if (!blogGrid) return;

    const cards = blogGrid.querySelectorAll('.blog-card-v2');

    const categories = new Set();
    cards.forEach(card => {
      const category = card.dataset.category;
      if (category) {
        categories.add(category);
      }
    });

    categories.forEach(category => {
      const button = document.createElement('button');
      button.className = 'blog-filter';
      button.dataset.filter = category;
      button.textContent = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      blogFilters.appendChild(button);
    });

    let activeFilter = 'all';
    let searchTerm = '';

    function filterCards() {
      let visibleCount = 0;

      cards.forEach(card => {
        const category = card.dataset.category || '';
        const title = card.dataset.title || '';
        const description = card.dataset.description || '';

        const filterMatch = activeFilter === 'all' || category === activeFilter;

        const searchMatch = searchTerm === '' ||
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          category.includes(searchTerm);

        if (filterMatch && searchMatch) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });

      if (noResults) {
        if (visibleCount === 0) {
          noResults.classList.remove('hidden');
        } else {
          noResults.classList.add('hidden');
        }
      }
    }

    blogFilters.addEventListener('click', function(e) {
      if (e.target.classList.contains('blog-filter')) {
        blogFilters.querySelectorAll('.blog-filter').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');

        activeFilter = e.target.dataset.filter;
        filterCards();
      }
    });

    if (blogSearch) {
      blogSearch.addEventListener('input', debounce(function(e) {
        searchTerm = e.target.value.toLowerCase().trim();
        filterCards();
      }, 200));
    }
  }

  initBlogFilter();


  function initTestimonialCarousel() {
    const carousel = document.getElementById('testimonialCarousel');
    if (!carousel) return;

    const track      = carousel.querySelector('.testimonial-carousel__track');
    const slides     = Array.from(carousel.querySelectorAll('.testimonial-slide'));
    const dots       = Array.from(carousel.querySelectorAll('.testimonial-carousel__dot'));
    const btnPrev    = carousel.querySelector('.testimonial-carousel__btn--prev');
    const btnNext    = carousel.querySelector('.testimonial-carousel__btn--next');
    const progressBar = document.getElementById('testimonialProgress');

    const INTERVAL   = 3000;
    const FADE_MS    = 600;

    let current      = 0;
    let timer        = null;
    let progressTimer = null;
    let isPaused     = false;
    let isAnimating  = false;
    let touchStartX  = 0;

    function equaliseHeight() {
      slides.forEach(s => {
        s.style.visibility = 'hidden';
        s.style.position   = 'absolute';
        s.style.display    = 'flex';
      });
      const maxH = Math.max(...slides.map(s => s.offsetHeight));
      track.style.minHeight = maxH + 'px';
      slides.forEach((s, i) => {
        s.style.visibility = '';
        s.style.position   = '';
        s.style.display    = '';
      });
    }

    function goTo(index, direction) {
      if (isAnimating || index === current) return;
      isAnimating = true;

      const prev = current;
      current    = (index + slides.length) % slides.length;

      slides[prev].style.opacity      = '0';
      slides[prev].style.position     = 'absolute';
      slides[prev].style.pointerEvents = 'none';

      slides[current].style.position = 'absolute';
      slides[current].style.opacity  = '0';
      slides[current].style.display  = 'flex';

      slides[current].getBoundingClientRect();
      slides[current].style.opacity = '1';
      slides[current].classList.add('is-active');
      slides[prev].classList.remove('is-active');

      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === current);
        d.setAttribute('aria-selected', i === current ? 'true' : 'false');
      });

      setTimeout(() => {
        slides[prev].style.cssText   = '';
        slides[current].style.cssText = '';
        isAnimating = false;
      }, FADE_MS);

      restartProgress();
    }

    function restartProgress() {
      if (!progressBar) return;
      clearTimeout(progressTimer);
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      progressBar.getBoundingClientRect();
      progressBar.style.transition = `width ${INTERVAL}ms linear`;
      progressBar.style.width = '100%';
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(() => {
        if (!isPaused) goTo(current + 1);
      }, INTERVAL);
    }

    function stopTimer() {
      clearInterval(timer);
      if (progressBar) {
        progressBar.style.transition = 'none';
        progressBar.style.width = progressBar.offsetWidth / progressBar.parentElement.offsetWidth * 100 + '%';
      }
    }

    carousel.addEventListener('mouseenter', () => { isPaused = true; stopTimer(); });
    carousel.addEventListener('mouseleave', () => { isPaused = false; startTimer(); restartProgress(); });
    carousel.addEventListener('focusin',    () => { isPaused = true; stopTimer(); });
    carousel.addEventListener('focusout',   () => { isPaused = false; startTimer(); restartProgress(); });

    btnPrev && btnPrev.addEventListener('click', () => goTo(current - 1));
    btnNext && btnNext.addEventListener('click', () => goTo(current + 1));

    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    carousel.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
    }, { passive: true });

    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    });

    equaliseHeight();
    window.addEventListener('resize', debounce(equaliseHeight, 200));
    startTimer();
    restartProgress();
  }

  initTestimonialCarousel();

});


function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
