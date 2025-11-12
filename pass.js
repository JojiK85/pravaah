// =====================
// PRAVAAH 2026 Registration + Payment
// (Profile email-only autofill + background Sheets sync) + minimal fixes
// =====================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ---- Firebase (reuse window.auth if already set) ----
let auth = window.auth;
if (!auth) {
  const firebaseConfig = {
    apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
    authDomain: "pravaah-55b1d.firebaseapp.com",
    projectId: "pravaah-55b1d",
    storageBucket: "pravaah-55b1d.appspot.com",
    messagingSenderId: "287687647267",
    appId: "1:287687647267:web:7aecd603ee202779b89196",
  };
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  window.auth = auth;
}

// ---- Google Apps Script /exec URL (deployed: Execute as Me; Access: Anyone) ----
const scriptURL = "https://script.google.com/macros/s/AKfycbyKGly5gR_OMt6LqAlIl166-Vucn2wAk8242XbnBU8hDRV67FY4lOQFWuFbE1oP5IvYuA/exec";

// ---- UI state ----
let selectedPass = null;
let selectedPrice = 0;
let total = 0;
let paying = false; // double-click guard

const selectionArea     = document.getElementById("selectionArea");
const selectedPassText  = document.getElementById("selectedPass");
const totalAmount       = document.getElementById("totalAmount");
const participantForm   = document.getElementById("participantForm");
const payBtn            = document.getElementById("payBtn");
const timerDisplay      = document.getElementById("payment-timer");
const numInput          = document.getElementById("numParticipants");
const increaseBtn       = document.getElementById("increaseBtn");
const decreaseBtn       = document.getElementById("decreaseBtn");
const passCards         = document.querySelectorAll(".pass-card");

// ---- helpers ----
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRe = /^[0-9+\-\s]{7,15}$/;

// ✅ helper to make sure the selection area is visible whenever needed
const forceShowSelectionArea = () => selectionArea && selectionArea.classList.remove("hidden");

// make the tick icon click-through so card clicks register
document.querySelectorAll(".select-indicator").forEach(el => (el.style.pointerEvents = "none"));

function setPaying(state) {
  paying = state;
  payBtn.disabled = state;
  payBtn.style.pointerEvents = state ? "none" : "auto";
  payBtn.style.opacity = state ? "0.6" : "1";
}

function resetSelectionUI() {
  forceShowSelectionArea(); // ✅ ensure it's visible
  selectedPassText.textContent = `Selected: ${selectedPass} — ₹${selectedPrice}`;
  totalAmount.textContent = "Total: ₹0";
  payBtn.style.display = "none";
  participantForm.innerHTML = "";
  total = 0;
  timerDisplay.style.display = "none";
  numInput.value = 0;
}

// ---- Pass selection (your original listener) ----
passCards.forEach((card) => {
  (card.querySelector(".select-btn") || card).addEventListener("click", () => {
    passCards.forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");

    selectedPass  = card.dataset.name;
    selectedPrice = parseInt(card.dataset.price, 10) || 0;

    resetSelectionUI();
  });
});

// ✅ Extra: robust delegation so clicks on any child of the card still work
document.addEventListener("click", (e) => {
  const card = e.target.closest(".pass-card");
  if (!card) return;
  if (!card.classList.contains("selected")) {
    document.querySelectorAll(".pass-card.selected").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPass  = card.dataset.name || "";
    selectedPrice = parseInt(card.dataset.price || "0", 10) || 0;
    resetSelectionUI();
  }
});

