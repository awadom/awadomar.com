$(function () {
  "use strict";

  // Initialize AOS (Animate On Scroll)
  AOS.init({
    duration: 1000,
    once: true,
    offset: 100,
    delay: 100
  });

  // MENU
  $(".navbar .nav-link").on("click", function () {
    $(".navbar-collapse").collapse("hide");
  });

  // Enhanced scroll effects
  $(window).on("scroll", function () {
    var scrollTop = $(window).scrollTop();
    
    // Navbar scroll effect
    if (scrollTop > 72) {
      $(".navbar").addClass("scroll");
    } else {
      $(".navbar").removeClass("scroll");
    }
    
    // Parallax effect for particles
    $(".particle").each(function(i) {
      var speed = 0.5 + (i * 0.1);
      var yPos = -(scrollTop * speed);
      $(this).css('transform', 'translateY(' + yPos + 'px)');
    });
  });

  // RECOMMENDATIONS CAROUSEL with enhanced settings
  $("#recommendations-carousel").owlCarousel({
    loop: true,
    margin: 30,
    nav: true,
    dots: true,
    autoplay: true,
    autoplayTimeout: 8000,
    autoplayHoverPause: true,
    responsiveClass: true,
    navText: [
      '<i class="fas fa-chevron-left"></i>',
      '<i class="fas fa-chevron-right"></i>'
    ],
    responsive: {
      0: {
        items: 1,
        nav: false
      },
      768: {
        items: 1,
        nav: true
      },
      1000: {
        items: 1,
        nav: true
      }
    }
  });

  // SMOOTHSCROLL with enhanced easing
  $(".navbar .nav-link, .hero-buttons a, a[href^='#']").on("click", function (event) {
    if (this.hash !== "") {
      event.preventDefault();
      var hash = this.hash;
      var target = $(hash);
      
      if (target.length) {
        $("html, body").animate({
          scrollTop: target.offset().top - 100
        }, 800, "easeInOutQuart");
      }
    }
  });

  // Add loading animation to elements
  function addLoadingAnimation() {
    $('.skill-item, .portfolio-item, .recommendations-thumb').addClass('loading');
    
    setTimeout(function() {
      $('.loading').addClass('loaded');
    }, 300);
  }

  // Enhanced hover effects for skill items
  $('.skill-item').hover(
    function() {
      $(this).find('.skill-icon').addClass('animate__animated animate__pulse');
    },
    function() {
      $(this).find('.skill-icon').removeClass('animate__animated animate__pulse');
    }
  );

  // Portfolio item hover effects
  $('.portfolio-item').hover(
    function() {
      $(this).find('img').css('transform', 'scale(1.1)');
    },
    function() {
      $(this).find('img').css('transform', 'scale(1)');
    }
  );

  // Typing effect for hero title
  function typeWriter(element, text, speed) {
    var i = 0;
    var timer = setInterval(function() {
      if (i < text.length) {
        element.text(element.text() + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
  }

  // Initialize typing effect
  var heroTitle = $('.hero-title');
  if (heroTitle.length) {
    var originalText = heroTitle.text();
    heroTitle.text('');
    setTimeout(function() {
      typeWriter(heroTitle, originalText, 100);
    }, 1000);
  }

  // Enhanced particle animation
  function createParticle() {
    var particle = $('<div class="particle"></div>');
    var left = Math.random() * 100;
    var animationDuration = Math.random() * 3 + 2;
    var delay = Math.random() * 2;
    
    particle.css({
      'left': left + '%',
      'animation-duration': animationDuration + 's',
      'animation-delay': delay + 's'
    });
    
    $('.particles-container').append(particle);
    
    setTimeout(function() {
      particle.remove();
    }, (animationDuration + delay) * 1000);
  }

  // Create particles periodically
  setInterval(createParticle, 1000);

  // Enhanced button animations
  $('.custom-btn').hover(
    function() {
      $(this).addClass('animate__animated animate__pulse');
    },
    function() {
      $(this).removeClass('animate__animated animate__pulse');
    }
  );

  // Social icon hover effects
  $('.social-icon').hover(
    function() {
      $(this).css('transform', 'translateY(-3px) rotate(5deg) scale(1.1)');
    },
    function() {
      $(this).css('transform', 'translateY(0) rotate(0deg) scale(1)');
    }
  );

  // Progress bar animation for skills (if you want to add progress bars later)
  function animateProgressBars() {
    $('.progress-bar').each(function() {
      var width = $(this).data('width');
      $(this).animate({
        width: width + '%'
      }, 1500);
    });
  }

  // Intersection Observer for animations
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate__animated', 'animate__fadeInUp');
        }
      });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.skill-item, .portfolio-item, .card').forEach(el => {
      observer.observe(el);
    });
  }

  // Initialize all animations
  addLoadingAnimation();

  // Enhanced modal functionality
  $('#resumeModal').on('show.bs.modal', function (e) {
    $(this).find('.modal-content').addClass('animate__animated animate__zoomIn');
  });

  $('#resumeModal').on('hide.bs.modal', function (e) {
    $(this).find('.modal-content').removeClass('animate__animated animate__zoomIn');
  });

  // Add smooth reveal animation for sections
  function revealOnScroll() {
    var reveals = document.querySelectorAll('.reveal');
    
    for (var i = 0; i < reveals.length; i++) {
      var windowHeight = window.innerHeight;
      var elementTop = reveals[i].getBoundingClientRect().top;
      var elementVisible = 150;
      
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add('active');
      }
    }
  }

  window.addEventListener('scroll', revealOnScroll);

  // Add click ripple effect
  function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');
    
    const ripple = button.getElementsByClassName('ripple')[0];
    
    if (ripple) {
      ripple.remove();
    }
    
    button.appendChild(circle);
  }

  // Add ripple effect to buttons
  document.querySelectorAll('.custom-btn').forEach(button => {
    button.addEventListener('click', createRipple);
  });

  // Enhanced preloader (if you want to add one)
  $(window).on('load', function() {
    setTimeout(function() {
      $('body').addClass('loaded');
    }, 500);
  });

  // Add stagger animation for skills
  $('.skill-item').each(function(index) {
    $(this).css('animation-delay', (index * 0.1) + 's');
  });

  // Dynamic background gradient
  function updateGradient() {
    var scrollPercent = $(window).scrollTop() / ($(document).height() - $(window).height());
    var hue = Math.floor(scrollPercent * 360);
    $('body').css('background', `linear-gradient(135deg, hsl(${hue}, 70%, 95%) 0%, hsl(${hue + 60}, 70%, 95%) 100%)`);
  }

  // Uncomment if you want dynamic background
  // $(window).on('scroll', updateGradient);

  // Initialize scroll indicator
  function updateScrollIndicator() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    document.querySelector('.scroll-indicator').style.transform = `scaleX(${scrollPercent / 100})`;
  }

  window.addEventListener('scroll', updateScrollIndicator);

  // Initialize preloader
  $(window).on('load', function() {
    setTimeout(function() {
      $('.preloader').addClass('fade-out');
      setTimeout(function() {
        $('.preloader').remove();
      }, 500);
    }, 1000);
  });
});
