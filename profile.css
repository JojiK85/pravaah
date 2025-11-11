@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&display=swap');

/* ---------- BASE ---------- */
body {
  font-family: 'Orbitron', sans-serif;
  background: linear-gradient(120deg, #2c1a55, #3e5d75, #022c43, #5b2a86);
  background-size: 400% 400%;
  animation: gradientMove 15s ease infinite;
  color: white;
  margin: 0;
  padding-top: 6rem;
  overflow-x: hidden;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ---------- PROFILE SECTION ---------- */
.profile-section {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.profile-container {
  background: rgba(0, 0, 0, 0.75);
  border: 1.5px solid cyan;
  border-radius: 20px;
  box-shadow: 0 0 25px rgba(0, 255, 255, 0.3);
  width: 90%;
  max-width: 1000px;
  padding: 40px;
  color: #e3f8ff;
  transition: 0.3s ease;
}

/* ---------- HEADER (PHOTO + INFO) ---------- */
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

/* ---------- PROFILE PHOTO ---------- */
.profile-photo {
  text-align: center;
  flex: 0 0 180px;
}

.photo-wrapper {
  position: relative;
  display: inline-block;
}

.profile-photo img {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 2px solid cyan;
  object-fit: cover;
  box-shadow: 0 0 25px rgba(0, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-photo img:hover {
  transform: scale(1.05);
  box-shadow: 0 0 35px rgba(0, 255, 255, 0.8);
}

/* ---------- CAMERA OVERLAY ---------- */
.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: 0.3s ease;
}

.photo-overlay i {
  color: cyan;
  font-size: 1.8rem;
}

.photo-wrapper:hover .photo-overlay {
  opacity: 1;
  background: rgba(0, 255, 255, 0.35);
  cursor: pointer;
}

/* ---------- UPLOAD OPTIONS ---------- */
.upload-options {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: 0.3s ease;
}

.upload-options.hidden {
  display: none;
}

/* ---------- UPLOAD BUTTONS ---------- */
.upload-btn {
  background: cyan;
  color: black;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
}

.upload-btn i {
  margin-right: 6px;
}

.upload-btn:hover {
  background: #00ffff;
  box-shadow: 0 0 20px cyan;
  transform: scale(1.05);
}

.drive-btn {
  background: #34a853;
  color: white;
  box-shadow: 0 0 10px rgba(52, 168, 83, 0.5);
}

.drive-btn:hover {
  background: #2b8a44;
  box-shadow: 0 0 20px #34a853;
}

/* ---------- PROFILE INFO ---------- */
.profile-info {
  flex: 1;
  min-width: 300px;
}

.profile-info p {
  font-size: 1.15rem;
  margin: 10px 0;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
}

/* ---------- PASSES SECTION ---------- */
.profile-container h2 {
  color: cyan;
  text-shadow: 0 0 10px cyan;
  margin-bottom: 25px;
  text-align: center;
  font-size: 1.9rem;
}

.passes-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 25px;
}

/* ---------- PASS CARD ---------- */
.pass-item {
  background: rgba(0, 0, 0, 0.6);
  border: 1.5px solid rgba(0, 255, 255, 0.6);
  border-radius: 15px;
  padding: 22px;
  width: 340px;
  color: #dff;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  transition: 0.3s ease;
  text-align: left;
}

.pass-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 25px rgba(0, 255, 255, 0.5);
}

.pass-item h3 {
  color: cyan;
  text-shadow: 0 0 8px cyan;
  font-size: 1.4rem;
  margin-bottom: 10px;
}

.pass-item p {
  margin: 5px 0;
  font-size: 1rem;
}

.pass-item ul {
  list-style-type: disc;
  margin-left: 18px;
  font-size: 0.95rem;
  color: #bff;
}

/* ---------- NO PASSES ---------- */
.no-passes {
  color: #ccc;
  text-align: center;
  margin-top: 20px;
  font-style: italic;
  font-size: 1.1rem;
  text-shadow: 0 0 10px rgba(0,255,255,0.3);
}

/* ---------- RESPONSIVE ---------- */
@media (max-width: 900px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 30px;
  }

  .profile-photo img {
    width: 130px;
    height: 130px;
  }

  .profile-info {
    width: 100%;
  }

  .pass-item {
    width: 90%;
  }
}

@media (max-width: 480px) {
  .profile-container {
    padding: 25px;
  }

  .profile-info p {
    font-size: 1rem;
  }

  .upload-btn {
    width: 80%;
  }

  .passes-list {
    flex-direction: column;
    align-items: center;
  }

  .pass-item {
    width: 95%;
  }
}
