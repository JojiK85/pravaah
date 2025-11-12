// =====================
// PRAVAAH 2026 Registration + Payment
// (Name-match autofill + background Sheets sync)
// =====================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Firebase (reuse window.auth if already set) ---
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

// --- GAS URL ---
const scriptURL = "https://script.google.com/macros/s/AKfycbwUqB2hdgPajzGcEDp87MC4ecmywWqnpAalUswVuGSPADGV3hvJRfHP0XiW5AIm9b_SPw/exec";

// --- helpers ---
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

function setPaying(state, payBtn) {
  paying = state;
  if (payBtn) {
    payBtn.disabled = state;
    payBtn.style.pointerEvents = state ? "none" : "auto";
    payBtn.style.opacity = state ? "0.6" : "1";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM refs AFTER DOM is ready ---
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

  // Make decorative check icon click-through (in case CSS missed it)
  document.querySelectorAll(".select-indicator").forEach(el => (el.style.pointerEvents = "none"));

  const forceShowSelectionArea = () => {
    if (selectionArea.classList.contains("hidden")) selectionArea.classList.remove("hidden");
  };

  const resetSelectionUI = () => {
    forceShowSelectionArea();
    selectedPassText.textContent = `Selected: ${selectedPass} — ₹${selectedPrice}`;
    totalAmount.textContent = "Total: ₹0";
    payBtn.style.display = "none";
    participantForm.innerHTML = "";
    total = 0;
    timerDisplay.style.display = "none";
    numInput.value = 0;
  };

  function flash(el) {
    el.style.boxShadow = "0 0 10px cyan";
    setTimeout(() => (el.style.boxShadow = ""), 900);
  }

  // --- participant form builder (autofill only when typed name matches stored name) ---
  function updateParticipantForm(count) {
    participantForm.innerHTML = "";
    forceShowSelectionArea();

    const storedProfile = JSON.parse(localStorage.getItem("profileData") || "{}");
    const storedName    = (storedProfile.name || "").trim();
    const storedEmail   = (storedProfile.email || "").trim();
    const storedPhone   = (storedProfile.phone || "").trim();
    const storedCollege = (storedProfile.college || "").trim();
    const storedNameLC  = storedName.toLowerCase();

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
        <input type="text"  placeholder="Full Name"     class="pname"    required />
        <input type="email" placeholder="Email"         class="pemail"   required />
        <input type="tel"   placeholder="Phone Number"  class="pphone"   required />
        <input type="text"  placeholder="College Name"  class="pcollege" required />
      `;
      participantForm.appendChild(div);
    }

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
            emailInputs[idx].value = storedEmail; flash(emailInputs[idx]);
          }
          if (storedPhone && !phoneInputs[idx].value) {
            phoneInputs[idx].value = storedPhone; flash(phoneInputs[idx]);
          }
          if (storedCollege && !collegeInputs[idx].value) {
            collegeInputs[idx].value = storedCollege; flash(collegeInputs[idx]);
          }
          hasAutoFilled = true;
        }
      });
    });

    total = selectedPrice * count;
    totalAmount.textContent = `Total: ₹${total}`;
    payBtn.style.display = "inline-block";
  }

  // --- pass selection (direct listeners) ---
  passCards.forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".pass-card.selected").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedPass  = card.dataset.name || "";
      selectedPrice = safeInt(card.dataset.price, 0);
      resetSelectionUI();
    });
  });

  // --- fallback event delegation (covers any missed clicks on children) ---
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".pass-card");
    if (!card) return;
    if (card.classList.contains("selected")) return; // already selected by direct listener
    document.querySelectorAll(".pass-card.selected").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPass  = card.dataset.name || "";
    selectedPrice = safeInt(card.dataset.price, 0);
    resetSelectionUI();
  });

  // --- +/- handlers ---
  increaseBtn.addEventListener("click", () => {
    forceShowSelectionArea();
    let v = safeInt(numInput.value, 0);
    const max = safeInt(numInput.max, 10);
    if (v < max) {
      v += 1;
      numInput.value = v;
      updateParticipantForm(v);
    }
  });

  decreaseBtn.addEventListener("click", () => {
    forceShowSelectionArea();
    let v = safeInt(numInput.value, 0);
    if (v > 0) {
      v -= 1;
      numInput.value = v;
      updateParticipantForm(v);
    }
  });

  // --- Payment ---
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

        // background send
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

        // optional profile sync
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

    // timer UI
    setPaying(true, payBtn);
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
        setPaying(false, payBtn);
      }
    }, 1000);

    rzp.open();
  });

  // Debug breadcrumb so you know it's wired
  console.log("[passes] ready: cards=", document.querySelectorAll(".pass-card").length);
});
