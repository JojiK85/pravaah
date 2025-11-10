let selectedPass = null;
let selectedPrice = 0;
let total = 0;

const selectionArea = document.getElementById("selectionArea");
const selectedPassText = document.getElementById("selectedPass");
const totalAmount = document.getElementById("totalAmount");
const participantForm = document.getElementById("participantForm");
const payBtn = document.getElementById("payBtn");

document.querySelectorAll(".select-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const card = e.target.closest(".pass-card");
    selectedPass = card.dataset.name;
    selectedPrice = parseInt(card.dataset.price);
    selectionArea.classList.remove("hidden");
    selectedPassText.innerText = `Selected: ${selectedPass} — ₹${selectedPrice}`;
    totalAmount.innerText = `Total: ₹${selectedPrice}`;
    payBtn.style.display = "none";
    participantForm.innerHTML = "";
    total = 0;
  });
});

document.getElementById("generateForm").addEventListener("click", (e) => {
  e.preventDefault();
  const num = parseInt(document.getElementById("numParticipants").value);
  if (!num || num <= 0) return alert("Enter valid number of participants.");

  participantForm.innerHTML = "";
  for (let i = 1; i <= num; i++) {
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

  total = selectedPrice * num;
  totalAmount.innerText = `Total: ₹${total}`;
  payBtn.style.display = "inline-block";
});

payBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (total === 0) return alert("Please add participants.");

  const names = [...document.querySelectorAll(".pname")].map(i => i.value.trim());
  const emails = [...document.querySelectorAll(".pemail")].map(i => i.value.trim());
  const phones = [...document.querySelectorAll(".pphone")].map(i => i.value.trim());
  const colleges = [...document.querySelectorAll(".pcollege")].map(i => i.value.trim());

  if (names.includes("") || emails.includes("") || phones.includes("") || colleges.includes("")) {
    alert("Please fill all participant details before proceeding.");
    return;
  }

  try {
    const options = {
      key: "rzp_test_Re1mOkmIGroT2c", // Replace with your Razorpay key
      amount: total * 100,
      currency: "INR",
      name: "PRAVAAH 2026",
      description: `${selectedPass} Registration`,
      image: "pravah-logo.png",
      handler: function (response) {
        alert("✅ Payment Successful! ID: " + response.razorpay_payment_id);

        fetch("https://script.google.com/macros/s/AKfycbzdSM1ItsgBpgHA1HIs8Xj1AViZItclYUkCT9gFOrXBwW6GbFy1HD3gBxMhdCfAK_WN/exec", {
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
        })
        .then(res => res.text())
        .then(() => {
          window.location.href = "payment_success.html";
        })
        .catch(err => {
          console.error(err);
          window.location.href = "payment_failure.html?reason=DataNotSaved";
        });
      },
      modal: {
        ondismiss: function() {
          window.location.href = "payment_failure.html?reason=UserCancelled";
        }
      },
      theme: { color: "#00ffff" },
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (response) {
      window.location.href = `payment_failure.html?reason=${encodeURIComponent(response.error.description || "PaymentFailed")}`;
    });

    rzp.open();
  } catch (error) {
    console.error("Razorpay Error:", error);
    window.location.href = "payment_failure.html?reason=RazorpayError";
  }
});

