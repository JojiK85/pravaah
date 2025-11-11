// =====================
// PRAVAAH 2026 Registration + Payment (Hybrid Optimized)
// =====================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
  authDomain: "pravaah-55b1d.firebaseapp.com",
  projectId: "pravaah-55b1d",
  storageBucket: "pravaah-55b1d.appspot.com",
  messagingSenderId: "287687647267",
  appId: "1:287687647267:web:7aecd603ee202779b89196"
};

// ⚙️ Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// 🔗 Google Apps Script endpoint
const scriptURL = "https://script.google.com/macros/s/AKfycbwHR5zp3-09nakNxpryLvtmcSUebhkfaohrYWvhlnh32mt0wFfljkqO5JoOJtFsuudJfw/exec";

// =====================
// VARIABLES
// =====================
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

// =====================
// 🎟 PASS CARD SELECTION
// =====================
const passCards = document.querySelectorAll(".pass-card");

passCards.forEach(card => {
  card.addEventListener("click", () => {
    passCards.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

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

// =====================
// 👥 PARTICIPANT MANAGEMENT
// =====================
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

increaseBtn.addEventListener("click", () => {
  let value = parseInt(numInput.value || "0", 10);
  if (value < 10) {
    numInput.value = ++value;
    updateParticipantForm(value);
  }
});

decreaseBtn.addEventListener("click", () => {
  let value = parseInt(numInput.value || "0", 10);
  if (value > 0) {
    numInput.value = --value;
    updateParticipantForm(value);
  }
});

// =====================
// 💳 PAYMENT HANDLER
// =====================
payBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!selectedPass || total === 0) return;

  const names = [...document.querySelectorAll(".pname")].map(i => i.value.trim());
  const emails = [...document.querySelectorAll(".pemail")].map(i => i.value.trim());
  const phones = [...document.querySelectorAll(".pphone")].map(i => i.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map(i => i.value.trim());

  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) return alert("Please fill all participant details!");
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Please log in first!");
    return (window.location.href = "index.html");
  }

  try {
    let timerInterval;

    const options = {
      key: "rzp_test_Re1mOkmIGroT2c",
      amount: total * 100,
      currency: "INR",
      name: "PRAVAAH 2026",
      description: `${selectedPass} Registration`,
      image: "pravah-logo.png",

      handler: async function (response) {
        if (timerInterval) clearInterval(timerInterval);
        timerDisplay.style.display = "none";

        const passData = {
          paymentId: response.razorpay_payment_id,
          passType: selectedPass,
          totalAmount: total,
          participants: names.map((n, i) => ({
            name: n,
            email: emails[i],
            phone: phones[i],
            college: colleges[i],
          })),
        };

        // 🔹 Save in Firestore
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const existingPasses = snap.exists() ? snap.data().passes || [] : [];
        existingPasses.push(passData);
        await setDoc(userRef, { passes: existingPasses }, { merge: true });

        // 🔹 Send to Google Sheets
        fetch(scriptURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(passData),
          keepalive: true
        }).catch(() => {});

        // ✅ Redirect
        window.location.href = "payment_success.html";
      },

      theme: { color: "#00ffff" },
    };

    const rzp = new Razorpay(options);

    // 5-min Payment Timer
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
        timerDisplay.style.display = "none";
      }
    }, 1000);

    rzp.open();

  } catch (error) {
    console.error("❌ Payment Error:", error);
    window.location.href = "payment_failure.html";
  }
});
