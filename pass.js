// =====================
// PRAVAAH 2026 Registration + Payment (with Profile Auto-Update — Email only autofill)
// =====================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ---- Firebase (use existing window.auth if already set elsewhere) ----
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

// ---- Google Apps Script /exec URL ----
const scriptURL =
  "https://script.google.com/macros/s/AKfycbyC2AZkrZA1aIkIU0fGFUBswnn9usKOpV1VU2nYoh-tAnBYftx1jOV3GWV-8La-Q--I/exec";

// ---- UI state ----
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
const passCards = document.querySelectorAll(".pass-card");

// ---- Pass selection ----
passCards.forEach((card) => {
  (card.querySelector(".select-btn") || card).addEventListener("click", () => {
    passCards.forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");

    selectedPass = card.dataset.name;
    selectedPrice = parseInt(card.dataset.price, 10) || 0;

    selectionArea.classList.remove("hidden");
    selectedPassText.textContent = `Selected: ${selectedPass} — ₹${selectedPrice}`;
    totalAmount.textContent = "Total: ₹0";
    payBtn.style.display = "none";
    participantForm.innerHTML = "";
    total = 0;
    timerDisplay.style.display = "none";
    numInput.value = 0;
  });
});

// ---- Build participant form ----
function updateParticipantForm(count) {
  participantForm.innerHTML = "";

  // ✅ Get profile data stored in localStorage
  const storedProfile = JSON.parse(localStorage.getItem("profileData") || "{}");
  const userName = storedProfile.name?.trim().toLowerCase() || "";
  const userEmail = storedProfile.email || "";

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

  // ✅ Only autofill EMAIL when name matches
  const nameInputs = participantForm.querySelectorAll(".pname");
  const emailInputs = participantForm.querySelectorAll(".pemail");

  nameInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      const typedName = input.value.trim().toLowerCase();
      if (typedName && typedName === userName) {
        emailInputs[index].value = userEmail;

        // ✨ Visual feedback
        emailInputs[index].style.boxShadow = "0 0 10px cyan";
        setTimeout(() => (emailInputs[index].style.boxShadow = ""), 1000);
      }
    });
  });

  total = selectedPrice * count;
  totalAmount.textContent = `Total: ₹${total}`;
  payBtn.style.display = "inline-block";
}

// ---- +/- handlers ----
increaseBtn.addEventListener("click", () => {
  let v = parseInt(numInput.value || "0", 10);
  const max = parseInt(numInput.max || "10", 10);
  if (v < max) {
    numInput.value = ++v;
    updateParticipantForm(v);
  }
});
decreaseBtn.addEventListener("click", () => {
  let v = parseInt(numInput.value || "0", 10);
  if (v > 0) {
    numInput.value = --v;
    updateParticipantForm(v);
  }
});

// ---- Payment + background Sheets sync ----
payBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!selectedPass || total <= 0) return;

  const names = [...document.querySelectorAll(".pname")].map((x) => x.value.trim());
  const emails = [...document.querySelectorAll(".pemail")].map((x) => x.value.trim());
  const phones = [...document.querySelectorAll(".pphone")].map((x) => x.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map((x) => x.value.trim());

  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) return;
  }

  if (typeof Razorpay === "undefined") {
    console.error(
      "Razorpay SDK not loaded. Add <script src='https://checkout.razorpay.com/v1/checkout.js'></script> in HTML."
    );
    return;
  }

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
      if (timerInterval) clearInterval(timerInterval);
      timerDisplay.style.display = "none";

      const participants = names.map((n, i) => ({
        name: n.trim(),
        email: emails[i].trim(),
        phone: phones[i].trim(),
        college: colleges[i].trim(),
      }));

      const payload = JSON.stringify({
        registeredEmail: currentUserEmail,
        paymentId: response.razorpay_payment_id,
        passType: selectedPass,
        totalAmount: total,
        participants,
      });

      // ---- Send data to Google Sheets ----
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
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        } catch (_) {}
      }

      // ✅ Profile Auto-Update Logic (only after payment)
      const storedProfile = JSON.parse(localStorage.getItem("profileData") || "{}");
      const userName = storedProfile.name?.trim().toLowerCase() || "";

      const matched = participants.find((p) => p.name.toLowerCase() === userName);
      if (matched && auth.currentUser) {
        try {
          // 🔹 Update Firebase displayName if changed
          if (auth.currentUser.displayName !== matched.name) {
            await updateProfile(auth.currentUser, { displayName: matched.name });
          }

          // 🔹 Update localStorage with latest phone & college
          localStorage.setItem(
            "profileData",
            JSON.stringify({
              name: matched.name,
              email: matched.email || storedProfile.email,
              phone: matched.phone,
              college: matched.college,
            })
          );

          console.log("✅ Profile updated locally after registration:", matched);
        } catch (err) {
          console.error("⚠️ Failed to update Firebase profile:", err);
        }
      }

      // ✅ Redirect
      window.location.href = "payment_success.html";
    },

    theme: { color: "#00ffff" },
  };

  const rzp = new Razorpay(options);

  // Optional: 5-min timer
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
