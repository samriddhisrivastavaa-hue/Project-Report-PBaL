let smsData = [
    { text: "Your OTP is 456123", type: "otp" },
    { text: "₹2000 debited from your account", type: "transaction" },
    { text: "Win a free iPhone! Click now", type: "spam" },
    { text: "Meeting at 5 PM today", type: "personal" },
    { text: "OTP for login is 889900", type: "otp" },
    { text: "Electricity bill paid successfully", type: "transaction" }
];

// 🔥 SMART CLASSIFIER
function classifySMS(message) {
    let msg = message.toLowerCase();

    let otpPattern = /\b\d{4,6}\b/;

    if (
        (msg.includes("otp") || msg.includes("verification")) &&
        otpPattern.test(msg) &&
        !msg.includes("offer")
    ) return "otp";

    if (
        msg.includes("debited") ||
        msg.includes("credited") ||
        msg.includes("paid") ||
        msg.includes("bill") ||
        msg.includes("account") ||
        msg.includes("data usage")
    ) return "transaction";

    if (
        msg.includes("offer") ||
        msg.includes("flat") ||
        msg.includes("%") ||
        msg.includes("click") ||
        msg.includes("http") ||
        msg.includes("free")
    ) return "spam";

    return "personal";
}

// ➕ ADD SMS
function addSMS() {
    let input = document.getElementById("messageInput");
    let msg = input.value.trim();

    if (msg === "") return;

    let type = classifySMS(msg);

    smsData.unshift({ text: msg, type });

    input.value = "";
    renderSMS("all");
}

// 📄 RENDER
function renderSMS(filter) {
    let list = document.getElementById("smsList");
    list.innerHTML = "";

    let filtered = filter === "all"
        ? smsData
        : smsData.filter(s => s.type === filter);

    filtered.forEach(s => {
        let div = document.createElement("div");
        div.className = "sms-item";
        div.innerHTML = `
            <p>${s.text}</p>
            <span class="tag ${s.type}">${s.type.toUpperCase()}</span>
        `;
        list.appendChild(div);
    });

    updateStats();
}

// 📊 COUNTS
function updateStats() {
    document.getElementById("totalCount").innerText = smsData.length;
    document.getElementById("otpCount").innerText =
        smsData.filter(s => s.type === "otp").length;
    document.getElementById("txnCount").innerText =
        smsData.filter(s => s.type === "transaction").length;
    document.getElementById("spamCount").innerText =
        smsData.filter(s => s.type === "spam").length;
}

// 🎯 FILTER
function filterSMS(type) {
    renderSMS(type);
}

// LOAD
window.onload = () => renderSMS("all");