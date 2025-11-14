// =====================
// PRAVAAH 2026 Registration + Payment
// (With FULL PROFILE CACHE: email + phone + college autofill)
// =====================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ---- Firebase (reuse if already initialized) ----
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

// ---- Apps Script URL ----
const scriptURL = "https://script.google.com/macros/s/AKfycbz7OcpYMy3gk5cQR4H4ljc_6MFJw5ocfkwGOOe1fT5e-6a7Gc1t7YNxZJNvcXuM-jMVbw/exec";

// ---- UI elements ----
let selectedPass = null;
let selectedPrice = 0;
let total = 0;
let paying = false;

const selectionArea   = document.getElementById("selectionArea");
const selectedPassTxt = document.getElementById("selectedPass");
const totalAmount     = document.getElementById("totalAmount");
const participantForm = document.getElementById("participantForm");
const payBtn          = document.getElementById("payBtn");
const timerDisplay    = document.getElementById("payment-timer");
const numInput        = document.getElementById("numParticipants");
const increaseBtn     = document.getElementById("increaseBtn");
const decreaseBtn     = document.getElementById("decreaseBtn");
const passCards       = document.querySelectorAll(".pass-card");

// ---- REGEX ----
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRe = /^[0-9+\-\s]{7,15}$/;

// ---- Helpers ----
const forceShow = () => selectionArea.classList.remove("hidden");
document.querySelectorAll(".select-indicator").forEach(el => el.style.pointerEvents = "none");

// ⭐⭐⭐ PROFILE CACHE SYSTEM ⭐⭐⭐

// 1️⃣ Load cached profile instantly (if exists)
function getCachedProfile() {
  return JSON.parse(localStorage.getItem("profileData") || "{}");
}

// 2️⃣ Save profile to cache
function saveProfileCache(data) {
  localStorage.setItem("profileData", JSON.stringify(data));
}

// 3️⃣ Fetch profile from Sheets → update cache
async function refreshProfileFromSheets(email) {
  try {
    const res = await fetch(`${scriptURL}?email=${email}&type=profile`);
    const data = await res.json();

    if (data && data.email) {
      saveProfileCache({
        name: data.name || "",
        email: data.email || email,
        phone: data.phone || "",
        college: data.college || ""
      });
    }
  } catch (err) {
    console.warn("Profile refresh failed:", err);
  }
}

// 4️⃣ Auto-load profile when authenticated
auth.onAuthStateChanged(user => {
  if (!user || !user.email) return;

  // Load cached profile immediately
  const cached = getCachedProfile();
  if (!cached.email) {
    saveProfileCache({ email: user.email });  
  }

  // Refresh from backend silently
  refreshProfileFromSheets(user.email);
});

// ------------------------------------------------------------

// Reset UI when pass changes
function resetUI() {
  forceShow();
  selectedPassTxt.textContent = `Selected: ${selectedPass} — ₹${selectedPrice}`;
  totalAmount.textContent = "Total: ₹0";
  participantForm.innerHTML = "";
  total = 0;
  payBtn.style.display = "none";
  timerDisplay.style.display = "none";
  numInput.value = 0;
}

// Pass selection
passCards.forEach(card => {
  (card.querySelector(".select-btn") || card).addEventListener("click", () => {
    passCards.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    selectedPass  = card.dataset.name;
    selectedPrice = parseInt(card.dataset.price, 10);

    resetUI();
  });
});

// Robust click delegation
document.addEventListener("click", e => {
  const card = e.target.closest(".pass-card");
  if (!card) return;

  if (!card.classList.contains("selected")) {
    document.querySelectorAll(".pass-card.selected").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    selectedPass = card.dataset.name;
    selectedPrice = parseInt(card.dataset.price);

    resetUI();
  }
});

