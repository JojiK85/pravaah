// Toggle between Technopreneurship and Cultural
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
