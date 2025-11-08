// Toggle mobile menu
const menuToggle = document.querySelector(".menu-toggle");
const menu = document.querySelector("#menu");
menuToggle.addEventListener("click", () => menu.classList.toggle("active"));

// Button redirections
document.getElementById("registerBtn").addEventListener("click", () => {
  window.location.href = "registrationPravaah.html";
});

document.getElementById("myAccBtn").addEventListener("click", () => {
  alert("Feature Coming Soon! You can view your booking status here soon.");
});

// Glow pulse for cards
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("mouseenter", () => {
    card.style.boxShadow = "0 0 40px rgba(0,255,255,0.8)";
  });
  card.addEventListener("mouseleave", () => {
    card.style.boxShadow = "0 0 20px rgba(0,255,255,0.3)";
  });
});
