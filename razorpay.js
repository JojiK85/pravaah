let selectedPass = null;
let selectedPrice = 0;
let total = 0;

const selectionArea = document.getElementById("selectionArea");
const selectedPassText = document.getElementById("selectedPass");
const totalAmount = document.getElementById("totalAmount");
const participantForm = document.getElementById("participantForm");
const payBtn = document.getElementById("payBtn");

document.querySelectorAll(".select-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const card = e.target.closest(".pass-card");
    selectedPass = card.dataset.name;
    selectedPrice = parseInt(card.dataset.price);
    selectionArea.classList.remove("hidden");
    selectedPassText.innerText = `Selected: ${selectedPass} — ₹${selectedPrice}`;
    totalAmount.innerText = `Total: ₹${selectedPrice}`;
    payBtn.style.display = "none";
    participantForm.innerHTML = "";
  });
});

document.getElementById("generateForm").addEventListener("click", (e) => {
  e.preventDefault();
  const num = parseInt(document.getElementById("numParticipants").value);
  if (!num || num <= 0) return alert("Enter valid number of participants.");

  participantForm.innerHTML = "";
  for (let i = 1; i <= num; i++) {
    const div = document.createElement("div");
    div.classList.add("participant-card");
    div.innerHTML = `
      <h4>Participant ${i}</h4>
      <input type="text" placeholder="Name" required />
      <input type="email" placeholder="Email" required />
      <input type="tel" placeholder="Phone" required />
      <input type="text" placeholder="College" required />
    `;
    participantForm.appendChild(div);
  }

  total = selectedPrice * num;
  totalAmount.innerText = `Total: ₹${total}`;
  payBtn.style.display = "inline-block";
});

payBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (total === 0) return alert("Please add participants.");

  const options = {
    key: "rzp_test_yourKeyHere", // Replace with your Razorpay key
    amount: total * 100,
    currency: "INR",
    name: "PRAVAAH 2026",
    description: `${selectedPass} Registration`,
    image: "pravah-logo.png",
    handler: function (response) {
      alert("Payment Successful! ID: " + response.razorpay_payment_id);
      window.location.href = "success.html";
    },
    theme: { color: "#00ffff" },
    method: { upi: true, netbanking: true, wallet: false, card: false }
  };

  const rzp = new Razorpay(options);
  rzp.on("payment.failed", function (response) {
    alert("Payment Failed: " + response.error.description);
  });

  rzp.open();
});
