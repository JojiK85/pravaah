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

// 🔗 Google Apps Script Backend (Profiles + Registrations)
const scriptURL = "https://script.google.com/macros/s/AKfycbzE3cOz2wpoGWQWIYdsF4pRDC0FhsPrcRFurkbAB0ogeFqDsD9dqqvoVQr022NfRgol-w/exec";

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
  const userPhoto       = document.getElementById("userPhoto");
  const uploadPhotoInput= document.getElementById("uploadPhoto");
  const uploadOptions   = document.getElementById("uploadOptions");
  const driveUploadBtn  = document.getElementById("driveUploadBtn");

  const userNameEl   = document.getElementById("userName");
  const userEmailEl  = document.getElementById("userEmail");
  const userPhoneEl  = document.getElementById("userPhone");
  const userCollegeEl= document.getElementById("userCollege");
  const passesList   = document.getElementById("passesList");

  if (passesList) {
    passesList.innerHTML = `<p class="no-passes">⏳ Loading your passes...</p>`;
  }

  // 🧠 Basic Info
  if (userEmailEl) userEmailEl.textContent = user.email;
  if (userNameEl)  userNameEl.textContent  = user.displayName || "PRAVAAH User";
  if (userPhoto)   userPhoto.src = user.photoURL || "default-avatar.png";

  // ===============================
  // 📡 Fetch Profile from Google Sheet (Profiles Sheet)
  // ===============================
  try {
    const profileRes  = await fetch(`${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`);
    const profileData = await profileRes.json();

    if (profileData && profileData.name) {
      if (userPhoneEl)   userPhoneEl.textContent   = profileData.phone   || "Not provided";
      if (userCollegeEl) userCollegeEl.textContent = profileData.college || "Not provided";

      localStorage.setItem("profileData", JSON.stringify({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        college: profileData.college
      }));
    } else {
      // ❌ Not found — new login, add to Profiles Sheet
      if (userPhoneEl)   userPhoneEl.textContent   = "Not provided";
      if (userCollegeEl) userCollegeEl.textContent = "Not provided";

      const newProfile = {
        name: user.displayName || "PRAVAAH User",
        email: user.email,
        phone: "",
        college: ""
      };

      // FIXED: avoid CORS preflight — use text/plain (or sendBeacon)
      const payload = JSON.stringify(newProfile);
      let queued = false;
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "text/plain" });
          queued = navigator.sendBeacon(scriptURL, blob);
        }
      } catch (_) {}

      if (!queued) {
        await fetch(scriptURL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: payload
        });
      }

      localStorage.setItem("profileData", JSON.stringify(newProfile));
      console.log("🆕 New user profile added to sheet:", newProfile);
    }
  } catch (err) {
    console.error("⚠️ Error fetching or updating profile:", err);
  }

  // ===============================
  // 🎟 LOAD PASSES FROM GOOGLE SHEET (Registrations)
  // ===============================
  try {
    const res = await fetch(`${scriptURL}?email=${encodeURIComponent(user.email)}`);
    const passes = await res.json();

    if (!passesList) {
      // If UI node is missing, just stop here
      return;
    }

    if (!passes || passes.length === 0) {
      passesList.innerHTML = `<p class="no-passes">❌ No passes yet. Not registered.</p>`;
      return;
    }

    // Group passes by Payment ID
    const grouped = {};
    passes.forEach((p) => {
      if (!grouped[p.paymentId]) grouped[p.paymentId] = [];
      grouped[p.paymentId].push(p);
    });

    passesList.innerHTML = Object.entries(grouped)
      .map(
        ([paymentId, items]) => `
        <div class="pass-item">
          <h3>${items[0].passType}</h3>
          <p><strong>Payment ID:</strong> ${paymentId}</p>
          <p><strong>Total Amount:</strong> ₹${items[0].totalAmount}</p>
          <p><strong>Participants:</strong></p>
          <ul>
            ${items.map(
              (p) => `<li>${p.name} (${p.email}, ${p.phone}) — ${p.college}</li>`
            ).join("")}
          </ul>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("❌ Error fetching passes:", err);
    if (passesList) {
      passesList.innerHTML = `<p class="no-passes">⚠️ Unable to load passes. Try again later.</p>`;
    }
  }

  // ===============================
  // 📸 UPLOAD PHOTO OPTIONS
  // ===============================
  if (userPhoto && uploadOptions) {
    userPhoto.addEventListener("click", () => {
      const isHidden = uploadOptions.classList.toggle("hidden");
      uploadOptions.style.display = isHidden ? "none" : "flex";
    });
  }

  // Add “Upload from Device” button if container exists
  if (uploadOptions && !document.getElementById("deviceUploadBtn")) {
    const deviceBtn = document.createElement("button");
    deviceBtn.id = "deviceUploadBtn";
    deviceBtn.className = "upload-btn";
    deviceBtn.innerHTML = `<i class="fa-solid fa-desktop"></i> Upload from Device`;
    uploadOptions.prepend(deviceBtn);

    deviceBtn.addEventListener("click", () => {
      if (uploadPhotoInput) {
        uploadPhotoInput.click();
      }
      uploadOptions.classList.add("hidden");
      uploadOptions.style.display = "none";
    });
  }

  // 📤 Upload from device (guard element)
  if (uploadPhotoInput) {
    uploadPhotoInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => { if (userPhoto) userPhoto.src = ev.target.result; };
      reader.readAsDataURL(file);

      try {
        showToast("📸 Uploading photo...", "info");
        const storageRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        await updateProfile(user, { photoURL });
        if (userPhoto) userPhoto.src = photoURL;
        showToast("✅ Profile photo updated successfully!", "success");
      } catch (err) {
        console.error("Upload error:", err);
        showToast("❌ Upload failed. Try again.", "error");
      }
    });
  }

  // ☁️ Upload from Google Drive (guard element)
  if (driveUploadBtn) {
    driveUploadBtn.addEventListener("click", async () => {
      uploadOptions?.classList.add("hidden");
      if (uploadOptions) uploadOptions.style.display = "none";

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
        await updateProfile(user, { photoURL: directLink });
        if (userPhoto) userPhoto.src = directLink;
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
  const logoutMobile  = document.getElementById("logoutMobile");

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
  background: rgba(0, 0, 0, 0.85);
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
.toast.error   { border-color: #ff5555; color: #ff8888; }
.toast.info    { border-color: cyan;    color: cyan; }
`;
document.head.appendChild(style);
