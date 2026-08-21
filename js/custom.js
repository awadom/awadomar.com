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

  const INLINE_PATTERN = new RegExp(
    [
      "\\*\\*([^*]+)\\*\\*",
      "__([^_]+)__",
      "`([^`]+)`",
      "\\[([^\\]]+)\\]\\(([^\\s)]+)\\)",
      "\\*([^*\\s][^*\\n]*?)\\*",
      "((?:https?://|www\\.)[^\\s<>()]*[^\\s<>().,;:!?])",
      "([\\w.+-]+@[\\w-]+\\.[\\w.-]+[\\w])"
    ].join("|"),
    "g"
  );

  const safeUrl = (value) => {
    const candidate = /^(https?:|mailto:)/i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(candidate);
      return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  };

  const appendLink = (parent, href, label) => {
    const url = safeUrl(href);
    if (!url) {
      parent.appendChild(document.createTextNode(label));
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.textContent = label;
    if (!url.startsWith("mailto:")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    parent.appendChild(link);
  };

  const appendInline = (parent, text) => {
    let cursor = 0;

    for (const match of text.matchAll(INLINE_PATTERN)) {
      const [raw, bold, boldAlt, code, linkLabel, linkHref, italic, url, email] = match;

      if (match.index > cursor) {
        parent.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      }
      cursor = match.index + raw.length;

      if (bold || boldAlt) {
        const strong = document.createElement("strong");
        appendInline(strong, bold || boldAlt);
        parent.appendChild(strong);
      } else if (code) {
        const node = document.createElement("code");
        node.textContent = code;
        parent.appendChild(node);
      } else if (linkLabel) {
        appendLink(parent, linkHref, linkLabel);
      } else if (italic) {
        const em = document.createElement("em");
        appendInline(em, italic);
        parent.appendChild(em);
      } else if (url) {
        appendLink(parent, url, url.replace(/^https?:\/\//, ""));
      } else if (email) {
        appendLink(parent, `mailto:${email}`, email);
      }
    }

    if (cursor < text.length) {
      parent.appendChild(document.createTextNode(text.slice(cursor)));
    }
  };

  const BULLET_PATTERN = /^\s*[-*•]\s+(.*)$/;
  const ORDERED_PATTERN = /^\s*\d{1,2}[.)]\s+(.*)$/;
  const HEADING_PATTERN = /^\s{0,3}(#{1,6})\s+(.*)$/;

  const renderMarkdown = (text) => {
    const fragment = document.createDocumentFragment();
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    let paragraph = [];
    let list = null;
    let codeBlock = null;

    const flushParagraph = () => {
      if (!paragraph.length) return;

      const node = document.createElement("p");
      appendInline(node, paragraph.join(" "));
      fragment.appendChild(node);
      paragraph = [];
    };

    const flushList = () => {
      list = null;
    };

    const openList = (tag) => {
      if (list?.tagName.toLowerCase() === tag) return list;

      flushParagraph();
      list = document.createElement(tag);
      list.className = "chat-list";
      fragment.appendChild(list);
      return list;
    };

    for (const line of lines) {
      if (/^\s*```/.test(line)) {
        if (codeBlock) {
          codeBlock = null;
        } else {
          flushParagraph();
          flushList();
          const pre = document.createElement("pre");
          codeBlock = document.createElement("code");
          pre.appendChild(codeBlock);
          fragment.appendChild(pre);
        }
        continue;
      }

      if (codeBlock) {
        codeBlock.textContent += `${codeBlock.textContent ? "\n" : ""}${line}`;
        continue;
      }

      if (!line.trim()) {
        flushParagraph();
        flushList();
        continue;
      }

      const heading = line.match(HEADING_PATTERN);
      if (heading) {
        flushParagraph();
        flushList();
        const node = document.createElement("p");
        node.className = "chat-heading";
        appendInline(node, heading[2]);
        fragment.appendChild(node);
        continue;
      }

      const bullet = line.match(BULLET_PATTERN);
      const ordered = bullet ? null : line.match(ORDERED_PATTERN);
      if (bullet || ordered) {
        const item = document.createElement("li");
        appendInline(item, (bullet || ordered)[1]);
        openList(bullet ? "ul" : "ol").appendChild(item);
        continue;
      }

      if (list) {
        const item = list.lastElementChild;
        if (item) {
          item.appendChild(document.createTextNode(" "));
          appendInline(item, line.trim());
          continue;
        }
      }

      paragraph.push(line.trim());
    }

    flushParagraph();
    return fragment;
  };

  const setMessageContent = (message, text, markdown = false) => {
    const body = message?.querySelector(".chat-body");
    if (!body) return;

    if (markdown) {
      body.replaceChildren(renderMarkdown(text));
      if (!body.childElementCount) body.replaceChildren(renderMarkdown(""));
      return;
    }

    const node = document.createElement("p");
    node.textContent = text;
    body.replaceChildren(node);
  };

  const addMessage = (role, text, loading = false) => {
    if (!chatLog) return null;

    const message = document.createElement("div");
    message.className = `chat-message ${role}${loading ? " is-loading" : ""}`;

    const author = document.createElement("span");
    author.className = "chat-author";
    author.textContent = role === "assistant" ? "portfolio.ai" : "visitor";
    message.appendChild(author);

    const body = document.createElement("div");
    body.className = "chat-body";
    message.appendChild(body);
    setMessageContent(message, text);

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
      loadingMessage.classList.remove("is-loading");
      setMessageContent(loadingMessage, answer, true);
      positionConversationTurn(userMessage, loadingMessage);
    } catch (error) {
      loadingMessage.classList.remove("is-loading");
      setMessageContent(loadingMessage, error.message);
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
