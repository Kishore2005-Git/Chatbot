document.addEventListener("DOMContentLoaded", () => {
    const chatDisplay = document.getElementById("chat-display");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const voiceBtn = document.getElementById("voice-btn");

    sendBtn.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendMessage();
    });

    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage("user", message);
        userInput.value = "";

        fetch("/chat", {  
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API Response:", data);  // Debugging output
            let botReply = data.response || "No response received.";
            appendMessage("bot", botReply);
        })
        .catch(error => {
            console.error("Fetch error:", error);
            appendMessage("bot", "Sorry, something went wrong.");
        });
    }

    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);
        messageElement.textContent = message;

        if (sender === "bot") {
            const copyBtn = document.createElement("button");
            copyBtn.innerHTML = "📋";
            copyBtn.classList.add("copy-btn");
            copyBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(message)
                    .then(() => {
                        copyBtn.innerHTML = "✔";
                        setTimeout(() => copyBtn.innerHTML = "📋", 1000);
                    })
                    .catch(() => {
                        copyBtn.innerHTML = "❌";
                        setTimeout(() => copyBtn.innerHTML = "📋", 1000);
                    });
            });
            messageElement.appendChild(copyBtn);
        }

        chatDisplay.appendChild(messageElement);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }

    // Speech Recognition
    if ("webkitSpeechRecognition" in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = "en-US";

        voiceBtn.addEventListener("click", () => {
            recognition.start();
        });

        recognition.onresult = (event) => {
            userInput.value = event.results[0][0].transcript;
            sendMessage();
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event);
        };
    } else {
        voiceBtn.style.display = "none";  // Hide button if speech recognition isn't supported
    }
});
