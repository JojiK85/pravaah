let selectedPass = null;
let selectedPrice = 0;
let total = 0;

const selectionArea = document.getElementById("selectionArea");
const selectedPassText = document.getElementById("selectedPass");
const totalAmount = document.getElementById("totalAmount");
const participantForm = document.getElementById("participantForm");
const payBtn = document.getElementById("payBtn");
const timerDisplay = document.getElementById("payment-timer");

// Pass selection
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
    total = 0;
    timerDisplay.style.display = "none";
  });
});

// Increase/Decrease participant count
const numInput = document.getElementById("numParticipants");
document.getElementById("increaseBtn").addEventListener("click", () => {
  let value = parseInt(numInput.value);
  if (value < parseInt(numInput.max)) numInput.value = value + 1;
});
document.getElementById("decreaseBtn").addEventListener("click", () => {
  let value = parseInt(numInput.value);
  if (value > parseInt(numInput.min)) numInput.value = value - 1;
});

// Generate participant form
document.getElementById("generateForm").addEventListener("click", (e) => {
  e.preventDefault();
  const num = parseInt(numInput.value);
  if (!num || num <= 0) return alert("Enter valid number of participants.");

  participantForm.innerHTML = "";
  for (let i = 1; i <= num; i++) {
    const div = document.createElement("div");
    div.classList.add("participant-card");
    div.innerHTML = `
      <h4>Participant ${i}</h4>
      <input type="text" placeholder="Full Name" class="pname" required />
      <input type="email" placeholder="Email" class="pemail" required />
      <input type="tel" placeholder="Phone Number" class="pphone" required />
      <input type="text" placeholder="College Name" class="pcollege" required />
    `;
    participantForm.appendChild(div);
  }

  total = selectedPrice * num;
  totalAmount.innerText = `Total: ₹${total}`;
  payBtn.style.display = "inline-block";
});

// ✅ Payment logic with Validation + Visible Timer
payBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (total === 0) return alert("Please add participants first.");

  const names = [...document.querySelectorAll(".pname")].map(i => i.value.trim());
  const emails = [...document.querySelectorAll(".pemail")].map(i => i.value.trim());
  const phones = [...document.querySelectorAll(".pphone")].map(i => i.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map(i => i.value.trim());

  // Validation
  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) {
      alert(`⚠️ Please fill all fields for Participant ${i + 1}.`);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emails[i])) {
      alert(`⚠️ Invalid email format for Participant ${i + 1}.`);
      return;
    }
    if (!/^\d{10}$/.test(phones[i])) {
      alert(`⚠️ Invalid phone number for Participant ${i + 1}. Must be exactly 10 digits.`);
      return;
    }
  }

  try {
    const options = {
      key: "rzp_test_Re1mOkmIGroT2c", // 🔹 Replace with your Razorpay test key
      amount: total * 100, // in paise
      currency: "INR",
      name: "PRAVAAH 2026",
      description: `${selectedPass} Registration`,
      image: "pravah-logo.png",
      handler: function (response) {
        clearInterval(timerInterval);
        timerDisplay.style.display = "none";

        // Send data to Google Sheet
        fetch("https://script.google.com/macros/s/AKfycbzdSM1ItsgBpgHA1HIs8Xj1AViZItclYUkCT9gFOrXBwW6GbFy1HD3gBxMhdCfAK_WN/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: response.razorpay_payment_id,
            passType: selectedPass,
            totalAmount: total,
            participants: names.map((name, i) => ({
              name,
              email: emails[i],
              phone: phones[i],
              college: colleges[i],
            })),
          }),
        })
        .then(() => window.location.href = "payment_success.html")
        .catch(() => window.location.href = "payment_failure.html?reason=DataNotSaved");
      },
      modal: {
        ondismiss: function () {
          clearInterval(timerInterval);
          timerDisplay.style.display = "none";
          window.location.href = "payment_failure.html?reason=UserCancelled";
        }
      },
      theme: { color: "#00ffff" },
    };

    const rzp = new Razorpay(options);

    // ⏱ Start 5-minute countdown timer (visible)
    let timeLeft = 300;
    timerDisplay.style.display = "block";
    const timerInterval = setInterval(() => {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = (timeLeft % 60).toString().padStart(2, "0");
      timerDisplay.textContent = `⏳ Payment window: ${minutes}:${seconds}`;
      timerDisplay.style.textShadow = `0 0 ${Math.random() * 15 + 5}px cyan`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        rzp.close();
        timerDisplay.textContent = "❌ Payment window expired.";
        alert("⚠️ Payment window expired. Please try again.");
        window.location.href = "payment_failure.html?reason=TimeExpired";
      }
    }, 1000);

    rzp.on("payment.failed", function (response) {
      clearInterval(timerInterval);
      timerDisplay.style.display = "none";
      window.location.href = `payment_failure.html?reason=${encodeURIComponent(response.error.description || "PaymentFailed")}`;
    });

    rzp.open();

  } catch (error) {
    console.error("Razorpay Error:", error);
    window.location.href = "payment_failure.html?reason=RazorpayError";
  }
});
