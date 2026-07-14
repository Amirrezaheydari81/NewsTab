const DEFAULT_FEEDS = [
  { id: "bi", name: "Business Insider", url: "https://feeds.businessinsider.com/custom/all" },
  { id: "gbh", name: "GBHackers", url: "https://gbhackers.com/feed/" },
  { id: "wired-main", name: "Wired", url: "https://www.wired.com/feed/rss" },
  { id: "g360-main", name: "Gadgets360", url: "https://www.gadgets360.com/rss/feeds" },
  { id: "better-programming-medium", name: "Better Programming - Medium", url: "https://medium.com/feed/better-programming" },
  { id: "developer-tea", name: "Developer Tea", url: "https://feeds.simplecast.com/dLRotFGk" },
  { id: "gitlab", name: "GitLab", url: "https://about.gitlab.com/atom.xml" },
  { id: "hanselminutes-with-scott-hanselman", name: "Hanselminutes with Scott Hanselman", url: "https://feeds.simplecast.com/gvtxUiIf" },
  { id: "infoq", name: "InfoQ", url: "https://feed.infoq.com" },
  { id: "jetbrains-blog", name: "JetBrains Blog", url: "https://blog.jetbrains.com/feed" },
  { id: "martin-fowler", name: "Martin Fowler", url: "https://martinfowler.com/feed.atom" },
  { id: "netflix-techblog-medium", name: "Netflix TechBlog - Medium", url: "https://netflixtechblog.com/feed" },
  { id: "software-defined-talk", name: "Software Defined Talk", url: "https://feeds.fireside.fm/sdt/rss" },
  { id: "stack-abuse", name: "Stack Abuse", url: "https://stackabuse.com/rss/" },
  { id: "stack-overflow-blog", name: "Stack Overflow Blog", url: "https://stackoverflow.blog/feed/" },
  { id: "the-airbnb-tech-blog-medium", name: "The Airbnb Tech Blog - Medium", url: "https://medium.com/feed/airbnb-engineering" },
  { id: "the-cynical-developer", name: "The Cynical Developer", url: "https://cynicaldeveloper.com/feed/podcast" },
  { id: "the-github-blog", name: "The GitHub Blog", url: "https://github.blog/feed/" },
  { id: "the-stack-overflow-podcast", name: "The Stack Overflow Podcast", url: "https://feeds.simplecast.com/XA_851k3" },
  { id: "hackaday", name: "Hackaday", url: "https://hackaday.com/blog/feed/" },
  { id: "ikea-hackers", name: "IKEA Hackers", url: "https://www.ikeahackers.net/feed" },
  { id: "hacker-news", name: "Hacker News", url: "https://news.ycombinator.com/rss" },
];

let ITEMS_PER_FEED = 5;
let AUTO_REFRESH_MS = 12 * 60 * 1000;
let TRANSLATE_MAX_WORKERS = 3;
const TRANSLATE_GAP_MS = 150;

const grid = document.getElementById("feedsGrid");
const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date");
const overlay = document.getElementById("overlay");
const settingsBtn = document.getElementById("settingsBtn");
const closeSettings = document.getElementById("closeSettings");
const feedListEl = document.getElementById("feedList");
const addFeedForm = document.getElementById("addFeedForm");
const translateBtn = document.getElementById("translateBtn");
const refreshBtn = document.getElementById("refreshBtn");
const lowPowerBtn = document.getElementById("lowPowerBtn");
const sortBtn = document.getElementById("sortBtn");
const searchInput = document.getElementById("searchInput");
const lastUpdatedEl = document.getElementById("lastUpdated");
const menuBtn = document.getElementById("menuBtn");
const menuVertical = document.getElementById("menuVertical");
const quotesBtn = document.getElementById("quotesBtn");
const tickersBtn = document.getElementById("tickersBtn");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const emergencyBtn = document.getElementById("emergencyBtn");

let showFa = false;
let translationCache = {};
let readLinks = new Set();
let feedCache = {};
let groupsCollapsed = {};
let lastUpdatedAt = null;
let cardRefreshers = []; // [{feed, reload}]
let lowPowerMode = false;
let autoRefreshIntervalId = null;
let sortBy = "none";
let showQuotes = true;
let showTickers = true;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
/* ---------- FETCH limit ---------- */
let FETCH_MAX_WORKERS = 10;
let CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12000;
let fetchQueue = [];
let fetchWorkers = 0;
const pendingFetches = new Map();

