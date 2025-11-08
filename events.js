// Mobile Navbar Toggle
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');

menuToggle.addEventListener('click', () => {
  menu.classList.toggle('active');
});

document.querySelectorAll('#menu a').forEach(link => {
  link.addEventListener('click', () => menu.classList.remove('active'));
});

// Event category switch
const techBtn = document.getElementById("techBtn");
const cultBtn = document.getElementById("cultBtn");
const techSection = document.querySelector(".tech-events");
const cultSection = document.querySelector(".cult-events");

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