// ---- Build participant form ----
function updateParticipantForm(count) {
  participantForm.innerHTML = "";
  forceShowSelectionArea(); // ✅ keep visible as user changes count

  // Profile from localStorage (for email-only autofill)
  const storedProfile = JSON.parse(localStorage.getItem("profileData") || "{}");
  const storedName  = (storedProfile.name || "").trim().toLowerCase();
  const storedEmail = storedProfile.email || "";

  if (!count || count === 0) {
    totalAmount.textContent = "Total: ₹0";
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

  // email-only autofill when typed name matches stored profile name
  const nameInputs  = participantForm.querySelectorAll(".pname");
  const emailInputs = participantForm.querySelectorAll(".pemail");

  nameInputs.forEach((input, index) => {
    let autoFilled = false;
    input.addEventListener("input", () => {
      const typed = input.value.trim().toLowerCase();
      if (!autoFilled && typed && storedName && typed === storedName) {
        if (storedEmail) {
          emailInputs[index].value = storedEmail;
          emailInputs[index].style.boxShadow = "0 0 10px cyan";
          setTimeout(() => (emailInputs[index].style.boxShadow = ""), 800);
        }
        autoFilled = true; // do it once per field
      }
    });
  });

  total = selectedPrice * count;
  totalAmount.textContent = `Total: ₹${total}`;
  payBtn.style.display = "inline-block";
}

// ---- +/- handlers (now also force show selection area) ----
increaseBtn.addEventListener("click", () => {
  forceShowSelectionArea(); // ✅
  let v = parseInt(numInput.value || "0", 10);
  const max = parseInt(numInput.max || "10", 10);
  if (v < max) {
    numInput.value = ++v;
    updateParticipantForm(v);
  }
});
decreaseBtn.addEventListener("click", () => {
  forceShowSelectionArea(); // ✅
  let v = parseInt(numInput.value || "0", 10);
  if (v > 0) {
    numInput.value = --v;
    updateParticipantForm(v);
  }
});

// ---- Payment + background Sheets sync (sendBeacon / keepalive) ----
payBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (paying) return; // prevent double opens
  if (!selectedPass || total <= 0) return;

  const names    = [...document.querySelectorAll(".pname")].map((x) => x.value.trim());
  const emails   = [...document.querySelectorAll(".pemail")].map((x) => x.value.trim());
  const phones   = [...document.querySelectorAll(".pphone")].map((x) => x.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map((x) => x.value.trim());

  // basic validation (keep UX quiet; just stop if invalid)
  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) return;
    if (!emailRe.test(emails[i])) return;
    if (!phoneRe.test(phones[i])) return;
  }

  if (typeof Razorpay === "undefined") {
    console.error("Razorpay SDK not loaded. Include https://checkout.razorpay.com/v1/checkout.js");
    return;
  }

  // build Razorpay options
  const currentUserEmail = auth?.currentUser?.email || "Guest";
  let timerInterval;

  const options = {
    key: "rzp_test_Re1mOkmIGroT2c",
    amount: total * 100,
    currency: "INR",
    name: "PRAVAAH 2026",
    description: `${selectedPass} Registration`,
    image: "pravah-logo.png",

    handler: async (response) => {
      // payment succeeded
      if (timerInterval) clearInterval(timerInterval);
      timerDisplay.style.display = "none";

      const participants = names.map((n, i) => ({
        name: n,
        email: emails[i],
        phone: phones[i],
        college: colleges[i],
      }));

      const payload = JSON.stringify({
        registeredEmail: currentUserEmail,
        paymentId: response.razorpay_payment_id,
        passType: selectedPass,
        totalAmount: total,
        participants,
      });

      // send in background (no preflight)
      let queued = false;
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "text/plain" });
          queued = navigator.sendBeacon(scriptURL, blob);
        }
      } catch (_) {}

      if (!queued) {
        try {
          fetch(scriptURL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoid preflight
            body: payload,
            keepalive: true,
          }).catch(() => {});
        } catch (_) {}
      }

      // Optional: update Firebase displayName & local profile if user's own name was among participants
      try {
        const stored = JSON.parse(localStorage.getItem("profileData") || "{}");
        const storedName = (stored.name || "").trim().toLowerCase();
        const match = participants.find((p) => p.name.trim().toLowerCase() === storedName);
        if (match && auth.currentUser) {
          if (auth.currentUser.displayName !== match.name) {
            await updateProfile(auth.currentUser, { displayName: match.name });
          }
          localStorage.setItem(
            "profileData",
            JSON.stringify({
              name: match.name,
              email: match.email || stored.email,
              phone: match.phone,
              college: match.college,
            })
          );
        }
      } catch (e) {
        console.warn("Profile update skipped:", e);
      }

      // redirect instantly (no alerts)
      window.location.href = "payment_success.html";
    },

    theme: { color: "#00ffff" },
  };

  const rzp = new Razorpay(options);

  // start a 5-minute payment timer
  setPaying(true);
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
      setPaying(false);
    }
  }, 1000);

  rzp.open();
});
