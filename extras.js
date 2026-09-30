/* NewsTab extras: apps, todos, theme, saved, greeting, web search */
(function () {
  const DEFAULT_APPS = [
    { id: "gsc", name: "Search Console", url: "https://search.google.com/search-console", tint: "#4285f4" },
    { id: "ga4", name: "Analytics", url: "https://analytics.google.com/", tint: "#e37400" },
    { id: "psi", name: "PageSpeed", url: "https://pagespeed.web.dev/", tint: "#0f9d58" },
    { id: "trends", name: "Trends", url: "https://trends.google.com/", tint: "#1a73e8" },
    { id: "gemini", name: "Gemini", url: "https://gemini.google.com/", tint: "#4f7cf7" },
    { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/", tint: "#10a37f" },
    { id: "claude", name: "Claude", url: "https://claude.ai/", tint: "#d97757" },
    { id: "perplexity", name: "Perplexity", url: "https://www.perplexity.ai/", tint: "#20808d" },
    { id: "gads", name: "Google Ads", url: "https://ads.google.com/", tint: "#1a73e8" },
    { id: "gtm", name: "Tag Manager", url: "https://tagmanager.google.com/", tint: "#246fdb" },
    { id: "keep", name: "Keep", url: "https://keep.google.com/", tint: "#f9ab00" },
    { id: "mail", name: "Gmail", url: "https://mail.google.com/", tint: "#c5221f" },
  ];

  const TODO_PRAISE = [
    "آفرین! یکی دیگه انجام شد",
    "عالی، همین‌طور ادامه بده",
    "تیک خورد! یک قدم جلوتر",
    "دمت گرم، انجام شد",
    "این یکی هم تموم شد",
  ];

  let customApps = [];
  let hiddenApps = [];
  let todos = [];
  let savedItems = [];

  function safeAppUrl(url) {
    try {
      const u = new URL(String(url || "").trim());
      return u.protocol === "https:" ? u.toString() : null;
    } catch (e) {
      return null;
    }
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function todayKey() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
  }

  function greetingText(d) {
    const h = d.getHours();
    if (h < 5) return "شب خوش";
    if (h < 12) return "صبح بخیر";
    if (h < 17) return "روز بخیر";
    if (h < 21) return "عصر بخیر";
    return "شب بخیر";
  }

  function persistExtras() {
    chrome.storage.local.set({ customApps, hiddenApps, todos, savedItems });
  }

  function syncThemeBoot(mode) {
    try {
      if (mode === "light" || mode === "dark") localStorage.setItem("nt.theme", mode);
      else localStorage.removeItem("nt.theme");
    } catch (e) {}
  }

  function visibleApps() {
    const hidden = new Set(hiddenApps);
    return DEFAULT_APPS.filter((a) => !hidden.has(a.id)).concat(
      customApps.filter((a) => !hidden.has(a.id))
    );
  }

  function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === "light" || mode === "dark") root.dataset.theme = mode;
    else delete root.dataset.theme;
    syncThemeBoot(mode);
    const btn = document.getElementById("themeBtn");
    if (btn) {
      const label =
        mode === "light" ? "پوسته: روشن" : mode === "dark" ? "پوسته: تیره" : "پوسته: سیستم";
      const span = btn.querySelector("span");
      if (span) span.textContent = label;
    }
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-theme-set") === mode);
    });
  }

  function setTheme(mode) {
    if (typeof themeMode !== "undefined") themeMode = mode;
    chrome.storage.local.set({ themeMode: mode });
    applyTheme(mode);
  }

  function cycleTheme() {
    const cur = typeof themeMode !== "undefined" ? themeMode : "system";
    setTheme(cur === "system" ? "light" : cur === "light" ? "dark" : "system");
  }

  function updateGreeting() {
    const el = document.getElementById("greetingText");
    const wrap = document.getElementById("greetingSection");
    if (!wrap || !el) return;
    const on = typeof showGreeting === "undefined" ? true : !!showGreeting;
    wrap.style.display = on ? "" : "none";
    if (on) el.textContent = greetingText(new Date());
  }

  function applyWebSearchVisibility() {
    const input = document.getElementById("searchInput");
    const hint = document.getElementById("searchHint");
    const on = typeof showWebSearch === "undefined" || !!showWebSearch;
    if (input) input.placeholder = on ? "فیلتر تیترها… یا Enter برای جستجو در گوگل" : "فیلتر تیترها…";
    if (hint) hint.hidden = !on;
  }

  function closePopovers(except) {
    document.querySelectorAll(".hdr-pop.is-open").forEach(function (pop) {
      if (pop === except) return;
      pop.classList.remove("is-open");
      const panel = pop.querySelector(".hdr-pop__panel");
      const btn = pop.querySelector(".hdr-pop__btn");
      if (panel) panel.hidden = true;
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  function togglePopover(pop) {
    const panel = pop.querySelector(".hdr-pop__panel");
    const btn = pop.querySelector(".hdr-pop__btn");
    if (!panel) return;
    const open = panel.hidden;
    closePopovers(pop);
    panel.hidden = !open;
    pop.classList.toggle("is-open", open);
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      const field = panel.querySelector("input");
      if (field) field.focus();
    }
  }

  function renderApps() {
    const section = document.getElementById("appsSection");
    const list = document.getElementById("appsList");
    if (!section || !list) return;
    const on = typeof showApps === "undefined" ? true : !!showApps;
    section.style.display = on ? "" : "none";
    if (!on) {
      if (section.classList.contains("is-open")) closePopovers();
      return;
    }
    list.innerHTML = visibleApps()
      .map(function (a) {
        const href = safeAppUrl(a.url);
        if (!href) return "";
        return (
          '<a class="app-chip" href="' +
          esc(href) +
          '" target="_blank" rel="noopener noreferrer" title="' +
          esc(a.name) +
          '" style="--app-tint:' +
          esc(a.tint || "#6ec9d9") +
          '"><span class="app-chip__dot"></span><span class="app-chip__name">' +
          esc(a.name) +
          "</span></a>"
        );
      })
      .join("");
  }

  function renderTodos() {
    const section = document.getElementById("todosSection");
    const list = document.getElementById("todosList");
    const meta = document.getElementById("todosMeta");
    if (!section || !list) return;
    const on = typeof showTodos === "undefined" ? true : !!showTodos;
    section.style.display = on ? "" : "none";
    if (!on) {
      if (section.classList.contains("is-open")) closePopovers();
      return;
    }
    const day = todayKey();
    const items = todos.filter((t) => t.day === day);
    const done = items.filter((t) => t.done).length;
    if (meta) meta.textContent = items.length ? done + " از " + items.length : "";
    const badge = document.getElementById("todosBadge");
    if (badge) {
      const left = items.length - done;
      badge.textContent = String(left);
      badge.hidden = left <= 0;
    }
    if (!items.length) {
      list.innerHTML = '<li class="todo-empty">برای امروز کاری ثبت نشده</li>';
      return;
    }
    list.innerHTML = items
      .map(
        (t) =>
          '<li class="todo-item' +
          (t.done ? " is-done" : "") +
          '" data-todo-id="' +
          esc(t.id) +
          '"><button type="button" class="todo-check" aria-label="انجام">' +
          (t.done ? "✓" : "") +
          '</button><span class="todo-text">' +
          esc(t.text) +
          '</span><button type="button" class="todo-del" aria-label="حذف">✕</button></li>'
      )
      .join("");
  }

  function showPraise(text) {
    let el = document.getElementById("todoPraise");
    if (!el) {
      el = document.createElement("div");
      el.id = "todoPraise";
      el.className = "todo-praise";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(showPraise._t);
    showPraise._t = setTimeout(function () {
      el.classList.remove("show");
    }, 1800);
  }

  function burstConfetti(x, y) {
    const wrap = document.createElement("div");
    wrap.className = "todo-burst";
    wrap.style.left = x + "px";
    wrap.style.top = y + "px";
    const colors = ["#6ec9d9", "#8f88f0", "#f5b400", "#f09898", "#7dcea0"];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("span");
      p.style.setProperty("--dx", (Math.random() * 120 - 60).toFixed(1) + "px");
      p.style.setProperty("--dy", (-20 - Math.random() * 80).toFixed(1) + "px");
      p.style.setProperty("--rot", (Math.random() * 180 - 90).toFixed(1) + "deg");
      p.style.background = colors[i % 5];
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(function () {
      wrap.remove();
    }, 900);
  }

  function addTodo(text) {
    const t = String(text || "").trim();
    if (!t) return;
    todos.unshift({ id: uid(), text: t, done: false, day: todayKey() });
    if (todos.length > 80) todos = todos.slice(0, 80);
    persistExtras();
    renderTodos();
  }

  function toggleTodo(id, originEl) {
    const item = todos.find((t) => t.id === id);
    if (!item) return;
    item.done = !item.done;
    const r = originEl ? originEl.getBoundingClientRect() : null;
    persistExtras();
    renderTodos();
    if (item.done) {
      showPraise(TODO_PRAISE[Math.floor(Math.random() * TODO_PRAISE.length)]);
      if (r) burstConfetti(r.left + r.width / 2, r.top + r.height / 2);
    }
  }

  function removeTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    persistExtras();
    renderTodos();
  }

  function isSaved(link) {
    return savedItems.some((s) => s.link === link);
  }

  function toggleSaved(item) {
    if (!item || !item.link || !safeAppUrl(item.link)) return;
    const idx = savedItems.findIndex((s) => s.link === item.link);
    if (idx >= 0) savedItems.splice(idx, 1);
    else {
      savedItems.unshift({ link: item.link, title: item.title || item.link, savedAt: Date.now() });
      if (savedItems.length > 200) savedItems = savedItems.slice(0, 200);
    }
    persistExtras();
    renderSavedPanel();
    document.querySelectorAll(".save-btn").forEach((btn) => {
      if (btn.dataset.link !== item.link) return;
      btn.classList.toggle("is-saved", isSaved(item.link));
      btn.title = isSaved(item.link) ? "حذف از ذخیره‌ها" : "ذخیره";
    });
  }

  function renderSavedPanel() {
    const list = document.getElementById("savedList");
    const count = document.getElementById("savedCount");
    if (count) {
      count.textContent = String(savedItems.length);
      count.hidden = !savedItems.length;
    }
    if (!list) return;
    if (!savedItems.length) {
      list.innerHTML = '<div class="saved-empty">هنوز خبری ذخیره نشده</div>';
      return;
    }
    list.innerHTML = savedItems
      .map(function (s) {
        const href = safeAppUrl(s.link);
        if (!href) return "";
        return (
          '<div class="saved-row"><a href="' +
          esc(href) +
          '" target="_blank" rel="noopener noreferrer">' +
          esc(s.title) +
          '</a><button type="button" class="saved-remove" data-link="' +
          esc(s.link) +
          '" aria-label="حذف">✕</button></div>'
        );
      })
      .join("");
  }

  function openSavedPanel() {
    const ov = document.getElementById("savedOverlay");
    if (!ov) return;
    renderSavedPanel();
    ov.classList.add("open");
  }

  function closeSavedPanel() {
    const ov = document.getElementById("savedOverlay");
    if (ov) ov.classList.remove("open");
  }

  function enhanceFeedList(list) {
    if (!list) return;
    const on = typeof showSaved === "undefined" ? true : !!showSaved;
    list.querySelectorAll(".feed-item").forEach((li) => {
      const existing = li.querySelector(".save-btn");
      if (!on) {
        if (existing) existing.remove();
        li.classList.remove("has-save");
        return;
      }
      if (existing) return;
      const a = li.querySelector("a");
      if (!a) return;
      const link = a.getAttribute("href");
      const titleEl = a.querySelector(".feed-item__title");
      const title = (titleEl || a).textContent || "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "save-btn" + (isSaved(link) ? " is-saved" : "");
      btn.title = isSaved(link) ? "حذف از ذخیره‌ها" : "ذخیره";
      btn.dataset.link = link;
      btn.textContent = "★";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved({ link: link, title: title });
      });
      li.classList.add("has-save");
      li.appendChild(btn);
    });
  }

  function wireUi() {
    document.querySelectorAll(".hdr-pop").forEach(function (pop) {
      const btn = pop.querySelector(".hdr-pop__btn");
      if (btn) {
        btn.addEventListener("click", function () {
          togglePopover(pop);
        });
      }
    });
    document.addEventListener("click", function (e) {
      const inside = e.composedPath().some(function (n) {
        return n.classList && n.classList.contains("hdr-pop");
      });
      if (!inside) closePopovers();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      closePopovers();
      closeSavedPanel();
    });
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.addEventListener("click", function () {
        setTheme(b.getAttribute("data-theme-set"));
      });
    });

    const todoForm = document.getElementById("todoForm");
    if (todoForm) {
      todoForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const input = document.getElementById("todoInput");
        addTodo(input.value);
        input.value = "";
      });
    }
    const todosList = document.getElementById("todosList");
    if (todosList) {
      todosList.addEventListener("click", function (e) {
        const row = e.target.closest("[data-todo-id]");
        if (!row) return;
        const id = row.getAttribute("data-todo-id");
        if (e.target.closest(".todo-del")) removeTodo(id);
        else if (e.target.closest(".todo-check") || e.target.classList.contains("todo-text")) {
          toggleTodo(id, e.target);
        }
      });
    }
    const savedOpen = document.getElementById("savedOpenBtn");
    if (savedOpen) savedOpen.addEventListener("click", openSavedPanel);
    const savedClose = document.getElementById("savedCloseBtn");
    if (savedClose) savedClose.addEventListener("click", closeSavedPanel);
    const savedOverlay = document.getElementById("savedOverlay");
    if (savedOverlay) {
      savedOverlay.addEventListener("click", function (e) {
        if (e.target === savedOverlay) closeSavedPanel();
      });
    }
    const savedList = document.getElementById("savedList");
    if (savedList) {
      savedList.addEventListener("click", function (e) {
        const btn = e.target.closest(".saved-remove");
        if (!btn) return;
        toggleSaved({ link: btn.getAttribute("data-link"), title: "" });
      });
    }
    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn) themeBtn.addEventListener("click", cycleTheme);
  }

  function applyAllVisibility() {
    applyTheme(typeof themeMode !== "undefined" ? themeMode : "system");
    updateGreeting();
    applyWebSearchVisibility();
    renderApps();
    renderTodos();
    const savedBtn = document.getElementById("savedOpenBtn");
    if (savedBtn) {
      const on = typeof showSaved === "undefined" ? true : !!showSaved;
      savedBtn.style.display = on ? "" : "none";
      if (!on) closeSavedPanel();
    }
    document.querySelectorAll(".feed-items").forEach(enhanceFeedList);
  }

  function loadAndInit(done) {
    chrome.storage.local.get(["customApps", "hiddenApps", "todos", "savedItems"], function (res) {
      customApps = Array.isArray(res.customApps) ? res.customApps : [];
      hiddenApps = Array.isArray(res.hiddenApps) ? res.hiddenApps : [];
      todos = Array.isArray(res.todos) ? res.todos : [];
      savedItems = Array.isArray(res.savedItems) ? res.savedItems : [];
      wireUi();
      applyAllVisibility();
      if (done) done();
    });
  }

  window.NewsTabExtras = {
    loadAndInit: loadAndInit,
    applyAllVisibility: applyAllVisibility,
    updateGreeting: updateGreeting,
    enhanceFeedList: enhanceFeedList,
    cycleTheme: cycleTheme,
    applyTheme: applyTheme,
    renderApps: renderApps,
    renderTodos: renderTodos,
    isSaved: isSaved,
  };
})();
