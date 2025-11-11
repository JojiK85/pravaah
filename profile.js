import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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
const storage = getStorage(app);

// 🔗 Google Apps Script Backend
const scriptURL = "https://script.google.com/macros/s/AKfycbyC2AZkrZA1aIkIU0fGFUBswnn9usKOpV1VU2nYoh-tAnBYftx1jOV3GWV-8La-Q--I/exec";

// ===============================
// 🔔 Toast Notification Utility
// ===============================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// ===============================
// 🔐 USER SESSION & DATA HANDLER
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // 🔗 Element References
  const userPhoto = document.getElementById("userPhoto");
  const uploadPhotoInput = document.getElementById("uploadPhoto");
  const uploadOptions = document.getElementById("uploadOptions");
  const driveUploadBtn = document.getElementById("driveUploadBtn");

  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userPhoneEl = document.getElementById("userPhone");
  const userCollegeEl = document.getElementById("userCollege");
  const passesList = document.getElementById("passesList");

  passesList.innerHTML = `<p class="no-passes">⏳ Loading your passes...</p>`;

  // 🧠 Basic Info
  userEmailEl.textContent = user.email;
  userNameEl.textContent = user.displayName || "PRAVAAH User";
  userPhoto.src = user.photoURL || "default-avatar.png";

  // ==========================================
  // 🎟 LOAD PASSES FROM GOOGLE SHEET
  // ==========================================
  try {
    const res = await fetch(`${scriptURL}?email=${encodeURIComponent(user.email)}`);
    const passes = await res.json();

    if (!passes || passes.length === 0) {
      passesList.innerHTML = `<p class="no-passes">❌ No passes yet. Not registered.</p>`;
      return;
    }

    // Group passes by Payment ID
    const grouped = {};
    passes.forEach(p => {
      if (!grouped[p.paymentId]) grouped[p.paymentId] = [];
      grouped[p.paymentId].push(p);
    });

    passesList.innerHTML = Object.entries(grouped)
      .map(([paymentId, items]) => `
        <div class="pass-item">
          <h3>${items[0].passType}</h3>
          <p><strong>Payment ID:</strong> ${paymentId}</p>
          <p><strong>Total Amount:</strong> ₹${items[0].totalAmount}</p>
          <p><strong>Participants:</strong></p>
          <ul>
            ${items.map(p => `<li>${p.name} (${p.email}, ${p.phone}) — ${p.college}</li>`).join("")}
          </ul>
        </div>
      `).join("");

  } catch (err) {
    console.error("❌ Error fetching passes:", err);
    passesList.innerHTML = `<p class="no-passes">⚠️ Unable to load passes. Try again later.</p>`;
  }

  // ==========================================
  // 📸 UPLOAD OPTIONS AFTER CLICK
  // ==========================================
  userPhoto.addEventListener("click", () => {
    uploadOptions.classList.toggle("hidden");
  });

  // Add “Upload from Device” button dynamically if missing
  if (!document.getElementById("deviceUploadBtn")) {
    const deviceBtn = document.createElement("button");
    deviceBtn.id = "deviceUploadBtn";
    deviceBtn.className = "upload-btn";
    deviceBtn.innerHTML = `<i class="fa-solid fa-desktop"></i> Upload from Device`;
    uploadOptions.prepend(deviceBtn);

    deviceBtn.addEventListener("click", () => {
      uploadPhotoInput.click();
      uploadOptions.classList.add("hidden");
    });
  }

  // Upload from local device
  uploadPhotoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => (userPhoto.src = ev.target.result);
    reader.readAsDataURL(file);

    try {
      showToast("📸 Uploading photo...", "info");
      const storageRef = ref(storage, `profilePhotos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL });
      userPhoto.src = photoURL;
      showToast("✅ Profile photo updated successfully!", "success");
    } catch (err) {
      console.error("Upload error:", err);
      showToast("❌ Upload failed. Try again.", "error");
    }
  });

  // Upload from Google Drive
  driveUploadBtn.addEventListener("click", async () => {
    uploadOptions.classList.add("hidden");
    const driveLink = prompt("📂 Paste your Google Drive image link here:");
    if (!driveLink || !driveLink.includes("https://drive.google.com")) {
      showToast("⚠️ Invalid Google Drive link.", "error");
      return;
    }

    const fileIdMatch = driveLink.match(/[-\\w]{25,}/);
    if (!fileIdMatch) {
      showToast("⚠️ Invalid link format.", "error");
      return;
    }

    const fileId = fileIdMatch[0];
    const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;

    try {
      await updateProfile(user, { photoURL: directLink });
      userPhoto.src = directLink;
      showToast("✅ Profile photo updated from Google Drive!", "success");
    } catch (err) {
      console.error("Drive update error:", err);
      showToast("❌ Failed to set photo.", "error");
    }
  });
});

// ===============================
// 🚪 LOGOUT HANDLER
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");

  const logout = async () => {
    try {
      await signOut(auth);
      showToast("👋 Logged out successfully!", "success");
      setTimeout(() => (window.location.href = "index.html"), 1500);
    } catch (e) {
      showToast("❌ Logout failed.", "error");
    }
  };

  logoutDesktop?.addEventListener("click", logout);
  logoutMobile?.addEventListener("click", logout);
});

// ===============================
// 🔔 TOAST STYLING
// ===============================
const style = document.createElement("style");
style.innerHTML = `
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 25px;
  border-radius: 25px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.95rem;
  opacity: 0;
  pointer-events: none;
  transition: all 0.4s ease;
  z-index: 9999;
  border: 1px solid cyan;
  box-shadow: 0 0 15px rgba(0,255,255,0.5);
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.toast.success { border-color: #00ff99; color: #00ffcc; }
.toast.error { border-color: #ff5555; color: #ff8888; }
.toast.info { border-color: cyan; color: cyan; }
`;
document.head.appendChild(style);
