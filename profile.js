import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
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
const db = getFirestore(app);
const storage = getStorage(app);

// 🔔 Toast Notification Utility
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
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userPhoneEl = document.getElementById("userPhone");
  const userCollegeEl = document.getElementById("userCollege");
  const passesList = document.getElementById("passesList");

  passesList.innerHTML = `<p class="no-passes">⏳ Loading your passes...</p>`;

  // 🧠 Basic Info
  userEmailEl.textContent = user.email;
  userNameEl.textContent = user.displayName || "PRAVAAH User";

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  // 🖼 Profile Photo Logic
  if (user.photoURL) {
    userPhoto.src = user.photoURL;
  } else if (snap.exists() && snap.data().photoURL) {
    userPhoto.src = snap.data().photoURL;
  } else {
    userPhoto.src = "default-avatar.png";
  }

  // 🎟 Display Passes
  if (snap.exists()) {
    const data = snap.data();
    userPhoneEl.textContent = data.phone || "Not provided";
    userCollegeEl.textContent = data.college || "Not provided";

    const passes = data.passes || [];
    passesList.innerHTML = passes.length
      ? passes.map(p => `
        <div class="pass-item">
          <h3>${p.passType}</h3>
          <p><strong>Amount:</strong> ₹${p.totalAmount}</p>
          <p><strong>Payment ID:</strong> ${p.paymentId}</p>
          <p><strong>Participants:</strong></p>
          <ul>${p.participants.map(pt => `<li>${pt.name} (${pt.email})</li>`).join("")}</ul>
        </div>
      `).join("")
      : `<p class="no-passes">❌ No passes yet. Not registered.</p>`;
  } else {
    passesList.innerHTML = `<p class="no-passes">❌ No passes yet. Not registered.</p>`;
  }

  // ===============================
  // 📸 Upload from Device
  // ===============================
  document.getElementById("uploadPhoto").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Instant preview
    const reader = new FileReader();
    reader.onload = (ev) => (userPhoto.src = ev.target.result);
    reader.readAsDataURL(file);

    try {
      showToast("📸 Uploading photo...", "info");
      const storageRef = ref(storage, `profilePhotos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await setDoc(userRef, { photoURL }, { merge: true });
      await updateProfile(user, { photoURL });

      userPhoto.src = photoURL;
      showToast("✅ Profile photo updated successfully!", "success");
    } catch (err) {
      console.error("Upload error:", err);
      showToast("❌ Upload failed. Try again.", "error");
    }
  });

  // ===============================
  // ☁️ Upload from Google Drive Link
  // ===============================
  const driveBtn = document.getElementById("driveUploadBtn");
  if (driveBtn) {
    driveBtn.addEventListener("click", async () => {
      const driveLink = prompt("📂 Paste your Google Drive image link here:");
      if (!driveLink || !driveLink.includes("https://drive.google.com")) {
        showToast("⚠️ Invalid Google Drive link.", "error");
        return;
      }

      const fileIdMatch = driveLink.match(/[-\w]{25,}/);
      if (!fileIdMatch) {
        showToast("⚠️ Invalid link format.", "error");
        return;
      }

      const fileId = fileIdMatch[0];
      const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;

      try {
        await setDoc(userRef, { photoURL: directLink }, { merge: true });
        await updateProfile(user, { photoURL: directLink });
        userPhoto.src = directLink;
        showToast("✅ Profile photo updated from Google Drive!", "success");
      } catch (err) {
        console.error("Drive update error:", err);
        showToast("❌ Failed to set photo.", "error");
      }
    });
  }
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
// 🔔 TOAST CSS
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
.toast.success {
  border-color: #00ff99;
  color: #00ffcc;
}
.toast.error {
  border-color: #ff5555;
  color: #ff8888;
}
.toast.info {
  border-color: cyan;
  color: cyan;
}`;
document.head.appendChild(style);
