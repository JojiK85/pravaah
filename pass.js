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

// 🔹 Pass selection
document.querySelectorAll(".select-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const card = e.target.closest(".pass-card");
    selectedPass = card.dataset.name;
    selectedPrice = parseInt(card.dataset.price);
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

// 🔹 Dynamic participant form
function updateParticipantForm(count) {
  participantForm.innerHTML = "";
  if (count === 0) {
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

// 🔹 + / - buttons
increaseBtn.addEventListener("click", () => {
  let value = parseInt(numInput.value);
  if (value < parseInt(numInput.max)) {
    numInput.value = value + 1;
    updateParticipantForm(value + 1);
  }
});
decreaseBtn.addEventListener("click", () => {
  let value = parseInt(numInput.value);
  if (value > 0) {
    numInput.value = value - 1;
    updateParticipantForm(value - 1);
  }
});

// ✅ Razorpay + Google Sheet
payBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (total === 0) return alert("Please add participants first.");

  const names = [...document.querySelectorAll(".pname")].map(i => i.value.trim());
  const emails = [...document.querySelectorAll(".pemail")].map(i => i.value.trim());
  const phones = [...document.querySelectorAll(".pphone")].map(i => i.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map(i => i.value.trim());

  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !emails[i] || !phones[i] || !colleges[i]) {
      alert(`⚠️ Fill all fields for Participant ${i + 1}`);
      return;
    }
  }

  try {
    const options = {
      key: "rzp_test_Re1mOkmIGroT2c",
      amount: total * 100,
      currency: "INR",
      name: "PRAVAAH 2026",
      description: `${selectedPass} Registration`,
      image: "pravah-logo.png",

      handler: async function (response) {
        clearInterval(timerInterval);
        timerDisplay.style.display = "none";

        const scriptURL = "https://script.google.com/macros/s/AKfycbwHR5zp3-09nakNxpryLvtmcSUebhkfaohrYWvhlnh32mt0wFfljkqO5JoOJtFsuudJfw/exec";
        try {
          const res = await fetch(scriptURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              passType: selectedPass,
              totalAmount: total,
              participants: names.map((name, i) => ({
                name,
                email: emails[i],
                phone: phones[i],
                college: colleges[i],
              })),
            }),
          });

          const data = await res.json();
          console.log("🟢 Script Response:", data);

          if (data.status === "success") {
            alert("✅ Payment successful & data recorded!");
            window.location.href = "payment_success.html";
          } else {
            alert("⚠️ Payment done but data not recorded.");
            window.location.href = "payment_success.html";
          }
        } catch (err) {
          console.error("❌ Network error:", err);
          alert("⚠️ Payment done but data not recorded (network error).");
          window.location.href = "payment_success.html";
        }
      },
      theme: { color: "#00ffff" },
    };

    const rzp = new Razorpay(options);
    let timeLeft = 300;
    timerDisplay.style.display = "block";
    const timerInterval = setInterval(() => {
      timeLeft--;
      const min = Math.floor(timeLeft / 60);
      const sec = (timeLeft % 60).toString().padStart(2, "0");
      timerDisplay.textContent = `⏳ Payment window: ${min}:${sec}`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        rzp.close();
        alert("⚠️ Payment window expired. Try again.");
      }
    }, 1000);

    rzp.open();

  } catch (error) {
    console.error("❌ Razorpay Error:", error);
    window.location.href = "payment_failure.html";
  }
});
