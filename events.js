// 🌐 Mobile Navbar Toggle
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');

// Toggle open/close when menu button clicked
if (menuToggle && menu) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation(); // prevents instant closing
    menu.classList.toggle('active');
  });

  // Close menu when clicking outside it
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
      menu.classList.remove('active');
    }
  });

  // Close menu when any link inside is clicked
  document.querySelectorAll('#menu a').forEach(link => {
    link.addEventListener('click', () => menu.classList.remove('active'));
  });
}

// 🎭 Event Category Switch (Tech ↔ Cultural)
const techBtn = document.getElementById("techBtn");
const cultBtn = document.getElementById("cultBtn");
const techSection = document.querySelector(".tech-events");
const cultSection = document.querySelector(".cult-events");

// Add event listeners only if elements exist
if (techBtn && cultBtn && techSection && cultSection) {
  techBtn.addEventListener("click", () => {
    techSection.classList.add("active");
    cultSection.classList.remove("active");
    techBtn.classList.add("active");
    cultBtn.classList.remove("active");
  });

  cultBtn.addEventListener("click", () => {
    cultSection.classList.add("active");
    techSection.classList.remove("active");
    cultBtn.classList.add("active");
    techBtn.classList.remove("active");
  });
}
