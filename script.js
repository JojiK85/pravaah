import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  /* 🔹 FIREBASE CONFIG */
  const firebaseConfig = {
    apiKey: "AIzaSyCbXKleOw4F46gFDXz2Wynl3YzPuHsVwh8",
    authDomain: "pravaah-55b1d.firebaseapp.com",
    projectId: "pravaah-55b1d",
    storageBucket: "pravaah-55b1d.appspot.com",
    messagingSenderId: "287687647267",
    appId: "1:287687647267:web:7aecd603ee202779b89196"
  };

  // ✅ Prevent duplicate app initialization
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);

  /* 🧩 LOGOUT HANDLER */
  const logoutDesktop = document.getElementById("logoutDesktop");
  const logoutMobile = document.getElementById("logoutMobile");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  };

  if (logoutDesktop) logoutDesktop.addEventListener("click", handleLogout);
  if (logoutMobile) logoutMobile.addEventListener("click", handleLogout);

  /* 📅 CALENDAR + FEED LOGIC */
  const monthYear = document.getElementById("monthYear");
  const calendar = document.getElementById("calendar");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");
  const feedList = document.getElementById("feedList");
  let currentDate = new Date();

  const feedsByDate = {
    "2025-11-07": [{ img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }]
  };

  const defaultFeed = [{ img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }];

  function renderFeed(dateKey) {
    feedList.classList.add("fade-out");
    setTimeout(() => {
      feedList.innerHTML = "";
      const data = feedsByDate[dateKey] || defaultFeed;
      data.forEach(feed => {
        const item = document.createElement("div");
        item.classList.add("feed-item");
        item.innerHTML = `
          <img src="${feed.img}" alt="${feed.name}">
          <div class="feed-details"><h4>${feed.name}</h4><p>${feed.text}</p></div>
          <div class="feed-time">${feed.time}</div>
        `;
        feedList.appendChild(item);
      });
      feedList.classList.remove("fade-out");
      feedList.classList.add("fade-in");
      setTimeout(() => feedList.classList.remove("fade-in"), 600);
    }, 300);
  }

  function renderCalendar(date, transition = false) {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (transition) calendar.classList.add("fade-out");
    setTimeout(() => {
      monthYear.innerText = `${date.toLocaleString("default", { month: "long" })} ${year}`;
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      calendar.innerHTML = "";
      for (let i = 0; i < firstDay; i++) calendar.appendChild(document.createElement("div"));
      for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement("div");
        day.classList.add("day");
        day.innerText = i;
        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear())
          day.classList.add("today");
        day.addEventListener("click", (e) => {
          document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
          e.target.classList.add("selected");
          renderFeed(`${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`);
        });
        calendar.appendChild(day);
      }
      if (transition) {
        calendar.classList.remove("fade-out");
        calendar.classList.add("fade-in");
        setTimeout(() => calendar.classList.remove("fade-in"), 600);
      }
    }, transition ? 300 : 0);
  }

  prevMonth.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate, true);
  };
  nextMonth.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate, true);
  };
  renderCalendar(currentDate);
  renderFeed(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`);

  /* 🎥 VIDEO SWITCH */
  const mainVideo = document.getElementById("mainVideo");
  const aftermovieBtn = document.getElementById("aftermovieBtn");
  const themeBtn = document.getElementById("themeBtn");

  if (mainVideo && aftermovieBtn && themeBtn) {
    aftermovieBtn.addEventListener("click", () => {
      mainVideo.src = "aftermovie.mp4";
      aftermovieBtn.classList.add("active");
      themeBtn.classList.remove("active");
    });

    themeBtn.addEventListener("click", () => {
      mainVideo.src = "themevideo.mp4";
      themeBtn.classList.add("active");
      aftermovieBtn.classList.remove("active");
    });
  }

  /* 📱 NAVBAR TOGGLE */
  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
        menu.classList.remove("active");
      }
    });

    document.querySelectorAll("#menu a").forEach(link => {
      link.addEventListener("click", () => menu.classList.remove("active"));
    });
  }
});

/* ============================
   PRAVAAH Highlights: Seamless + Scrollable + Fast
   ============================ */
(function initHighlights() {
  const viewport = document.getElementById('hlViewport');
  const track = document.getElementById('hlTrack');
  if (!viewport || !track) return;

  // --- CONFIG ---
  const GAP_PX = 30; // must match CSS gap
  const DESKTOP_SPEED_S = 18; // faster than before
  const MOBILE_SPEED_S = 10;  // even faster on phones
  const MOBILE_BP = 900;

  // keep references to originals (don’t mutate this NodeList after clones)
  const originalSlides = Array.from(track.children).filter(el => !el.hasAttribute('data-clone'));

  // measure the width of a set of elements including gap between them
  function totalWidth(els) {
    if (els.length === 0) return 0;
    let sum = 0;
    els.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      sum += rect.width;
      if (idx !== els.length - 1) sum += GAP_PX; // gap between siblings
    });
    return sum;
  }

  // remove previous clones
  function removeClones() {
    track.querySelectorAll('[data-clone]').forEach(el => el.remove());
  }

  // clone until the total track covers > 2x of the "first-run" so the loop has no gap
  function buildClones() {
    removeClones();

    // ensure images have loaded so widths are correct
    const imgs = track.querySelectorAll('img');
    const loadPromises = Array.from(imgs).map(img => (
      img.complete ? Promise.resolve() : new Promise(res => img.addEventListener('load', res, { once: true }))
    ));

    return Promise.all(loadPromises).then(() => {
      const firstRunWidth = totalWidth(originalSlides);

      // clone until track width >= firstRunWidth * 2
      let currentWidth = totalWidth(Array.from(track.children));
      let cloneRound = 0;
      while (currentWidth < firstRunWidth * 2 && cloneRound < 10) {
        originalSlides.forEach((slide) => {
          const clone = slide.cloneNode(true);
          clone.setAttribute('data-clone', 'true');
          track.appendChild(clone);
        });
        currentWidth = totalWidth(Array.from(track.children));
        cloneRound++;
      }

      // set the exact loop distance to the original block width (no 50% guess)
      track.style.setProperty('--loop-distance', `${firstRunWidth}px`);

      // set speed per device
      const dur = window.innerWidth <= MOBILE_BP ? MOBILE_SPEED_S : DESKTOP_SPEED_S;
      track.style.setProperty('--speed', `${dur}s`);
    });
  }

  // pause helpers
  let pauseTimer = null;
  function pauseTrack(ms = 0) {
    track.classList.add('pause');
    if (pauseTimer) clearTimeout(pauseTimer);
    if (ms > 0) pauseTimer = setTimeout(() => track.classList.remove('pause'), ms);
  }
  function resumeTrack() { track.classList.remove('pause'); }

  // drag to scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;

  viewport.addEventListener('pointerdown', (e) => {
    isDown = true;
    viewport.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startScroll = viewport.scrollLeft;
    pauseTrack(); // pause while dragging
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    viewport.scrollLeft = startScroll - dx;
  });

  viewport.addEventListener('pointerup', (e) => {
    isDown = false;
    viewport.releasePointerCapture(e.pointerId);
    // small delay feels better after drag
    pauseTrack(600);
  });

  viewport.addEventListener('pointerleave', () => {
    if (!isDown) resumeTrack();
    isDown = false;
  });

  // mouse wheel (shift vertical wheel into horizontal)
  viewport.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      viewport.scrollLeft += e.deltaY;
      e.preventDefault();
      pauseTrack(400); // pause briefly on scroll
    }
  }, { passive: false });

  // pause during manual scroll, resume after user stops
  let scrollTimeout;
  viewport.addEventListener('scroll', () => {
    pauseTrack();
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(resumeTrack, 500);
  });

  // rebuild on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => buildClones(), 150);
  });

  // init
  buildClones();
})();
