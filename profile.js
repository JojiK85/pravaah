import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
  authDomain: "pravaah-55b1d.firebaseapp.com",
  projectId: "pravaah-55b1d",
  storageBucket: "pravaah-55b1d.appspot.com",
  messagingSenderId: "287687647267",
  appId: "1:287687647267:web:7aecd603ee202779b89196"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userPhoto = document.getElementById("userPhoto");
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userPhoneEl = document.getElementById("userPhone");
  const userCollegeEl = document.getElementById("userCollege");
  const passesList = document.getElementById("passesList");

  // 🧠 Basic user info
  userEmailEl.textContent = user.email;
  userNameEl.textContent = user.displayName || "PRAVAAH User";

  const refUser = doc(db, "users", user.uid);
  const snap = await getDoc(refUser);

  // 🖼️ Profile photo logic
  if (user.photoURL) {
    userPhoto.src = user.photoURL;
  } else if (snap.exists() && snap.data().photoURL) {
    userPhoto.src = snap.data().photoURL;
  } else {
    userPhoto.src = "default-avatar.png";
  }

  // 🎟️ Pass display
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
      : `<p class="no-passes">Not yet registered.</p>`;
  } else {
    passesList.innerHTML = `<p class="no-passes">Not yet registered.</p>`;
  }

  // 📤 Upload from Device
  document.getElementById("uploadPhoto").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      alert("Uploading your photo... please wait ⏳");
      const storageRef = ref(storage, `profilePhotos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Save URL in Firestore + Auth profile
      await setDoc(refUser, { photoURL }, { merge: true });
      await updateProfile(user, { photoURL });

      userPhoto.src = photoURL;
      alert("✅ Profile photo updated successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Failed to upload photo. Please try again.");
    }
  });

  // ☁️ Google Drive Link Upload
  document.getElementById("driveUploadBtn").addEventListener("click", async () => {
    const driveLink = prompt("📂 Paste your Google Drive image link here:");

    if (driveLink && driveLink.includes("https://drive.google.com")) {
      const fileIdMatch = driveLink.match(/[-\w]{25,}/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[0];
        const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;

        try {
          await setDoc(refUser, { photoURL: directLink }, { merge: true });
          await updateProfile(user, { photoURL: directLink });
          userPhoto.src = directLink;
          alert("✅ Profile photo updated from Google Drive!");
        } catch (err) {
          console.error("Drive link update error:", err);
          alert("❌ Could not set profile photo. Try again later.");
        }
      } else {
        alert("⚠️ Invalid Google Drive link format.");
      }
    } else {
      alert("⚠️ Please paste a valid Google Drive share link.");
    }
  });
});

// 🚪 Logout
document.addEventListener("DOMContentLoaded", () => {
  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");

  const logout = async () => {
    try {
      await signOut(auth);
      alert("👋 Logged out successfully!");
      window.location.href = "index.html";
    } catch (e) {
      alert("Logout failed: " + e.message);
    }
  };

  logoutDesktop?.addEventListener("click", logout);
  logoutMobile?.addEventListener("click", logout);
});
