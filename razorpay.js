const generateBtn = document.getElementById("generateForm");
const participantForm = document.getElementById("participantForm");
const totalAmount = document.getElementById("totalAmount");
const payBtn = document.getElementById("payBtn");

let selectedPrice = 0;
let total = 0;

document.querySelectorAll("input[name='pass']").forEach(pass => {
  pass.addEventListener("change", () => {
    selectedPrice = parseInt(pass.dataset.price);
    totalAmount.innerText = `Total: ₹${selectedPrice}`;
    payBtn.style.display = "none";
  });
});

generateBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const num = parseInt(document.getElementById("numParticipants").value);
  if (!num || num <= 0) {
    alert("Please enter a valid number of participants.");
    return;
  }

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
  if (total === 0) {
    alert("Please select a pass and enter participants.");
    return;
  }

  const options = {
    key: "rzp_test_yourKeyHere", // Replace with your Razorpay Key
    amount: total * 100, // In paise
    currency: "INR",
    name: "PRAVAAH 2026",
    description: "Pass Registration Payment",
    image: "pravah-logo.png",
    handler: function (response) {
      alert("Payment Successful! ID: " + response.razorpay_payment_id);
      window.location.href = "success.html";
    },
    theme: {
      color: "#00ffff"
    },
    method: {
      upi: true,
      netbanking: true,
      wallet: false,
      card: false
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function (response) {
    alert("Payment failed: " + response.error.description);
    window.location.href = "failed.html";
  });
  rzp.open();
});
