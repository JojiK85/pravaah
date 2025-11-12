// =====================
// PRAVAAH 2026 Registration + Payment
// (Robust init + name-match autofill + background Sheets sync)
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

// ---- Google Apps Script /exec URL (Execute as Me; Anyone can access) ----
const scriptURL = "https://script.google.com/macros/s/AKfycbwUqB2hdgPajzGcEDp87MC4ecmywWqnpAalUswVuGSPADGV3hvJRfHP0XiW5AIm9b_SPw/exec";

// Small helpers
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRe = /^[0-9+\-\s]{7,15}$/;
const safeInt = (v, fb = 0) => {
  const n = parseInt((v ?? "").toString(), 10);
  return Number.isFinite(n) ? n : fb;
};

let selectedPass = null;
let selectedPrice = 0;
let total = 0;
let paying = false;

let selectionArea, selectedPassText, totalAmount, participantForm, payBtn, timerDisplay, numInput, increaseBtn, decreaseBtn;

function setPaying(state) {
  paying = state;
  if (payBtn) {
    payBtn.disabled = state;
    payBtn.style.pointerEvents = state ? "none" : "auto";
    payBtn.style.opacity = state ? "0.6" : "1";
  }
}

function forceShowSelectionArea() {
  if (!selectionArea) return;
  if (selectionArea.classList.contains("hidden")) {
    selectionArea.classList.remove("hidden");
    console.log("[passes] selectionArea shown");
  }
}

function resetSelectionUI() {
  forceShowSelectionArea();
  if (selectedPassText) selectedPassText.textContent = `Selected: ${selectedPass} — ₹${selectedPrice}`;
  if (totalAmount) totalAmount.textContent = "Total: ₹0";
  if (payBtn) payBtn.style.display = "none";
  if (participantForm) participantForm.innerHTML = "";
  total = 0;
  if (timerDisplay) timerDisplay.style.display = "none";
  if (numInput) numInput.value = 0;
  console.log("[passes] UI reset; pass:", selectedPass, "price:", selectedPrice);
}

function flash(el) {
  el.style.boxShadow = "0 0 10px cyan";
  setTimeout(() => (el.style.boxShadow = ""), 900);
}

