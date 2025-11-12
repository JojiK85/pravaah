// =====================
// PRAVAAH 2026 Registration + Payment
// (Auto-fill when typed name matches stored profile name)
// =====================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ---- Firebase Initialization ----
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
const scriptURL = "https://script.google.com/macros/s/AKfycbwUqB2hdgPajzGcEDp87MC4ecmywWqnpAalUswVuGSPADGV3hvJRfHP0XiW5AIm9b_SPw/exec";

// ---- DOM ----
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

// ---- State ----
let selectedPass = null;
let selectedPrice = 0;
let total = 0;
let paying = false;

// ---- Regex Validators ----
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRe = /^[0-9+\-\s]{7,15}$/;

// ---- Helper Functions ----
function forceShowSelectionArea() {
  selectionArea.classList.remove("hidden");
}

function setPaying(state) {
  paying = state;
  payBtn.disabled = state;
  payBtn.style.pointerEvents = state ? "none" : "auto";
  payBtn.style.opacity = state ? "0.6" : "1";
}

function safeInt(v, fallback = 0) {
  const n = parseInt((v ?? "").toString(), 10);
  return Number.isFinite(n) ? n : fallback;
}

function resetSelectionUI() {
  forceShowSelectionArea();
  selectedPassText.textContent = `Selected: ${selectedPass} — ₹${selectedPrice}`;
  totalAmount.textContent = "Total: ₹0";
  payBtn.style.display = "none";
  participantForm.innerHTML = "";
  total = 0;
  timerDisplay.style.display = "none";
  numInput.value = 0;
}

// ---- Pass Selection ----
passCards.forEach((card) => {
  (card.querySelector(".select-btn") || card).addEventListener("click", () => {
    passCards.forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPass = card.dataset.name;
    selectedPrice = safeInt(card.dataset.price, 0);
    resetSelectionUI();
  });
});

// ---- Build Participant Form ----
function updateParticipantForm(count) {
  forceShowSelectionArea();
  participantForm.innerHTML = "";

  // Load stored profile (from profile.html)
  const storedProfile = JSON.parse(localStorage.getItem("profileData") || "{}");
  const storedName = (storedProfile.name || "").trim();
  const storedEmail = (storedProfile.email || "").trim();
  const storedPhone = (storedProfile.phone || "").trim();
  const storedCollege = (storedProfile.college || "").trim();
  const storedNameLC = storedName.toLowerCase();

  if (!count || count <= 0) {
    totalAmount.textContent = "Total: ₹0";
    payBtn.style.display = "none";
    return;
  }

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.classList.add("participant-card");
    div.innerHTML = `
      <h4>Participant ${i}</h4>
      <input type="text"  placeholder="Full Name" class="pname" required />
      <input type="email" placeholder="Email" class="pemail" required />
      <input type="tel" placeholder="Phone Number" class="pphone" required />
      <input type="text" placeholder="College Name" class="pcollege" required />
    `;
    participantForm.appendChild(div);
  }

  // ---- Auto-fill if name matches profile ----
  const nameInputs = participantForm.querySelectorAll(".pname");
  const emailInputs = participantForm.querySelectorAll(".pemail");
  const phoneInputs = participantForm.querySelectorAll(".pphone");
  const collegeInputs = participantForm.querySelectorAll(".pcollege");

  nameInputs.forEach((nameInput, idx) => {
    nameInput.addEventListener("input", () => {
      const typed = nameInput.value.trim().toLowerCase();
      if (storedName && typed === storedNameLC) {
        if (storedEmail) emailInputs[idx].value = storedEmail;
        if (storedPhone) phoneInputs[idx].value = storedPhone;
        if (storedCollege) collegeInputs[idx].value = storedCollege;
        [emailInputs[idx], phoneInputs[idx], collegeInputs[idx]].forEach(flash);
      }
    });
  });

  total = selectedPrice * count;
  totalAmount.textContent = `Total: ₹${total}`;
  payBtn.style.display = "inline-block";
}

function flash(el) {
  el.style.boxShadow = "0 0 10px cyan";
  setTimeout(() => (el.style.boxShadow = ""), 900);
}

// ---- +/- Handlers ----
increaseBtn.addEventListener("click", () => {
  let v = safeInt(numInput.value, 0);
  const max = safeInt(numInput.max, 10);
  if (v < max) {
    v++;
    numInput.value = v;
    updateParticipantForm(v);
  }
});

decreaseBtn.addEventListener("click", () => {
  let v = safeInt(numInput.value, 0);
  if (v > 0) {
    v--;
    numInput.value = v;
    updateParticipantForm(v);
  }
});

// ---- Payment ----
payBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (paying) return;
  if (!selectedPass || total <= 0) {
    alert("Please select a pass and number of participants.");
    return;
  }

  const names = [...document.querySelectorAll(".pname")].map((x) => x.value.trim());
  const emails = [...document.querySelectorAll(".pemail")].map((x) => x.value.trim());
  const phones = [...document.querySelectorAll(".pphone")].map((x) => x.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map((x) => x.value.trim());

  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) {
      alert("Please fill all participant details.");
      return;
    }
    if (!emailRe.test(emails[i])) return alert("Invalid email format!");
    if (!phoneRe.test(phones[i])) return alert("Invalid phone number!");
  }

  if (typeof Razorpay === "undefined") {
    alert("⚠️ Razorpay SDK not loaded!");
    return;
  }

  const currentUserEmail = auth?.currentUser?.email || "Guest";

  const options = {
    key: "rzp_test_Re1mOkmIGroT2c",
    amount: total * 100,
    currency: "INR",
    name: "PRAVAAH 2026",
    description: `${selectedPass} Registration`,
    image: "pravah-logo.png",

    handler: async (response) => {
      clearInterval(timerInterval);
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

      try {
        // Use Beacon (background save)
        const blob = new Blob([payload], { type: "text/plain" });
        navigator.sendBeacon(scriptURL, blob);
      } catch {
        // Fallback to fetch
        fetch(scriptURL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }

      // Update local profile if name matches
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
              email: match.email,
              phone: match.phone,
              college: match.college,
            })
          );
        }
      } catch (e) {
        console.warn("Profile update skipped:", e);
      }

      alert("✅ Payment Successful!");
      window.location.href = "payment_success.html";
    },

    theme: { color: "#00ffff" },
  };

  const rzp = new Razorpay(options);

  // ---- Timer ----
  setPaying(true);
  let timeLeft = 300;
  timerDisplay.style.display = "block";

  const timerInterval = setInterval(() => {
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
