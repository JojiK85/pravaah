// ==========================
// 🔥 PRAVAAH PROFILE LOGIC
// ==========================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
  authDomain: "pravaah-55b1d.firebaseapp.com",
  projectId: "pravaah-55b1d",
  storageBucket: "pravaah-55b1d.appspot.com",
  messagingSenderId: "287687647267",
  appId: "1:287687647267:web:7aecd603ee202779b89196"
};

// ✅ Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const nameField = document.getElementById("userName");
const emailField = document.getElementById("userEmail");
const phoneField = document.getElementById("userPhone");
const collegeField = document.getElementById("userCollege");
const passesList = document.getElementById("passesList");

// 🔐 User Auth Check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // ✅ Display name and email
  nameField.textContent = user.displayName || "PRAVAAH User";
  emailField.textContent = user.email;

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      passesList.innerHTML = `<p class="no-passes">Not yet registered.</p>`;
      phoneField.textContent = "Not provided";
      collegeField.textContent = "Not provided";
      return;
    }

    const data = snap.data();
    phoneField.textContent = data.phone || "Not provided";
    collegeField.textContent = data.college || "Not provided";

    const passes = data.passes || [];
    if (passes.length === 0) {
      passesList.innerHTML = `<p class="no-passes">Not yet registered.</p>`;
    } else {
      passesList.innerHTML = passes.map(p => `
        <div class="pass-item">
          <h3>${p.passType}</h3>
          <p><strong>Amount:</strong> ₹${p.totalAmount}</p>
          <p><strong>Payment ID:</strong> ${p.paymentId}</p>
          <p><strong>Participants:</strong></p>
          <ul>
            ${p.participants.map(pt => `<li>${pt.name} (${pt.email})</li>`).join("")}
          </ul>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("Error fetching profile data:", err);
    passesList.innerHTML = `<p class="no-passes">Failed to load data.</p>`;
  }
});

// 🚪 Logout (Desktop + Mobile)
document.addEventListener("DOMContentLoaded", () => {
  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");

  const logout = async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (e) {
      alert("Logout failed: " + e.message);
    }
  };

  if (logoutDesktop) logoutDesktop.addEventListener("click", logout);
  if (logoutMobile) logoutMobile.addEventListener("click", logout);

  // 📱 Navbar toggle
  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      document.getElementById("menu").classList.toggle("active");
    });
  }
});
