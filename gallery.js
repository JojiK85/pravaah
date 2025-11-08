// 🌌 PRAVAAH — Gallery JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // ----- 🖼️ LIGHTBOX -----
  const items = document.querySelectorAll('.gallery-item img');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.querySelector('.close-btn');
  const downloadBtn = document.querySelector('.download-btn');

  if (items.length && lightbox && lightboxImg) {
    items.forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightbox.style.display = 'flex';
        if (downloadBtn) downloadBtn.setAttribute('data-url', img.src);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const imageURL = downloadBtn.getAttribute('data-url');
        const fileName = imageURL.split('/').pop();
        const a = document.createElement('a');
        a.href = imageURL;
        a.download = fileName || 'image.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }

    // Close lightbox when clicking outside image
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.style.display = 'none';
    });
  }

  // ----- 📱 NAVBAR TOGGLE -----
  const menuToggle = document.getElementById('mobile-menu');
 // ✅ fixed ID
  const navMenu = document.getElementById('menu');

  if (menuToggle && navMenu) {
    // Toggle open/close
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', (!expanded).toString());
    });

    // Close when clicking outside menu
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close when clicking a menu link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