function updateParticipantForm(count) {
  if (!participantForm) return;
  forceShowSelectionArea();
  participantForm.innerHTML = "";

  // Stored profile (from profile page)
  const storedProfile = JSON.parse(localStorage.getItem("profileData") || "{}");
  const storedName    = (storedProfile.name || "").trim();
  const storedEmail   = (storedProfile.email || "").trim();
  const storedPhone   = (storedProfile.phone || "").trim();
  const storedCollege = (storedProfile.college || "").trim();
  const storedNameLC  = storedName.toLowerCase();

  if (!count || count <= 0) {
    if (totalAmount) totalAmount.textContent = "Total: ₹0";
    if (payBtn) payBtn.style.display = "none";
    console.log("[passes] count=0 -> no form");
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

  // Bind "typed name === stored name" autofill (no overwrite of filled fields)
  const nameInputs    = participantForm.querySelectorAll(".pname");
  const emailInputs   = participantForm.querySelectorAll(".pemail");
  const phoneInputs   = participantForm.querySelectorAll(".pphone");
  const collegeInputs = participantForm.querySelectorAll(".pcollege");

  nameInputs.forEach((nameInput, idx) => {
    let hasAutoFilled = false;
    nameInput.addEventListener("input", () => {
      const typed = nameInput.value.trim().toLowerCase();
      if (!hasAutoFilled && storedName && typed === storedNameLC) {
        if (storedEmail && !emailInputs[idx].value) {
          emailInputs[idx].value = storedEmail;
          flash(emailInputs[idx]);
        }
        if (storedPhone && !phoneInputs[idx].value) {
          phoneInputs[idx].value = storedPhone;
          flash(phoneInputs[idx]);
        }
        if (storedCollege && !collegeInputs[idx].value) {
          collegeInputs[idx].value = storedCollege;
          flash(collegeInputs[idx]);
        }
        hasAutoFilled = true;
      }
    });
  });

  total = selectedPrice * count;
  if (totalAmount) totalAmount.textContent = `Total: ₹${total}`;
  if (payBtn) payBtn.style.display = "inline-block";

  console.log("[passes] rendered participant cards:", count);
}

document.addEventListener("DOMContentLoaded", () => {
  // Grab DOM references AFTER DOM is ready
  selectionArea     = document.getElementById("selectionArea");
  selectedPassText  = document.getElementById("selectedPass");
  totalAmount       = document.getElementById("totalAmount");
  participantForm   = document.getElementById("participantForm");
  payBtn            = document.getElementById("payBtn");
  timerDisplay      = document.getElementById("payment-timer");
  numInput          = document.getElementById("numParticipants");
  increaseBtn       = document.getElementById("increaseBtn");
  decreaseBtn       = document.getElementById("decreaseBtn");

  // Make any decorative indicator non-blocking
  document.querySelectorAll(".select-indicator").forEach(el => (el.style.pointerEvents = "none"));

  // Card selection via event delegation (works for any child click)
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".pass-card");
    if (!card) return;

    document.querySelectorAll(".pass-card.selected").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    selectedPass  = card.dataset.name || "";
    selectedPrice = safeInt(card.dataset.price, 0);

    console.log("[passes] card selected:", selectedPass, selectedPrice);

    resetSelectionUI(); // shows selectionArea and resets form/total
  });

  // + / − handlers
  if (increaseBtn) {
    increaseBtn.addEventListener("click", () => {
      forceShowSelectionArea();
      let v = safeInt(numInput?.value, 0);
      const max = safeInt(numInput?.max, 10);
      if (v < max) {
        v = v + 1;
        if (numInput) numInput.value = v;
        updateParticipantForm(v);
      }
    });
  }

  if (decreaseBtn) {
    decreaseBtn.addEventListener("click", () => {
      forceShowSelectionArea();
      let v = safeInt(numInput?.value, 0);
      if (v > 0) {
        v = v - 1;
        if (numInput) numInput.value = v;
        updateParticipantForm(v);
      }
    });
  }

  // Payment
  if (payBtn) {
    payBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (paying) return;
      if (!selectedPass || total <= 0) return;

      const names    = [...document.querySelectorAll(".pname")].map((x) => x.value.trim());
      const emails   = [...document.querySelectorAll(".pemail")].map((x) => x.value.trim());
      const phones   = [...document.querySelectorAll(".pphone")].map((x) => x.value.trim());
      const colleges = [...document.querySelectorAll(".pcollege")].map((x) => x.value.trim());

      for (let i = 0; i < names.length; i++) {
        if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) return;
        if (!emailRe.test(emails[i])) return;
        if (!phoneRe.test(phones[i])) return;
      }

      if (typeof Razorpay === "undefined") {
        console.error("Razorpay SDK not loaded. Include https://checkout.razorpay.com/v1/checkout.js");
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
          if (timerDisplay) timerDisplay.style.display = "none";

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
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: payload,
                keepalive: true,
              }).catch(() => {});
            } catch (_) {}
          }

          // Optional: update Firebase displayName & stored profile if user's own name appears
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

          window.location.href = "payment_success.html";
        },

        theme: { color: "#00ffff" },
      };

      const rzp = new Razorpay(options);

      // 5-minute payment timer
      setPaying(true);
      let timeLeft = 300;
      if (timerDisplay) timerDisplay.style.display = "block";
      timerInterval = setInterval(() => {
        timeLeft--;
        const min = Math.floor(timeLeft / 60);
        const sec = String(timeLeft % 60).padStart(2, "0");
        if (timerDisplay) timerDisplay.textContent = `⏳ Payment window: ${min}:${sec}`;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          rzp.close();
          if (timerDisplay) timerDisplay.style.display = "none";
          setPaying(false);
        }
      }, 1000);

      rzp.open();
    });
  }

  console.log("[passes] initialized");
});
