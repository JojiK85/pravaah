// Simple interactive JS for Accommodation page

document.getElementById("registerBtn").addEventListener("click", () => {
  window.location.href = "registrationPravaah.html";
});

document.getElementById("myAccBtn").addEventListener("click", () => {
  alert("Feature Coming Soon! You can view your booking status here soon.");
});

// Glow animation on hover for cards (interactive pulse)
const cards = document.querySelectorAll(".card");
cards.forEach(card => {
  card.addEventListener("mouseenter", () => {
    card.style.boxShadow = "0 0 40px rgba(0,255,255,0.8)";
  });
  card.addEventListener("mouseleave", () => {
    card.style.boxShadow = "0 0 20px rgba(0,255,255,0.3)";
  });
});
