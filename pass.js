// pass.js — PRAVAAH 2026 Registration + Payment (Vercel + Apps Script)

// -------- Firebase (use existing window.auth if already initialized on the page)
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

let auth = window.auth;
if (!auth) {
  const firebaseConfig = {
    apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
    authDomain: "pravaah-55b1d.firebaseapp.com",
    projectId: "pravaah-55b1d",
    storageBucket: "pravaah-55b1d.appspot.com",
    messagingSenderId: "287687647267",
    appId: "1:287687647267:web:7aecd603ee202779b89196"
  };
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  // expose for other modules if needed
  window.auth = auth;
}

// -------- Google Apps Script /exec URL (Web App: Execute as Me, Access: Anyone)
const scriptURL = "https://script.google.com/macros/s/AKfycbyC2AZkrZA1aIkIU0fGFUBswnn9usKOpV1VU2nYoh-tAnBYftx1jOV3GWV-8La-Q--I/exec";

// -------- State & DOM
let selectedPass = null;
let selectedPrice = 0;
let total = 0;

const selectionArea   = document.getElementById("selectionArea");
const selectedPassTxt = document.getElementById("selectedPass");
const totalAmountEl   = document.getElementById("totalAmount");
const participantForm = document.getElementById("participantForm");
const payBtn          = document.getElementById("payBtn");
const timerDisplay    = document.getElementById("payment-timer");
const numInput        = document.getElementById("numParticipants");
const increaseBtn     = document.getElementById("increaseBtn");
const decreaseBtn     = document.getElementById("decreaseBtn");
const passCards       = document.querySelectorAll(".pass-card");

// -------- Pass selection (click entire card)
passCards.forEach(card => {
  (card.querySelector(".select-btn") || card).addEventListener("click", () => {
    passCards.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    selectedPass  = card.dataset.name;
    selectedPrice = parseInt(card.dataset.price, 10) || 0;

    selectionArea.classList.remove("hidden");
    selectedPassTxt.textContent = `Selected: ${selectedPass} — ₹${selectedPrice}`;
    totalAmountEl.textContent   = "Total: ₹0";
    payBtn.style.display        = "none";
    participantForm.innerHTML   = "";
    total = 0;
    timerDisplay.style.display  = "none";
    numInput.value = 0;
  });
});

// -------- Build participant form
function updateParticipantForm(count) {
  participantForm.innerHTML = "";
  if (!count || count <= 0) {
    totalAmountEl.textContent = "Total: ₹0";
    payBtn.style.display = "none";
    return;
  }
  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.classList.add("participant-card");
    div.innerHTML = `
      <h4>Participant ${i}</h4>
      <input type="text"  placeholder="Full Name"     class="pname"    required />
      <input type="email" placeholder="Email"         class="pemail"   required />
      <input type="tel"   placeholder="Phone Number"  class="pphone"   required />
      <input type="text"  placeholder="College Name"  class="pcollege" required />
    `;
    participantForm.appendChild(div);
  }
  total = selectedPrice * count;
  totalAmountEl.textContent = `Total: ₹${total}`;
  payBtn.style.display = "inline-block";
}

// -------- +/- participant count
increaseBtn.addEventListener("click", () => {
  let v = parseInt(numInput.value || "0", 10);
  const max = parseInt(numInput.max || "10", 10);
  if (v < max) {
    v += 1; numInput.value = v; updateParticipantForm(v);
  }
});
decreaseBtn.addEventListener("click", () => {
  let v = parseInt(numInput.value || "0", 10);
  if (v > 0) {
    v -= 1; numInput.value = v; updateParticipantForm(v);
  }
});

// -------- Payment + Sheets sync
payBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!selectedPass || total <= 0) return;

  const names    = [...document.querySelectorAll(".pname")].map(x => x.value.trim());
  const emails   = [...document.querySelectorAll(".pemail")].map(x => x.value.trim());
  const phones   = [...document.querySelectorAll(".pphone")].map(x => x.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map(x => x.value.trim());

  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) return; // keep UX clean
  }

  // require Razorpay script
  if (typeof Razorpay === "undefined") {
    console.error("Razorpay SDK not loaded. Include https://checkout.razorpay.com/v1/checkout.js");
    return;
  }

  const currentUserEmail = auth?.currentUser?.email || "Guest";
  let timerInterval;

  const options = {
    key: "rzp_test_Re1mOkmIGroT2c",
    amount: total * 100, // paise
    currency: "INR",
    name: "PRAVAAH 2026",
    description: `${selectedPass} Registration`,
    image: "pravah-logo.png",

    // Instant redirect; push data in background
    handler: (response) => {
      if (timerInterval) clearInterval(timerInterval);
      timerDisplay.style.display = "none";

      const payload = JSON.stringify({
        registeredEmail: currentUserEmail,
        paymentId: response.razorpay_payment_id,
        passType: selectedPass,
        totalAmount: total,
        participants: names.map((n, i) => ({
          name: n,
          email: emails[i],
          phone: phones[i],
          college: colleges[i],
        })),
      });

      // Prefer beacon (survives navigation, no preflight)
      let queued = false;
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "text/plain" });
          queued = navigator.sendBeacon(scriptURL, blob);
        }
      } catch (_) {}

      // Fallback: keepalive fetch (also survives navigation)
      if (!queued) {
        try {
          fetch(scriptURL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" }, // IMPORTANT: avoid preflight
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

  const rzp = new Razorpay(options);

  // 5-minute timer (no alerts on expiry)
  let timeLeft = 300;
  timerDisplay.style.display = "block";
  timerInterval = setInterval(() => {
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = String(timeLeft % 60).padStart(2, "0");
    timerDisplay.textContent = `⏳ Payment window: ${min}:${sec}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      rzp.close();
      timerDisplay.style.display = "none";
    }
  }, 1000);

  rzp.open();
});