function enqueueFetch(job) {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  fetchQueue.push(async () => {
    try {
      await job();
      resolve();
    } catch (err) {
      reject(err);
    }
  });

  pumpFetchQueue();
  return promise;
}
function pumpFetchQueue() {
  while (fetchWorkers < FETCH_MAX_WORKERS && fetchQueue.length) {
    const job = fetchQueue.shift();
    fetchWorkers++;
    job().finally(() => {
      fetchWorkers--;
      pumpFetchQueue();
    });
  }
}
/* ---------- storage ---------- */

function getFeeds() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["feeds"], (res) => {
      resolve(res.feeds && res.feeds.length ? res.feeds : DEFAULT_FEEDS);
    });
  });
}
function saveFeeds(feeds) {
  return new Promise((resolve) => chrome.storage.local.set({ feeds }, resolve));
}

function loadAppState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["showFa", "translationCache", "readLinks", "feedCache", "groupsCollapsed", "lowPowerMode", "sortBy", "showQuotes", "showTickers"],
      (res) => {
        showFa = res.showFa === undefined ? true : !!res.showFa;
        translationCache = res.translationCache || {};
        readLinks = new Set(res.readLinks || []);
        feedCache = res.feedCache || {};
        groupsCollapsed = res.groupsCollapsed || {};
        lowPowerMode = !!res.lowPowerMode;
        applyLowPowerMode();
        sortBy = res.sortBy || "none";
        showQuotes = res.showQuotes === undefined ? true : !!res.showQuotes;
        showTickers = res.showTickers === undefined ? true : !!res.showTickers;
        resolve();
      }
    );
  });
}

function persistTranslationCache() {
  const keys = Object.keys(translationCache);
  if (keys.length > 1500) {
    const trimmed = {};
    keys.slice(keys.length - 1000).forEach((k) => (trimmed[k] = translationCache[k]));
    translationCache = trimmed;
  }
  chrome.storage.local.set({ translationCache });
}

function persistReadLinks() {
  const arr = Array.from(readLinks);
  const trimmed = arr.length > 800 ? arr.slice(arr.length - 800) : arr;
  readLinks = new Set(trimmed);
  chrome.storage.local.set({ readLinks: trimmed });
}

function persistFeedCache() {
  chrome.storage.local.set({ feedCache });
}

function persistGroupsCollapsed() {
  chrome.storage.local.set({ groupsCollapsed });
}

function applyLowPowerMode() {
  if (lowPowerMode) {
    FETCH_MAX_WORKERS = 3;
    ITEMS_PER_FEED = 2;
    CACHE_TTL_MS = 15 * 60 * 1000;
    AUTO_REFRESH_MS = 30 * 60 * 1000;
    TRANSLATE_MAX_WORKERS = 1;
  } else {
    FETCH_MAX_WORKERS = 10;
    ITEMS_PER_FEED = 5;
    CACHE_TTL_MS = 5 * 60 * 1000;
    AUTO_REFRESH_MS = 12 * 60 * 1000;
    TRANSLATE_MAX_WORKERS = 3;
  }
}

function persistLowPowerMode() {
  chrome.storage.local.set({ lowPowerMode });
}

/* ---------- clock / last updated ---------- */

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  clockEl.textContent = `${h}:${m}`;
  dateEl.textContent = now.toLocaleDateString("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  updateLastUpdatedLabel();
}

