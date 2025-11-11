let selectedPass = null;
let selectedPrice = 0;
let total = 0;

const selectionArea = document.getElementById("selectionArea");
const selectedPassText = document.getElementById("selectedPass");
const totalAmount = document.getElementById("totalAmount");
const participantForm = document.getElementById("participantForm");
const payBtn = document.getElementById("payBtn");
const timerDisplay = document.getElementById("payment-timer");
const numInput = document.getElementById("numParticipants");
const increaseBtn = document.getElementById("increaseBtn");
const decreaseBtn = document.getElementById("decreaseBtn");

// 🔗 Your Apps Script URL (ends with /exec)
const scriptURL = "https://script.google.com/macros/s/AKfycbwHR5zp3-09nakNxpryLvtmcSUebhkfaohrYWvhlnh32mt0wFfljkqO5JoOJtFsuudJfw/exec";

// Pass selection
document.querySelectorAll(".select-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const card = e.target.closest(".pass-card");
    selectedPass = card.dataset.name;
    selectedPrice = parseInt(card.dataset.price, 10);
    selectionArea.classList.remove("hidden");
    selectedPassText.innerText = `Selected: ${selectedPass} — ₹${selectedPrice}`;
    totalAmount.innerText = `Total: ₹0`;
    payBtn.style.display = "none";
    participantForm.innerHTML = "";
    total = 0;
    timerDisplay.style.display = "none";
    numInput.value = 0;
  });
});

function updateParticipantForm(count) {
  participantForm.innerHTML = "";
  if (!count || count === 0) {
    totalAmount.innerText = `Total: ₹0`;
    payBtn.style.display = "none";
    return;
  }
  for (let i = 1; i <= count; i++) {
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
  total = selectedPrice * count;
  totalAmount.innerText = `Total: ₹${total}`;
  payBtn.style.display = "inline-block";
}

// +/- buttons
increaseBtn.addEventListener("click", () => {
  let value = parseInt(numInput.value || "0", 10);
  const max = parseInt(numInput.max || "100", 10);
  if (value < max) {
    value += 1;
    numInput.value = value;
    updateParticipantForm(value);
  }
});
decreaseBtn.addEventListener("click", () => {
  let value = parseInt(numInput.value || "0", 10);
  if (value > 0) {
    value -= 1;
    numInput.value = value;
    updateParticipantForm(value);
  }
});

// Razorpay + background Google Sheet write
payBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!selectedPass) return;
  if (total === 0) return;

  const names = [...document.querySelectorAll(".pname")].map(i => i.value.trim());
  const emails = [...document.querySelectorAll(".pemail")].map(i => i.value.trim());
  const phones = [...document.querySelectorAll(".pphone")].map(i => i.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map(i => i.value.trim());

  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) return;
  }

  try {
    let timerInterval; // visible to handler

    const options = {
      key: "rzp_test_Re1mOkmIGroT2c",
      amount: total * 100,
      currency: "INR",
      name: "PRAVAAH 2026",
      description: `${selectedPass} Registration`,
      image: "pravah-logo.png",

      // INSTANT redirect; data sent in background
      handler: function (response) {
        if (timerInterval) clearInterval(timerInterval);
        timerDisplay.style.display = "none";

        const payload = JSON.stringify({
          paymentId: response.razorpay_payment_id,
          passType: selectedPass,
          totalAmount: total,
          participants: names.map((name, i) => ({
            name,
            email: emails[i],
            phone: phones[i],
            college: colleges[i],
          })),
        });

        // Try sendBeacon first (non-blocking, survives navigation)
        let queued = false;
        try {
          if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: "text/plain" });
            queued = navigator.sendBeacon(scriptURL, blob);
          }
        } catch (_) { /* noop */ }

        // Fallback to keepalive fetch (also survives navigation)
        if (!queued) {
          try {
            fetch(scriptURL, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: payload,
              keepalive: true
            }).catch(() => {});
          } catch (_) {}
        }

        // Redirect immediately (no alerts)
        window.location.href = "payment_success.html";
      },

      theme: { color: "#00ffff" },
    };

    // Ensure you have: <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    const rzp = new Razorpay(options);

    // Payment timer (no alerts on expiry)
    let timeLeft = 300;
    timerDisplay.style.display = "block";
    timerInterval = setInterval(() => {
      timeLeft--;
      const min = Math.floor(timeLeft / 60);
      const sec = (timeLeft % 60).toString().padStart(2, "0");
      timerDisplay.textContent = `⏳ Payment window: ${min}:${sec}`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        rzp.close();
        // No alert; optionally show inline text:
        // timerDisplay.textContent = "Payment window expired.";
        timerDisplay.style.display = "none";
      }
    }, 1000);

    rzp.open();

  } catch (error) {
    // Silent fail -> optional navigate to failure page
    window.location.href = "payment_failure.html";
  }
});
