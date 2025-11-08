const monthYear = document.getElementById("monthYear");
const calendar = document.getElementById("calendar");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const feedList = document.getElementById("feedList");

let currentDate = new Date();

/* Chronicle Feeds by Date */
const feedsByDate = {
  "2025-11-07": [
    { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }
  ],
  "2025-11-08": [
    { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }
  ],
  "2025-11-09": [
    { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }
  ],
  "2025-11-10": [
    { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }
  ]
};

// Default feed
const defaultFeed = [
  { img: "DSC09133.JPG", name: "Pravaah", text: "2nd Edition", time: "11:59" }
];

// Render feed with smooth fade transition
function renderFeed(dateKey) {
  feedList.classList.add("fade-out");
  setTimeout(() => {
    feedList.innerHTML = ""; // clear previous feed

    const data = feedsByDate[dateKey] || defaultFeed;

    data.forEach(feed => {
      const item = document.createElement("div");
      item.classList.add("feed-item");
      item.innerHTML = `
        <img src="${feed.img}" alt="${feed.name}">
        <div class="feed-details">
          <h4>${feed.name}</h4>
          <p>${feed.text}</p>
        </div>
        <div class="feed-time">${feed.time}</div>
      `;
      feedList.appendChild(item);
    });

    feedList.classList.remove("fade-out");
    feedList.classList.add("fade-in");
    setTimeout(() => feedList.classList.remove("fade-in"), 600);
  }, 300);
}

// Render calendar with month transition
function renderCalendar(date, transition = false) {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (transition) calendar.classList.add("fade-out");

  setTimeout(() => {
    monthYear.innerText = `${date.toLocaleString("default", { month: "long" })} ${year}`;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendar.innerHTML = "";

    // Empty placeholders for days before 1st
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      calendar.appendChild(empty);
    }

    // Create days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = document.createElement("div");
      day.classList.add("day");
      day.innerText = i;

      const today = new Date();
      if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        day.classList.add("today");
      }

      day.addEventListener("click", (e) => {
        document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
        e.target.classList.add("selected");
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        renderFeed(key);
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

// Navigation for months
prevMonth.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate, true);
};

nextMonth.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate, true);
};

// Initialize
renderCalendar(currentDate);
renderFeed(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`);

const mainVideo = document.getElementById("mainVideo");
const aftermovieBtn = document.getElementById("aftermovieBtn");
const themeBtn = document.getElementById("themeBtn");

aftermovieBtn.addEventListener("click", () => {
  mainVideo.src = "aftermovie.mp4";
  aftermovieBtn.classList.add("active");
  themeBtn.classList.remove("active");
  mainVideo.play();
});

themeBtn.addEventListener("click", () => {
  mainVideo.src = "themevideo.mp4";
  themeBtn.classList.add("active");
  aftermovieBtn.classList.remove("active");
  mainVideo.play();
});

// 📱 Mobile Navbar Toggle
document.getElementById('mobileMenu').addEventListener('click', () => {
  document.getElementById('menu').classList.toggle('active');
});
document.querySelectorAll('#menu a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('menu').classList.remove('active');
  });
});
