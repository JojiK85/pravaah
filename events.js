// 🌐 Navbar Toggle
const menuToggle = document.getElementById("menuToggle");
const menu = document.getElementById("menu");

if (menuToggle && menu) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
      menu.classList.remove("active");
    }
  });

  document.querySelectorAll("#menu a").forEach(link => {
    link.addEventListener("click", () => menu.classList.remove("active"));
  });
}

// 🎭 Event Category Switch
const techBtn = document.getElementById("techBtn");
const cultBtn = document.getElementById("cultBtn");
const workBtn = document.getElementById("workBtn");

const techSection = document.querySelector(".tech-events");
const cultSection = document.querySelector(".cult-events");
const workSection = document.querySelector(".work-events");

// Helper to reset all
function resetTabs() {
  techSection.classList.remove("active");
  cultSection.classList.remove("active");
  workSection.classList.remove("active");

  techBtn.classList.remove("active");
  cultBtn.classList.remove("active");
  workBtn.classList.remove("active");
}

// ---- Technopreneurship ----
techBtn.addEventListener("click", () => {
  resetTabs();
  techSection.classList.add("active");
  techBtn.classList.add("active");
});

// ---- Cultural ----
cultBtn.addEventListener("click", () => {
  resetTabs();
  cultSection.classList.add("active");
  cultBtn.classList.add("active");
});

// ---- Workshops ----
workBtn.addEventListener("click", () => {
  resetTabs();
  workSection.classList.add("active");
  workBtn.classList.add("active");
});