// ⭐⭐⭐ PARTICIPANT FORM WITH AUTO-FILL ⭐⭐⭐
function updateParticipantForm(count) {
  participantForm.innerHTML = "";
  forceShow();

  const profile = getCachedProfile();
  const storedName    = (profile.name || "").trim().toLowerCase();
  const storedEmail   = profile.email || "";
  const storedPhone   = profile.phone || "";
  const storedCollege = profile.college || "";

  if (count === 0) {
    totalAmount.textContent = "Total: ₹0";
    payBtn.style.display = "none";
    return;
  }

  // Build forms
  for (let i = 1; i <= count; i++) {
    participantForm.innerHTML += `
      <div class="participant-card">
        <h4>Participant ${i}</h4>
        <input type="text"  class="pname"    placeholder="Full Name" required>
        <input type="email" class="pemail"   placeholder="Email" required>
        <input type="tel"   class="pphone"   placeholder="Phone Number" required>
        <input type="text"  class="pcollege" placeholder="College Name" required>
      </div>
    `;
  }

  const nameInputs    = participantForm.querySelectorAll(".pname");
  const emailInputs   = participantForm.querySelectorAll(".pemail");
  const phoneInputs   = participantForm.querySelectorAll(".pphone");
  const collegeInputs = participantForm.querySelectorAll(".pcollege");

  // ⭐ Auto-fill when typed name matches stored name
  nameInputs.forEach((input, index) => {
    let done = false;

    input.addEventListener("input", () => {
      const typed = input.value.trim().toLowerCase();
      if (done || !typed) return;

      if (storedName && typed === storedName) {
        if (storedEmail)   emailInputs[index].value   = storedEmail;
        if (storedPhone)   phoneInputs[index].value   = storedPhone;
        if (storedCollege) collegeInputs[index].value = storedCollege;

        // Glow effect
        [emailInputs[index], phoneInputs[index], collegeInputs[index]].forEach(el => {
          el.style.boxShadow = "0 0 12px cyan";
          setTimeout(() => (el.style.boxShadow = ""), 800);
        });

        done = true;
      }
    });
  });

  // Update total
  total = selectedPrice * count;
  totalAmount.textContent = `Total: ₹${total}`;
  payBtn.style.display = "inline-block";
}

// Buttons
increaseBtn.addEventListener("click", () => {
  forceShow();
  let v = parseInt(numInput.value) || 0;
  if (v < 10) updateParticipantForm(++v), numInput.value = v;
});

decreaseBtn.addEventListener("click", () => {
  forceShow();
  let v = parseInt(numInput.value) || 0;
  if (v > 0) updateParticipantForm(--v), numInput.value = v;
});

// ⭐⭐⭐ PAYMENT SECTION (unchanged logic) ⭐⭐⭐

payBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (paying) return;

  if (!selectedPass || total <= 0) return;

  const names    = [...document.querySelectorAll(".pname")].map(x => x.value.trim());
  const emails   = [...document.querySelectorAll(".pemail")].map(x => x.value.trim());
  const phones   = [...document.querySelectorAll(".pphone")].map(x => x.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map(x => x.value.trim());

  // Validation
  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) return;
    if (!emailRe.test(emails[i])) return;
    if (!phoneRe.test(phones[i])) return;
  }

  const userEmail = auth?.currentUser?.email || "";

  const options = {
    key: "rzp_test_Re1mOkmIGroT2c",
    amount: total * 100,
    currency: "INR",
    name: "PRAVAAH 2026",
    description: `${selectedPass} Registration`,
    image: "pravah-logo.png",

    handler: async (response) => {
      const participants = names.map((n, i) => ({
        name: n,
        email: emails[i],
        phone: phones[i],
        college: colleges[i],
      }));

      const payload = JSON.stringify({
        registeredEmail: userEmail,
        paymentId: response.razorpay_payment_id,
        passType: selectedPass,
        totalAmount: total,
        participants,
      });

      // Try to send using sendBeacon
      let sent = false;
      try {
        if (navigator.sendBeacon) {
          sent = navigator.sendBeacon(scriptURL, new Blob([payload], { type: "text/plain" }));
        }
      } catch (_) {}

      if (!sent) {
        fetch(scriptURL, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }

      // Update profile cache after payment
      const match = participants.find(p => p.email === userEmail);
      if (match) {
        saveProfileCache(match);
      }

      window.location.href = "payment_success.html";
    }
  };

  new Razorpay(options).open();
});
