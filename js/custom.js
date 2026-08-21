(() => {
  "use strict";

  const scrollIndicator = document.querySelector(".scroll-indicator");
  const year = document.getElementById("year");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatLog = document.getElementById("chat-log");
  const chatDiscovery = document.getElementById("chat-discovery");
  const consoleExit = document.getElementById("console-exit");
  const consoleSystems = document.querySelector(".console-systems");
  const consoleContext = document.querySelector(".console-context");
  const heroConsole = document.querySelector(".hero-console");
  const conversation = [];

  const chatSpacer = document.createElement("div");
  chatSpacer.className = "chat-spacer";
  chatSpacer.setAttribute("aria-hidden", "true");
  let lastTurn = null;

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

    const author = document.createElement("span");
    author.className = "chat-author";
    author.textContent = role === "assistant" ? "portfolio.ai" : "visitor";
    message.appendChild(author);

    const content = document.createElement("p");
    content.textContent = text;
    message.appendChild(content);
    chatLog.insertBefore(message, chatSpacer.isConnected ? chatSpacer : null);
    chatLog.scrollTop = chatLog.scrollHeight;
    return message;
  };

  const enterChatMode = () => {
    if (!heroConsole || heroConsole.classList.contains("is-chatting")) return;

    heroConsole.classList.add("is-chatting");
    if (consoleContext) consoleContext.textContent = "chat";
    if (consoleSystems) consoleSystems.setAttribute("aria-hidden", "true");
    if (consoleExit) consoleExit.tabIndex = 0;
    if (chatLog && !chatSpacer.isConnected) chatLog.appendChild(chatSpacer);
  };

  const exitChatMode = () => {
    if (!heroConsole) return;

    heroConsole.classList.remove("is-chatting");
    if (consoleContext) consoleContext.textContent = "systems";
    if (consoleSystems) consoleSystems.removeAttribute("aria-hidden");
    if (consoleExit) consoleExit.tabIndex = -1;
    if (chatLog) chatLog.innerHTML = "";
    chatSpacer.style.height = "";
    lastTurn = null;
    conversation.length = 0;
    if (chatDiscovery) chatDiscovery.hidden = false;
    if (chatInput) {
      chatInput.value = "";
      chatForm?.classList.remove("has-value");
    }
  };

  const setChatBusy = (busy) => {
    if (chatInput) chatInput.disabled = busy;
    if (chatForm) chatForm.querySelector("button").disabled = busy;
  };

  const positionConversationTurn = (userMessage, assistantMessage) => {
    if (!chatLog || !userMessage || !assistantMessage) return;

    lastTurn = { user: userMessage, assistant: assistantMessage };

    const turnHeight =
      assistantMessage.offsetTop + assistantMessage.offsetHeight - userMessage.offsetTop;

    if (chatSpacer.isConnected) {
      chatSpacer.style.height = `${Math.max(chatLog.clientHeight - turnHeight - 24, 0)}px`;
      chatLog.scrollTop = userMessage.offsetTop;
      return;
    }

    chatLog.scrollTop =
      turnHeight <= chatLog.clientHeight
        ? userMessage.offsetTop
        : assistantMessage.offsetTop;
  };

  const refreshTurnPosition = () => {
    if (lastTurn) positionConversationTurn(lastTurn.user, lastTurn.assistant);
  };

  const ensureConsoleVisible = () => {
    if (!heroConsole) return;

    const rect = heroConsole.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      heroConsole.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const submitQuestion = async (question) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || !chatForm || !chatInput) return;

    enterChatMode();
    const userMessage = addMessage("user", cleanQuestion);
    conversation.push({ role: "user", text: cleanQuestion });
    if (chatDiscovery) chatDiscovery.hidden = true;
    chatInput.value = "";
    chatForm.classList.remove("has-value");
    setChatBusy(true);

    const loadingMessage = addMessage("assistant", "Thinking", true);
    positionConversationTurn(userMessage, loadingMessage);

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanQuestion,
          history: conversation.slice(-6, -1)
        })
      });

      const isJson = response.headers.get("content-type")?.includes("application/json");
      const payload = isJson ? await response.json() : null;
      if (!response.ok) {
        throw new Error(payload?.error || "The portfolio assistant is unavailable.");
      }

      if (typeof payload?.answer !== "string") {
        throw new Error("The portfolio assistant returned an invalid response.");
      }

      const answer = payload.answer.trim();
      conversation.push({ role: "assistant", text: answer });
      loadingMessage.querySelector("p").textContent = answer;
      loadingMessage.classList.remove("is-loading");
      positionConversationTurn(userMessage, loadingMessage);
    } catch (error) {
      loadingMessage.querySelector("p").textContent = error.message;
      loadingMessage.classList.remove("is-loading");
      positionConversationTurn(userMessage, loadingMessage);
    } finally {
      setChatBusy(false);
      chatInput.focus({ preventScroll: true });
    }
  };

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitQuestion(chatInput.value);
    });

    chatInput.addEventListener("input", () => {
      chatForm.classList.toggle("has-value", chatInput.value.trim().length > 0);
    });

    chatDiscovery?.addEventListener("click", () => {
      submitQuestion(chatDiscovery.dataset.question);
    });

    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && heroConsole?.classList.contains("is-chatting")) {
        exitChatMode();
      }
    });

    consoleExit?.addEventListener("click", () => {
      exitChatMode();
      chatInput.focus();
    });

    consoleSystems?.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "max-height") return;

      refreshTurnPosition();
      if (heroConsole?.classList.contains("is-chatting")) ensureConsoleVisible();
    });

    window.addEventListener("resize", refreshTurnPosition);

    heroConsole?.addEventListener("click", (event) => {
      if (!event.target.closest("a, button")) chatInput.focus();
    });
  }

  chatLog?.addEventListener(
    "wheel",
    (event) => {
      const atTop = chatLog.scrollTop <= 0;
      const atBottom = Math.ceil(chatLog.scrollTop + chatLog.clientHeight) >= chatLog.scrollHeight;

      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
})();
