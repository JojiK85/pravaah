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
const scriptURL =
  "https://script.google.com/macros/s/AKfycby0ba4ujfw00bRk0w3h7dAhR6QxyNXQZK40BwAAd9vzyXWMNt2ylUdU1fWsdl76CeLB0g/exec";

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

  // 🔗 Elements
  const userPhoto = document.getElementById("userPhoto");
  const uploadPhotoInput = document.getElementById("uploadPhoto");
  const uploadOptions = document.getElementById("uploadOptions");
  const driveUploadBtn = document.getElementById("driveUploadBtn");
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userPhoneInput = document.getElementById("userPhone");
  const userCollegeInput = document.getElementById("userCollege");
  const passesList = document.getElementById("passesList");
  const saveBtn = document.getElementById("saveProfileBtn");

  if (passesList)
    passesList.innerHTML = `<p class="no-passes">⏳ Loading your passes...</p>`;

  // 🧠 Basic Info
  if (userEmailEl) userEmailEl.textContent = user.email;
  if (userNameEl) userNameEl.textContent = user.displayName || "PRAVAAH User";
  if (userPhoto) userPhoto.src = user.photoURL || "default-avatar.png";

  // ===============================
  // 📡 Fetch Profile from Google Sheet
  // ===============================
  try {
    const profileRes = await fetch(
      `${scriptURL}?type=profile&email=${encodeURIComponent(user.email)}`
    );
    const profileData = await profileRes.json();

    if (profileData && profileData.name) {
      userPhoneInput.value = profileData.phone || "";
      userCollegeInput.value = profileData.college || "";

      localStorage.setItem(
        "profileData",
        JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          college: profileData.college
        })
      );
    } else {
      const newProfile = {
        name: user.displayName || "PRAVAAH User",
        email: user.email,
        phone: "",
        college: ""
      };
      await saveProfileToSheet(newProfile);
      localStorage.setItem("profileData", JSON.stringify(newProfile));
    }
  } catch (err) {
    console.error("⚠️ Error fetching/updating profile:", err);
  }

  // ===============================
  // ✏️ Enable Field Editing
  // ===============================
  document.querySelectorAll(".edit-icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      const target = icon.getAttribute("data-target");
      const input = document.getElementById(target);

      if (input.hasAttribute("readonly")) {
        input.removeAttribute("readonly");
        input.classList.add("editing");
        input.focus();
        icon.classList.replace("fa-pen", "fa-check");
        saveBtn.classList.remove("hidden");
        showToast(`✏️ Editing ${target === "userPhone" ? "Phone" : "College"}`, "info");
      } else {
        input.setAttribute("readonly", true);
        input.classList.remove("editing");
        icon.classList.replace("fa-check", "fa-pen");
      }
    });
  });

  // ===============================
  // 💾 Save Profile Changes
  // ===============================
  saveBtn?.addEventListener("click", async () => {
    const phone = userPhoneInput.value.trim();
    const college = userCollegeInput.value.trim();

    try {
      await saveProfileToSheet({
        name: user.displayName,
        email: user.email,
        phone,
        college
      });

      userPhoneInput.classList.add("saved");
      userCollegeInput.classList.add("saved");
      setTimeout(() => {
        userPhoneInput.classList.remove("saved");
        userCollegeInput.classList.remove("saved");
      }, 1000);

      localStorage.setItem(
        "profileData",
        JSON.stringify({
          name: user.displayName,
          email: user.email,
          phone,
          college
        })
      );

      showToast("✅ Profile updated successfully!", "success");
      saveBtn.classList.add("hidden");
    } catch (err) {
      console.error("⚠️ Save failed:", err);
      showToast("❌ Failed to save changes.", "error");
    }
  });

  // ===============================
  // 📸 Upload Photo (Device or Drive)
  // ===============================
  if (userPhoto && uploadOptions) {
    userPhoto.addEventListener("click", () => {
      const isHidden = uploadOptions.classList.toggle("hidden");
      uploadOptions.style.display = isHidden ? "none" : "flex";
    });
  }

  if (uploadOptions && !document.getElementById("deviceUploadBtn")) {
    const deviceBtn = document.createElement("button");
    deviceBtn.id = "deviceUploadBtn";
    deviceBtn.className = "upload-btn";
    deviceBtn.innerHTML = `<i class="fa-solid fa-desktop"></i> Upload from Device`;
    uploadOptions.prepend(deviceBtn);

    deviceBtn.addEventListener("click", () => {
      uploadPhotoInput?.click();
      uploadOptions.classList.add("hidden");
      uploadOptions.style.display = "none";
    });
  }

  // 📤 Upload from device
  uploadPhotoInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
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

      await saveProfileToSheet({
        name: user.displayName,
        email: user.email,
        phone: userPhoneInput.value,
        college: userCollegeInput.value,
        photo: photoURL
      });

      showToast("✅ Profile photo updated successfully!", "success");
    } catch (err) {
      console.error("Upload error:", err);
      showToast("❌ Upload failed. Try again.", "error");
    }
  });

  // ☁️ Upload from Google Drive
  driveUploadBtn?.addEventListener("click", async () => {
    uploadOptions?.classList.add("hidden");
    uploadOptions.style.display = "none";

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
      userPhoto.src = directLink;
      await saveProfileToSheet({
        name: user.displayName,
        email: user.email,
        phone: userPhoneInput.value,
        college: userCollegeInput.value,
        photo: directLink
      });
      showToast("✅ Profile photo updated from Google Drive!", "success");
    } catch (err) {
      console.error("Drive update error:", err);
      showToast("❌ Failed to set photo.", "error");
    }
  });

  // ===============================
  // 🎟 LOAD PASSES
  // ===============================
  try {
    const res = await fetch(`${scriptURL}?email=${encodeURIComponent(user.email)}`);
    const passes = await res.json();

    if (!passesList) return;

    if (!passes || passes.length === 0) {
      passesList.innerHTML = `<p class="no-passes">❌ No passes yet. Not registered.</p>`;
      return;
    }

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
            <ul>${items
              .map(
                (p) =>
                  `<li>${p.name} (${p.email}, ${p.phone || "-"}) — ${p.college || "-"}</li>`
              )
              .join("")}</ul>
          </div>`
      )
      .join("");
  } catch (err) {
    console.error("❌ Error fetching passes:", err);
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
// 🧩 Save Profile to Google Sheets
// ===============================
async function saveProfileToSheet(profile) {
  const payload = JSON.stringify({
    name: profile.name.trim(),
    email: profile.email.trim().toLowerCase(),
    phone: profile.phone || "",
    college: profile.college || "",
    photo: profile.photo || ""
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "text/plain" });
      navigator.sendBeacon(scriptURL, blob);
    } else {
      await fetch(scriptURL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload
      });
    }
  } catch (err) {
    console.error("⚠️ Failed to save profile:", err);
  }
}

// ===============================
// 🔔 Toast Styling
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
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.toast.success { border-color: #00ff99; color: #00ffcc; }
.toast.error { border-color: #ff5555; color: #ff8888; }
.toast.info { border-color: cyan; color: cyan; }
`;
document.head.appendChild(style);
