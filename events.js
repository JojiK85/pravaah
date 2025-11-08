const techBtn = document.getElementById("techBtn");
const cultBtn = document.getElementById("cultBtn");
const techSection = document.querySelector(".tech-events");
const cultSection = document.querySelector(".cult-events");

function switchSection(showSection, hideSection, activeBtn, inactiveBtn) {
  // Remove current animations
  hideSection.classList.remove("slide-in");
  showSection.classList.remove("slide-in");

  // Animate out old section
  hideSection.classList.add("slide-out");

  // Wait for animation end before switching visibility
  setTimeout(() => {
    hideSection.classList.remove("active", "slide-out");
    showSection.classList.add("active", "slide-in");
  }, 300);

  activeBtn.classList.add("active");
  inactiveBtn.classList.remove("active");
}

techBtn.addEventListener("click", () => {
  switchSection(techSection, cultSection, techBtn, cultBtn);
});

cultBtn.addEventListener("click", () => {
  switchSection(cultSection, techSection, cultBtn, techBtn);
});