function updateLastUpdatedLabel() {
  if (!lastUpdatedAt) {
    lastUpdatedEl.textContent = "";
    return;
  }
  const mins = Math.floor((Date.now() - lastUpdatedAt) / 60000);
  lastUpdatedEl.textContent =
    mins < 1 ? "به‌روزرسانی: همین الان" : `به‌روزرسانی: ${mins} دقیقه پیش`;
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ساعت پیش`;
  const days = Math.floor(hrs / 24);
  return `${days} روز پیش`;
}

function faviconFor(url) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return "";
  }
}

/* ---------- translation (throttled queue) ---------- */

let translateQueue = [];
let translateWorkers = 0;

function enqueueTranslation(node, title) {
  translateQueue.push({ node, title });
  pumpTranslateQueue();
}

function pumpTranslateQueue() {
  while (translateWorkers < TRANSLATE_MAX_WORKERS && translateQueue.length) {
    const job = translateQueue.shift();
    translateWorkers++;
    processTranslateJob(job).finally(() => {
      translateWorkers--;
      setTimeout(pumpTranslateQueue, TRANSLATE_GAP_MS);
    });
  }
}

async function processTranslateJob(job) {
  const fa = await translateText(job.title);
  job.node.classList.remove("pending");
  job.node.textContent = fa || "ترجمه در دسترس نیست";
}

async function translateText(text) {
  if (translationCache[text]) return translationCache[text];
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    const data = await res.json();
    const fa = data[0].map((chunk) => chunk[0]).join("");
    translationCache[text] = fa;
    persistTranslationCache();
    return fa;
  } catch {
    return null;
  }
}

function applyTranslations(listEl) {
  const nodes = listEl.querySelectorAll(".fa-translation.pending");
  nodes.forEach((node) => {
    enqueueTranslation(node, decodeURIComponent(node.dataset.title));
  });
}

/* ---------- RSS fetching ---------- */

async function fetchFeed(feed) {
  if (pendingFetches.has(feed.url)) {
    return pendingFetches.get(feed.url);
  }

  const promise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(feed.url, {
        credentials: "omit",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = new Error("http");
        err.kind = "http";
        err.status = res.status;
        throw err;
      }
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, "text/xml");
      if (xml.querySelector("parsererror")) {
        const err = new Error("parse");
        err.kind = "parse";
        throw err;
      }

      let nodes = Array.from(xml.querySelectorAll("item"));
      let isAtom = false;
      if (!nodes.length) {
        nodes = Array.from(xml.querySelectorAll("entry"));
        isAtom = true;
      }

      return nodes.slice(0, ITEMS_PER_FEED).map((node) => {
        const title = node.querySelector("title")?.textContent?.trim() || "(no title)";
        let link = "";
        if (isAtom) {
          const linkEl = node.querySelector("link[href]");
          link = linkEl ? linkEl.getAttribute("href") : "";
        } else {
          link = node.querySelector("link")?.textContent?.trim() || "";
        }
        const pubDate =
          node.querySelector("pubDate")?.textContent ||
          node.querySelector("updated")?.textContent ||
          node.querySelector("published")?.textContent ||
          "";
        return { title, link, pubDate };
      });
    } catch (err) {
      if (err.name === "AbortError") {
        const e = new Error("timeout");
        e.kind = "timeout";
        throw e;
      }
      if (err.kind) throw err;
      const e = new Error("network");
      e.kind = "network";
      throw e;
    } finally {
      pendingFetches.delete(feed.url);
    }
  })();

  pendingFetches.set(feed.url, promise);
  return promise;
}

function errorMessage(err) {
  switch (err && err.kind) {
    case "network":
      return "اتصال برقرار نشد";
    case "http":
      return `خطای سرور (${err.status})`;
    case "parse":
      return "فرمت فید نامعتبره";
    case "timeout":
      return "زمان بارگذاری فید به پایان رسید";
    default:
      return "این فید بارگذاری نشد";
  }
}

function sortItems(items) {
  if (sortBy === "none" || items.length < 2) return items;
  const sorted = items.slice().sort((a, b) => {
    const da = new Date(a.pubDate).getTime();
    const db = new Date(b.pubDate).getTime();
    return db - da;
  });
  return sorted;
}

function feedLatestDate(feed) {
  const cached = feedCache[feed.id];
  if (cached && cached.items && cached.items.length) {
    const times = cached.items.map((it) => new Date(it.pubDate).getTime()).filter((t) => !isNaN(t));
    if (times.length) return Math.max(...times);
  }
  return 0;
}

function sortFeeds(feeds) {
  if (sortBy !== "newest") return feeds;
  return feeds.slice().sort((a, b) => feedLatestDate(b) - feedLatestDate(a));
}

function toggleSort() {
  sortBy = sortBy === "newest" ? "none" : "newest";
  sortBtn.classList.toggle("on", sortBy === "newest");
  sortBtn.classList.toggle("active", sortBy === "newest");
  sortBtn.title = sortBy === "newest" ? "جدیدترین‌ها" : "مرتب‌سازی";
  chrome.storage.local.set({ sortBy });
  renderAll();
}

function toggleQuotes() {
  showQuotes = !showQuotes;
  const quoteSection = document.getElementById("quoteSection");
  if (quoteSection) {
    quoteSection.style.display = showQuotes ? "" : "none";
  }
  quotesBtn.classList.toggle("on", showQuotes);
  quotesBtn.classList.toggle("active", showQuotes);
  chrome.storage.local.set({ showQuotes });
}

function toggleTickers() {
  showTickers = !showTickers;
  const tickerSection = document.getElementById("tickerSection");
  if (tickerSection) {
    tickerSection.style.display = showTickers ? "" : "none";
  }
  tickersBtn.classList.toggle("on", showTickers);
  tickersBtn.classList.toggle("active", showTickers);
  chrome.storage.local.set({ showTickers });
}

function toggleMenu() {
  menuVertical.classList.toggle("open");
}

function clearCache() {
  feedCache = {};
  translationCache = {};
  readLinks = new Set();
  groupsCollapsed = {};
  chrome.storage.local.set({ feedCache: {}, translationCache: {}, readLinks: [], groupsCollapsed: {} });
  renderAll();
}

/* ---------- rendering ---------- */

function itemsHtml(items) {
  const sorted = sortItems(items);
  return sorted
    .map((it, idx) => {
      const isRead = readLinks.has(it.link);
      return `
      <li class="feed-item${isRead ? " read-item" : ""}" data-idx="${idx}">
        <a href="${it.link}" target="_blank" rel="noopener noreferrer" class="${isRead ? "read" : ""}" data-search="${escapeHtml(it.title.toLowerCase())}">
          ${escapeHtml(it.title)}
          <time>${timeAgo(it.pubDate)}</time>
        </a>
        ${showFa ? `<div class="fa-translation pending" data-title="${encodeURIComponent(it.title)}">در حال ترجمه…</div>` : ""}
      </li>`;
    })
    .join("");
}

function wireItemClicks(list) {
  list.querySelectorAll(".feed-item a").forEach((a) => {
    a.addEventListener("click", () => {
      readLinks.add(a.getAttribute("href"));
      a.classList.add("read");
      a.closest(".feed-item").classList.add("read-item");
      persistReadLinks();
    });
  });
}

function buildCard(feed, label) {
  const card = document.createElement("section");
  card.className = "feed-card loading";
  card.dataset.id = feed.id;
  card.innerHTML = `
    <div class="feed-card__head">
      <div class="feed-card__title">
        <span>${escapeHtml(label || feed.name)}</span>
      </div>

    </div>
    <ul class="feed-items"><li class="feed-item">در حال بارگذاری…</li></ul>
  `;
  return card;
}

async function loadCardContent(feed, card, isBackground = false) {
  const list = card.querySelector(".feed-items");
  const cached = feedCache[feed.id];
  const cacheFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (cacheFresh) {
    card.classList.remove("loading", "error");
    if (cached.items.length) {
      list.innerHTML = itemsHtml(cached.items);
      wireItemClicks(list);
      if (showFa) applyTranslations(list);
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
    return;
  }

  if (cached && cached.items.length) {
    card.classList.remove("loading", "error");
    list.innerHTML = itemsHtml(cached.items);
    wireItemClicks(list);
    if (showFa) applyTranslations(list);
    card.style.display = "";
  } else if (cached && !cached.items.length) {
    card.style.display = "none";
  }

  const doFetch = async () => {
    try {
      const items = await fetchFeed(feed);
      feedCache[feed.id] = { items, fetchedAt: Date.now() };
      persistFeedCache();
      card.classList.remove("loading", "error");
      if (!items.length) {
        list.innerHTML = `<li class="feed-item">خبری پیدا نشد</li>`;
        return;
      }
      card.style.display = "";
      list.innerHTML = itemsHtml(items);
      wireItemClicks(list);
      if (showFa) applyTranslations(list);
    } catch (err) {
      if (!cached) {
        card.classList.remove("loading");
        card.classList.add("error");
        list.innerHTML = `<li class="feed-item">${errorMessage(err)}</li>`;
        if (err && err.kind === "timeout") {
          setTimeout(() => {
            card.classList.remove("error");
            card.classList.add("loading");
            list.innerHTML = `<li class="feed-item">در حال تلاش مجدد...</li>`;
            loadCardContent(feed, card);
          }, 5000);
        }
      }
    }
  };

  if (isBackground || cached) {
    return enqueueFetch(doFetch);
  } else {
    return await doFetch();
  }
}

function groupKeyOf(feed) {
  if (feed.name.includes(" · ")) return feed.name.split(" · ")[0].trim();
  return null;
}

function showCachedOnly(feed, card) {
  const list = card.querySelector(".feed-items");
  const cached = feedCache[feed.id];
  card.classList.remove("loading", "error");
  if (cached && cached.items.length) {
    list.innerHTML = itemsHtml(cached.items);
    wireItemClicks(list);
    if (showFa) applyTranslations(list);
    card.style.display = "";
  } else {
    list.innerHTML = `<li class="feed-item">برای نمایش داده، از بخش تنظیمات روی به‌روزرسانی کلیک کنید</li>`;
  }
}

async function renderAll() {
  grid.innerHTML = "";
  cardRefreshers = [];
  const feeds = await getFeeds();

  const groups = new Map();
  const standalone = [];

  feeds.forEach((feed) => {
    const gKey = groupKeyOf(feed);
    if (gKey) {
      if (!groups.has(gKey)) groups.set(gKey, []);
      groups.get(gKey).push(feed);
    } else {
      standalone.push(feed);
    }
  });

  const sortedStandalone = sortFeeds(standalone);
  const sortedGroups = new Map();
  groups.forEach((members, groupName) => {
    sortedGroups.set(groupName, sortFeeds(members));
  });

  sortedStandalone.forEach((feed) => {
    const card = buildCard(feed);
    grid.appendChild(card);
    card._feed = feed;
    showCachedOnly(feed, card);
    cardRefreshers.push({ feed, reload: () => loadCardContent(feed, card) });
  });

  sortedGroups.forEach((members, groupName) => {
    const collapsed = !!groupsCollapsed[groupName];
    const wrap = document.createElement("div");
    wrap.className = "feed-group" + (collapsed ? " collapsed" : "");
    wrap.innerHTML = `
      <button class="feed-group__header" data-group="${escapeHtml(groupName)}">
        <span class="fg-arrow">▾</span>
        <span>${escapeHtml(groupName)}</span>
        <span class="fg-count">(${members.length})</span>
      </button>
      <div class="feed-group__body"></div>
    `;
    grid.appendChild(wrap);
    const body = wrap.querySelector(".feed-group__body");
    members.forEach((feed) => {
      const label = feed.name.split(" · ")[1] || feed.name;
      const card = buildCard(feed, label);
      body.appendChild(card);
      card._feed = feed;
      showCachedOnly(feed, card);
      cardRefreshers.push({ feed, reload: () => loadCardContent(feed, card) });
    });
  });

  lastUpdatedAt = Date.now();
  updateLastUpdatedLabel();
  applySearchFilter();
}

function refreshAllCards() {
  refreshBtn.classList.add("spinning");
  const promises = [];

  document.querySelectorAll(".feed-card[data-id]").forEach((card) => {
    const feed = card._feed;
    if (!feed) return;
    const existing = cardRefreshers.find((c) => c.feed.id === feed.id);
    if (existing) {
      promises.push(existing.reload());
    } else {
      promises.push(loadCardContent(feed, card));
      cardRefreshers.push({ feed, reload: () => loadCardContent(feed, card) });
    }
  });

  Promise.all(promises).finally(() => {
    lastUpdatedAt = Date.now();
    updateLastUpdatedLabel();
    refreshBtn.classList.remove("spinning");
  });
}

/* ---------- search ---------- */

function applySearchFilter() {
  const q = searchInput.value.trim().toLowerCase();
  document.querySelectorAll(".feed-item").forEach((li) => {
    const a = li.querySelector("a");
    if (!a) return;
    const text = a.dataset.search || "";
    li.classList.toggle("hidden", q.length > 0 && !text.includes(q));
  });
}

searchInput.addEventListener("input", applySearchFilter);

/* ---------- settings panel ---------- */

async function renderSettingsList() {
  const feeds = await getFeeds();
  feedListEl.innerHTML = feeds
    .map(
      (f, i) => `
    <div class="feed-row" data-id="${f.id}">
      <div class="fr-info">
        <div class="fr-name">${escapeHtml(f.name)}</div>
        <span class="fr-url">${escapeHtml(f.url)}</span>
      </div>
      <div class="fr-actions">
        <button class="fr-up" ${i === 0 ? "disabled" : ""} title="بالا">▲</button>
        <button class="fr-down" ${i === feeds.length - 1 ? "disabled" : ""} title="پایین">▼</button>
        <button class="fr-remove" title="حذف">✕</button>
      </div>
    </div>`
    )
    .join("");
}

settingsBtn.addEventListener("click", () => {
  overlay.classList.add("open");
  renderSettingsList();
});
closeSettings.addEventListener("click", () => overlay.classList.remove("open"));
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.classList.remove("open");
});

feedListEl.addEventListener("click", async (e) => {
  const row = e.target.closest(".feed-row");
  if (!row) return;
  const id = row.dataset.id;
  const feeds = await getFeeds();
  const idx = feeds.findIndex((f) => f.id === id);
  if (idx === -1) return;

  if (e.target.classList.contains("fr-remove")) {
    feeds.splice(idx, 1);
    await saveFeeds(feeds);
  } else if (e.target.classList.contains("fr-up") && idx > 0) {
    [feeds[idx - 1], feeds[idx]] = [feeds[idx], feeds[idx - 1]];
    await saveFeeds(feeds);
  } else if (e.target.classList.contains("fr-down") && idx < feeds.length - 1) {
    [feeds[idx + 1], feeds[idx]] = [feeds[idx], feeds[idx + 1]];
    await saveFeeds(feeds);
  } else {
    return;
  }
  renderSettingsList();
  renderAll();
});

addFeedForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("feedName").value.trim();
  const url = document.getElementById("feedUrl").value.trim();
  if (!name || !url) return;
  const feeds = await getFeeds();
  feeds.push({ id: uid(), name, url });
  await saveFeeds(feeds);
  addFeedForm.reset();
  renderSettingsList();
  renderAll();
});

/* ---------- group collapse toggle ---------- */

grid.addEventListener("click", (e) => {
  const header = e.target.closest(".feed-group__header");
  if (!header) return;
  const groupName = header.dataset.group;
  const wrap = header.closest(".feed-group");
  const collapsed = wrap.classList.toggle("collapsed");
  groupsCollapsed[groupName] = collapsed;
  persistGroupsCollapsed();

  if (!collapsed) {
    wrap.querySelectorAll(".feed-card").forEach((card) => {
      const feed = card._feed;
      if (!feed) return;
      if (!cardRefreshers.some((c) => c.feed.id === feed.id)) {
        loadCardContent(feed, card);
        cardRefreshers.push({ feed, reload: () => loadCardContent(feed, card) });
      }
    });
  }
});

/* ---------- translate toggle / manual refresh ---------- */

translateBtn.addEventListener("click", () => {
  showFa = !showFa;
  translateBtn.classList.toggle("on", showFa);
  translateBtn.classList.toggle("active", showFa);
  chrome.storage.local.set({ showFa });
  renderAll();
});

refreshBtn.addEventListener("click", () => refreshAllCards());

lowPowerBtn.addEventListener("click", () => {
  lowPowerMode = !lowPowerMode;
  lowPowerBtn.classList.toggle("on", lowPowerMode);
  lowPowerBtn.classList.toggle("active", lowPowerMode);
  applyLowPowerMode();
  persistLowPowerMode();
  if (autoRefreshIntervalId) clearInterval(autoRefreshIntervalId);
  autoRefreshIntervalId = setInterval(refreshAllCards, AUTO_REFRESH_MS);
  refreshAllCards();
});

sortBtn.addEventListener("click", toggleSort);

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenu();
});

emergencyBtn.addEventListener("click", () => {
  clearCache();
});

quotesBtn.addEventListener("click", () => {
  toggleQuotes();
});

tickersBtn.addEventListener("click", () => {
  toggleTickers();
});

clearCacheBtn.addEventListener("click", () => {
  clearCache();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".actions")) {
    menuVertical.classList.remove("open");
  }
});

/* ---------- init ---------- */

async function init() {
  updateClock();
  setInterval(updateClock, 30 * 1000);
  await loadAppState();
  translateBtn.classList.toggle("on", showFa);
  translateBtn.classList.toggle("active", showFa);
  lowPowerBtn.classList.toggle("on", lowPowerMode);
  lowPowerBtn.classList.toggle("active", lowPowerMode);
  sortBtn.classList.toggle("on", sortBy === "newest");
  sortBtn.classList.toggle("active", sortBy === "newest");
  sortBtn.title = sortBy === "newest" ? "جدیدترین‌ها" : "مرتب‌سازی";
  quotesBtn.classList.toggle("on", showQuotes);
  quotesBtn.classList.toggle("active", showQuotes);

  const quoteSection = document.getElementById("quoteSection");
  if (quoteSection) {
    quoteSection.style.display = showQuotes ? "" : "none";
  }

  tickersBtn.classList.toggle("on", showTickers);
  tickersBtn.classList.toggle("active", showTickers);

  const tickerSection = document.getElementById("tickerSection");
  if (tickerSection) {
    tickerSection.style.display = showTickers ? "" : "none";
  }

  renderAll();
  autoRefreshIntervalId = setInterval(refreshAllCards, AUTO_REFRESH_MS);
}

if (typeof module !== "undefined" && module.exports) {
  const state = {
    get showFa() { return showFa; },
    set showFa(v) { showFa = v; },
    get sortBy() { return sortBy; },
    set sortBy(v) { sortBy = v; },
    get lowPowerMode() { return lowPowerMode; },
    set lowPowerMode(v) { lowPowerMode = v; },
    get showQuotes() { return showQuotes; },
    set showQuotes(v) { showQuotes = v; },
    get showTickers() { return showTickers; },
    set showTickers(v) { showTickers = v; },
    get feedCache() { return feedCache; },
    set feedCache(v) { feedCache = v; },
    get readLinks() { return readLinks; },
    set readLinks(v) { readLinks = v; },
    get translationCache() { return translationCache; },
    set translationCache(v) { translationCache = v; },
    get groupsCollapsed() { return groupsCollapsed; },
    set groupsCollapsed(v) { groupsCollapsed = v; },
    get FETCH_MAX_WORKERS() { return FETCH_MAX_WORKERS; },
    set FETCH_MAX_WORKERS(v) { FETCH_MAX_WORKERS = v; },
    get ITEMS_PER_FEED() { return ITEMS_PER_FEED; },
    set ITEMS_PER_FEED(v) { ITEMS_PER_FEED = v; },
    get CACHE_TTL_MS() { return CACHE_TTL_MS; },
    set CACHE_TTL_MS(v) { CACHE_TTL_MS = v; },
    get AUTO_REFRESH_MS() { return AUTO_REFRESH_MS; },
    set AUTO_REFRESH_MS(v) { AUTO_REFRESH_MS = v; },
    get TRANSLATE_MAX_WORKERS() { return TRANSLATE_MAX_WORKERS; },
    set TRANSLATE_MAX_WORKERS(v) { TRANSLATE_MAX_WORKERS = v; },
    get FETCH_TIMEOUT_MS() { return FETCH_TIMEOUT_MS; },
    set FETCH_TIMEOUT_MS(v) { FETCH_TIMEOUT_MS = v; },
  };

  module.exports = {
    uid,
    escapeHtml,
    timeAgo,
    faviconFor,
    sortItems,
    sortFeeds,
    feedLatestDate,
    groupKeyOf,
    itemsHtml,
    wireItemClicks,
    buildCard,
    showCachedOnly,
    errorMessage,
    applyLowPowerMode,
    toggleSort,
    toggleQuotes,
    toggleTickers,
    toggleMenu,
    clearCache,
    persistLowPowerMode,
    persistGroupsCollapsed,
    persistReadLinks,
    persistFeedCache,
    persistTranslationCache,
    state,
  };
}

init();
