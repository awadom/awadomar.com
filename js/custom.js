(() => {
  "use strict";

  const scrollIndicator = document.querySelector(".scroll-indicator");
  const year = document.getElementById("year");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatLog = document.getElementById("chat-log");
  const suggestionButtons = document.querySelectorAll("[data-question]");
  const conversation = [];

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const updateScrollIndicator = () => {
    if (!scrollIndicator) return;

    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    scrollIndicator.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  };

  updateScrollIndicator();
  window.addEventListener("scroll", updateScrollIndicator, { passive: true });
  window.addEventListener("resize", updateScrollIndicator);

  const addMessage = (role, text, loading = false) => {
    if (!chatLog) return null;

    const message = document.createElement("div");
    message.className = `chat-message ${role}${loading ? " is-loading" : ""}`;

    if (role === "assistant") {
      const author = document.createElement("span");
      author.className = "chat-author";
      author.textContent = "portfolio.ai";
      message.appendChild(author);
    }

    const content = document.createElement("p");
    content.textContent = text;
    message.appendChild(content);
    chatLog.appendChild(message);
    chatLog.scrollTop = chatLog.scrollHeight;
    return message;
  };

  const setChatBusy = (busy) => {
    if (chatInput) chatInput.disabled = busy;
    if (chatForm) chatForm.querySelector("button").disabled = busy;
    suggestionButtons.forEach((button) => {
      button.disabled = busy;
    });
  };

  const submitQuestion = async (question) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || !chatForm || !chatInput) return;

    addMessage("user", cleanQuestion);
    conversation.push({ role: "user", text: cleanQuestion });
    chatInput.value = "";
    chatInput.style.height = "auto";
    setChatBusy(true);

    const loadingMessage = addMessage("assistant", "Thinking", true);

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanQuestion,
          history: conversation.slice(-6, -1)
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "The portfolio assistant is unavailable.");
      }

      const answer = payload.answer.trim();
      conversation.push({ role: "assistant", text: answer });
      loadingMessage.querySelector("p").textContent = answer;
      loadingMessage.classList.remove("is-loading");
    } catch (error) {
      loadingMessage.querySelector("p").textContent = error.message;
      loadingMessage.classList.remove("is-loading");
    } finally {
      setChatBusy(false);
      chatInput.focus();
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  };

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitQuestion(chatInput.value);
    });

    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
      }
    });

    chatInput.addEventListener("input", () => {
      chatInput.style.height = "auto";
      chatInput.style.height = `${Math.min(chatInput.scrollHeight, 90)}px`;
    });
  }

  suggestionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      submitQuestion(button.dataset.question || "");
    });
  });
})();
