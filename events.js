// ---------- CATEGORY SWITCH ----------
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

// ---------- MOBILE NAVBAR TOGGLE ----------
const menuToggle = document.createElement("div");
menuToggle.classList.add("menu-toggle");
menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
document.querySelector("nav").prepend(menuToggle);

const menu = document.getElementById("menu");

menuToggle.addEventListener("click", () => {
  menu.classList.toggle("active");
});

// Close menu when a link is clicked
document.querySelectorAll("#menu a").forEach(link => {
  link.addEventListener("click", () => {
    menu.classList.remove("active");
  });
});
